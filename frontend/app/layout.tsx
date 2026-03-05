import type { Metadata } from "next";
import "./globals.css";
import SideBar from "@/components/SideBar";
import { AuthProvider } from "@/lib/hooks/useAuth";

export const metadata: Metadata = {
  title: "Margin – Weekly Focus Board",
  description:
    "A simple, calm weekly task board to help you focus on what matters",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        style={{
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-primary)",
        }}
        suppressHydrationWarning
      >
        <AuthProvider>
          <div className="flex h-screen overflow-hidden">
            <SideBar />
            <main
              className="flex-1 overflow-auto"
              style={{ backgroundColor: "var(--bg-primary)" }}
            >
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
