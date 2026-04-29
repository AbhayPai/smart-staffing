import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils"
import Link from "next/link";

import "@/app/globals.css";
import LoginButton from "@/components/login/LoginLogoutButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Staffing | Dashboard",
  description: "An application to help you find the best candidates for building skill matrix using AI.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={cn("bg-background", inter.className )}>
        <main className="flex min-h-screen">
          {/* LEFT SIDEBAR */}
          <aside className="w-64 flex flex-col p-6 gap-6">
            <p>Welcome, {user.user_metadata.full_name}!</p>

            <nav className="flex flex-col gap-3">
              <LoginButton />

              <Link
                href="/dashboard"
                className="hover:bg-gray-700 p-2 rounded"
              >
                Dashboard
              </Link>

              <Link
                href="/resume-upload"
                className="hover:bg-gray-700 p-2 rounded"
              >
                Resume Upload
              </Link>
            </nav>
          </aside>

          {/* RIGHT CONTENT */}
          <section className="flex-1 p-10 bg-gray-950 text-white">
            {children}
          </section>
        </main>
      </body>
    </html>
  );
}
