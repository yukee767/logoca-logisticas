import "./globals.css";
import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "LogoCá Logísticas | Dashboard",
  description:
    "Dashboard operacional LogoCá - Gestão de rotas, estoque Brahma/Pepsi, frota e rastreamento em tempo real",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css"
        />
      </head>
      <body className="bg-[#f4f7fb] text-slate-800 antialiased">
        <div className="flex min-h-screen">
          {/* Sidebar - fixed */}
          <Sidebar />

          {/* Main content */}
          <div className="flex flex-1 flex-col lg:ml-[260px]">
            <Header />
            <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
            <footer className="border-t bg-white px-6 py-3 text-center text-xs text-slate-500">
              © {new Date().getFullYear()} LogoCá Logísticas • Sistema Integrado NestJS + FastAPI •
              v1.0.0
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
