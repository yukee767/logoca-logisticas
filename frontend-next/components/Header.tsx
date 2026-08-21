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
    <header className="sticky top-0 z-30 flex h-[64px] items-center justify-between border-b bg-white/80 px-4 backdrop-blur md:px-6">
      <div className="ml-12 lg:ml-0">
        <h1 className="text-sm font-semibold text-slate-800 md:text-base">
          Painel Operacional
        </h1>
        <p className="hidden text-xs text-slate-500 md:block">
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

      <div className="flex items-center gap-2 md:gap-3">
        {/* Search - hidden on mobile */}
        <div className="hidden items-center gap-2 rounded-full border bg-slate-50 px-3 py-1.5 md:flex">
          <i className="bi bi-search text-slate-400" />
          <input
            placeholder="Buscar pedido, placa, SKU..."
            className="w-56 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-mono">
            ⌘K
          </span>
        </div>

        <button className="relative rounded-full border bg-white p-2.5 hover:bg-slate-50">
          <i className="bi bi-bell text-slate-600" />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        <button className="hidden rounded-full bg-[#0d3b66] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a2f52] md:block">
          <i className="bi bi-plus-lg mr-1" /> Novo Pedido
        </button>
      </div>
    </header>
  );
}
