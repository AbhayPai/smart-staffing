"use client";

import { useEffect, useRef, useState } from "react";

type FileProgress = {
  file: File;
  progress: number;
  status: "uploading" | "done" | "error";
  message?: string;
};

export default function Page() {
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progressList, setProgressList] = useState<FileProgress[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    const res = await fetch("/api/files/list");
    const data = await res.json();
    setFiles(data.files || []);
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const upload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!inputRef.current?.files?.length) return;

    const selectedFiles = Array.from(inputRef.current.files);

    setProgressList(
      selectedFiles.map((file) => ({
        file,
        progress: 0,
        status: "uploading",
      }))
    );

    setUploading(true);

    let completedCount = 0;

    selectedFiles.forEach((file, index) => {
      const formData = new FormData();
      formData.append("files", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/files/upload");

      // 📊 progress
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;

        const percent = Math.round((event.loaded / event.total) * 100);

        setProgressList((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            progress: percent,
          };
          return updated;
        });
      };

      // ✅ response handler (FULL FIXED)
      xhr.onload = () => {
        let response: any = {};

        try {
          response = JSON.parse(xhr.responseText);
        } catch {
          response = { success: false, uploaded: [] };
        }

        const uploadedItem = response?.uploaded?.find((u: any) => {
          // safest match = fid OR checksum presence OR fallback index
          return (
            u.filename === file.name ||
            u.fid?.includes(file.name.replace(/\s/g, "_"))
          );
        });

        const isSuccess =
          uploadedItem &&
          uploadedItem.skipped !== true &&
          !uploadedItem.error &&
          xhr.status === 200;

        const status: "done" | "error" = isSuccess ? "done" : "error";

        const message =
          uploadedItem?.message ||
          uploadedItem?.error ||
          (uploadedItem?.reason === "file_too_large"
            ? "File exceeds 10MB limit"
            : uploadedItem?.reason === "duplicate"
            ? "Duplicate file"
            : uploadedItem?.reason === "invalid_type"
            ? "Only PDF files are allowed"
            : xhr.status !== 200
            ? response?.message || "Upload failed"
            : undefined);

        setProgressList((prev) => {
          const updated = [...prev];

          updated[index] = {
            ...updated[index],
            progress: 100,
            status,
            message,
          };

          return updated;
        });

        completedCount++;

        if (completedCount === selectedFiles.length) {
          setUploading(false);
          loadFiles();
        }
      };

      // ❌ network error
      xhr.onerror = () => {
        setProgressList((prev) => {
          const updated = [...prev];

          updated[index] = {
            ...updated[index],
            status: "error",
            progress: 100,
            message: "Network error",
          };

          return updated;
        });

        completedCount++;

        if (completedCount === selectedFiles.length) {
          setUploading(false);
        }
      };

      xhr.send(formData);
    });
  };

  return (
    <div className="mt-6 space-y-6">
      {/* 📤 Upload Form */}
      <form onSubmit={upload} className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="application/pdf"
          className="block w-full text-sm border border-gray-300 rounded-lg p-2"
        />

        <button
          disabled={uploading}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>

      {/* 📊 Progress UI */}
      {progressList.length > 0 && (
        <div className="space-y-3">
          {progressList.map((item, i) => (
            <div key={i} className="border rounded-lg p-3 bg-white shadow-sm">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700 truncate">
                  {item.file.name}
                </span>

                <span
                  className={`text-xs font-semibold ${
                    item.status === "done"
                      ? "text-green-600"
                      : item.status === "error"
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              {/* message */}
              {item.message && (
                <div className="text-xs text-red-500 mb-1">
                  {item.message}
                </div>
              )}

              {/* progress bar */}
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    item.status === "error"
                      ? "bg-red-500"
                      : item.status === "done"
                      ? "bg-green-500"
                      : "bg-blue-500"
                  }`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>

              <div className="text-xs text-gray-500 mt-1">
                {item.progress}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 📁 File table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">
                Date
              </th>
              <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">
                File Name
              </th>
            </tr>
          </thead>

          <tbody>
            {files.map((file: any, index: number) => (
              <tr
                key={file.name}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="px-4 py-2 text-sm text-gray-800 border-t">
                  {file.created_at}
                </td>
                <td className="px-4 py-2 text-sm text-gray-800 border-t">
                  {file.name}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
