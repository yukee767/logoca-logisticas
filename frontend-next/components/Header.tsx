"use client";

import { useEffect, useState } from "react";

export default function Header() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-[56px] sm:h-[64px] items-center justify-between border-b bg-white/90 px-3 sm:px-4 md:px-6 backdrop-blur">
      <div className="ml-11 sm:ml-12 lg:ml-0 min-w-0">
        <h1 className="text-sm sm:text-base font-semibold text-slate-800 truncate">
          Painel Operacional
        </h1>
        <p className="hidden text-xs text-slate-500 sm:block">
          {now
            ? now.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Carregando..."}
        </p>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
        {/* Search - hidden on mobile, icon only on small */}
        <button className="flex h-9 w-9 items-center justify-center rounded-full border bg-slate-50 text-slate-500 hover:bg-slate-100 md:hidden">
          <i className="bi bi-search" />
        </button>
        <div className="hidden items-center gap-2 rounded-full border bg-slate-50 px-3 py-1.5 md:flex">
          <i className="bi bi-search text-slate-400" />
          <input
            placeholder="Buscar pedido, placa, SKU..."
            className="w-40 lg:w-56 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <span className="hidden lg:inline-flex items-center gap-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-mono">
            <i className="bi bi-command text-[10px]"></i> K
          </span>
        </div>

        <button className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border bg-white hover:bg-slate-50 shrink-0">
          <i className="bi bi-bell text-slate-600 text-lg" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-red-500 text-[9px] sm:text-[10px] font-bold text-white">
            3
          </span>
        </button>

        <button className="hidden sm:inline-flex items-center rounded-full bg-[#0d3b66] px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#0a2f52] shrink-0">
          <i className="bi bi-plus-lg mr-1" /> <span className="hidden lg:inline">Novo Pedido</span><span className="sm:hidden lg:hidden">Novo</span>
        </button>
        <button className="sm:hidden flex h-9 w-9 items-center justify-center rounded-full bg-[#0d3b66] text-white hover:bg-[#0a2f52] shrink-0">
          <i className="bi bi-plus-lg text-lg" />
        </button>
      </div>
    </header>
  );
}
