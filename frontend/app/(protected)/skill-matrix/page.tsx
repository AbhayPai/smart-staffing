"use client";

import { useEffect, useState } from "react";

type SkillRow = {
  name: string;
  role: string;
  email?: string;
  skills: string[];
};

export default function SkillMatrixPage() {
  const [data, setData] = useState<SkillRow[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔍 search states
  const [nameSearch, setNameSearch] = useState("");
  const [skillSearch, setSkillSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/skills");
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // 🔥 filtering logic
  const filteredData = data.filter((row) => {
    const matchesName = row.name
      .toLowerCase()
      .includes(nameSearch.toLowerCase());

    const matchesSkill = row.skills.some((skill) =>
      skill.toLowerCase().includes(skillSearch.toLowerCase())
    );

    return matchesName && matchesSkill;
  });

  return (
    <div className="mt-6">
      <h1 className="text-2xl font-bold">Skill Matrix</h1>

      {/* 🔍 Search Inputs */}
      <div className="mt-4 flex gap-4">
        <input
          type="text"
          placeholder="Search by name..."
          value={nameSearch}
          onChange={(e) => setNameSearch(e.target.value)}
          className="border px-3 py-2 rounded w-1/2 text-sm text-gray-700"
        />

        <input
          type="text"
          placeholder="Search by skill..."
          value={skillSearch}
          onChange={(e) => setSkillSearch(e.target.value)}
          className="border px-3 py-2 rounded w-1/2 text-sm text-gray-700"
        />
      </div>

      {loading ? (
        <p className="mt-4 text-gray-500">Loading...</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">
                  Name
                </th>
                <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">
                  Role
                </th>
                <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">
                  Skills
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No results found
                  </td>
                </tr>
              ) : (
                filteredData.map((row, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2 font-medium">
                      {row.name}
                    </td>

                    <td className="px-4 py-2">{row.role}</td>

                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {row.skills.map((skill) => (
                          <span
                            key={skill}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
