"use server";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";


export async function GET() {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("documents")
      .select("metadata");

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json([], { status: 200 });
    }

    const rows = (data || [])
      .map((r) => r.metadata)
      .filter(Boolean);

    // 🔥 GROUP BY NAME
    const grouped: Record<string, any> = {};

    for (const item of rows) {
      const name = item.name;

      if (!grouped[name]) {
        grouped[name] = {
          name: item.name,
          role: item.role,
          skills: new Set(),
          companies: new Set(),
        };
      }

      // merge skills
      (item.skills || []).forEach((s: string) =>
        grouped[name].skills.add(s)
      );

      // merge companies
      (item.companies || []).forEach((c: string) =>
        grouped[name].companies.add(c)
      );
    }

    // convert Sets → arrays
    const result = Object.values(grouped).map((p: any) => ({
      name: p.name,
      role: p.role,
      skills: Array.from(p.skills),
      companies: Array.from(p.companies),
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("API crash:", err);
    return NextResponse.json([], { status: 500 });
  }
}
