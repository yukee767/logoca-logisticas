"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  badge?: string;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Visão Geral", icon: "bi-speedometer2" },
  { href: "/dashboard/pedidos", label: "Pedidos", icon: "bi-receipt", badge: "128" },
  { href: "/dashboard/rotas", label: "Rotas", icon: "bi-signpost-split" },
  { href: "/dashboard/estoque", label: "Estoque", icon: "bi-box-seam", badge: "!" },
  { href: "/dashboard/caminhoes", label: "Caminhões", icon: "bi-truck" },
  { href: "/dashboard/rastreamento", label: "Rastreamento", icon: "bi-geo-alt", badge: "LIVE" },
];

const secondaryItems: NavItem[] = [
  { href: "/dashboard/relatorios", label: "Relatórios", icon: "bi-file-earmark-bar-graph" },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: "bi-gear" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-[#0d3b66] p-2 text-white shadow-lg lg:hidden"
        aria-label="Toggle menu"
      >
        <i className={`bi ${open ? "bi-x-lg" : "bi-list"} text-xl`} />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-[#0d3b66] text-white transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-[64px] items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#0d3b66] font-black text-lg">
            LÇ
          </div>
          <div className="leading-tight">
            <div className="font-bold tracking-tight">LogoCá</div>
            <div className="text-xs opacity-70 -mt-1">Logísticas</div>
          </div>
          <span className="ml-auto rounded bg-[#f4a261] px-2 py-0.5 text-[10px] font-bold text-[#0d3b66]">
            NEXT 14
          </span>
        </div>

        <div className="flex-1 overflow-y-auto sidebar-scroll px-3 py-4">
          <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-widest opacity-50">
            Operacional
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-white text-[#0d3b66] font-semibold shadow"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <i className={`bi ${item.icon} text-[18px]`} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        item.badge === "!"
                          ? "bg-red-500 text-white"
                          : item.badge === "LIVE"
                          ? "bg-emerald-400 text-[#0d3b66] animate-pulse"
                          : "bg-white/20 text-white"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 mb-2 px-2 text-[11px] font-semibold uppercase tracking-widest opacity-50">
            Sistema
          </div>
          <nav className="space-y-1">
            {secondaryItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-white text-[#0d3b66] font-semibold shadow"
                      : "text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <i className={`bi ${item.icon} text-[18px]`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Galpão ocupação mini */}
          <div className="mt-6 rounded-xl bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center justify-between text-xs">
              <span className="opacity-80">Ocupação Galpão</span>
              <span className="font-bold">78%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full w-[78%] rounded-full bg-[#f4a261]" />
            </div>
            <div className="mt-2 flex justify-between text-[11px] opacity-60">
              <span>4.680 / 6.000 m³</span>
              <span className="text-amber-300">Atenção</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <img
              src="https://i.pravatar.cc/100?img=15"
              alt="user"
              className="h-9 w-9 rounded-full object-cover"
            />
            <div className="flex-1 leading-tight">
              <div className="text-sm font-semibold">Operador LogoCá</div>
              <div className="text-xs opacity-60">admin@logoca.com.br</div>
            </div>
            <button className="rounded p-1.5 hover:bg-white/10">
              <i className="bi bi-box-arrow-right" />
            </button>
          </div>
          <div className="mt-3 flex gap-2 text-[10px]">
            <span className="rounded bg-emerald-500/20 px-2 py-1 text-emerald-300 border border-emerald-500/30">
              ● NestJS ON
            </span>
            <span className="rounded bg-sky-500/20 px-2 py-1 text-sky-300 border border-sky-500/30">
              ● FastAPI ON
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
