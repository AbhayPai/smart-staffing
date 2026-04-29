import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.-]/g, "_");
}

export async function POST(req: NextRequest) {
  const supabase = createClient();

  // 🔐 Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (!files.length) {
    return NextResponse.json(
      { success: false, error: "No files uploaded" },
      { status: 400 }
    );
  }

  const uploaded = [];

  for (const file of files) {
    try {
      // 📄 Only PDFs
      if (file.type !== "application/pdf") {
        uploaded.push({
          filename: file.name,
          skipped: true,
          reason: "invalid_type",
          message: `Only PDF files are allowed.`,
        });
        continue;
      }

      // 📏 File size validation
      if (file.size > MAX_FILE_SIZE) {
        uploaded.push({
          filename: file.name,
          skipped: true,
          reason: "file_too_large",
          message: `File "${file.name}" exceeds the 10MB limit.`,
        });
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      // 🔐 SHA-256 checksum
      const checksum = crypto
        .createHash("sha256")
        .update(buffer)
        .digest("hex");

      const safeName = sanitizeFileName(file.name);

      // 🆔 deterministic storage ID (prevents duplicates in bucket)
      const fid = `${safeName}`;

      // 🧾 1. Insert into DB first (atomic duplicate protection)
      const { error: dbInsertError } = await supabase
        .from("file_checksums")
        .insert({
          user_id: user.id,
          fid,
          filename: safeName,
          checksum,
        });

      // 🚨 Duplicate detected (race-safe via UNIQUE constraint)
      if (dbInsertError) {
        if (dbInsertError.code === "23505") {
          uploaded.push({
            filename: file.name,
            skipped: true,
            reason: "duplicate",
            message: "This file already exists.",
            checksum,
          });
          continue;
        }

        uploaded.push({
          filename: file.name,
          error: dbInsertError.message,
        });
        continue;
      }

      // ☁️ 2. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(fid, buffer, {
          contentType: "application/pdf",
          upsert: false,
        });

      // 🚨 rollback DB if storage fails
      if (uploadError) {
        await supabase
          .from("file_checksums")
          .delete()
          .eq("checksum", checksum);

        uploaded.push({
          filename: file.name,
          error: uploadError.message,
        });

        continue;
      }

      uploaded.push({
        fid,
        filename: safeName,
        checksum,
        skipped: false,
      });
    } catch (err: any) {
      uploaded.push({
        filename: file.name,
        error: err?.message || "Unknown error",
      });
    }
  }

  // 📊 Summary stats
  const tooLargeCount = uploaded.filter(
    (f) => f.reason === "file_too_large"
  ).length;

  const duplicateCount = uploaded.filter(
    (f) => f.reason === "duplicate"
  ).length;

  const hasError = uploaded.some((item) => item.error);
  const hasSuccess = uploaded.some(
    (item) => !item.error && !item.skipped
  );

  const message =
    tooLargeCount > 0 || duplicateCount > 0
      ? `${tooLargeCount ? `${tooLargeCount} file(s) exceeded 10MB. ` : ""}${
          duplicateCount ? `${duplicateCount} duplicate file(s) skipped.` : ""
        }`
      : "All files processed successfully.";

  return NextResponse.json(
    {
      success: hasSuccess && !hasError,
      message,
      uploaded,
    },
    {
      status: hasError ? 400 : 200,
    }
  );
}
