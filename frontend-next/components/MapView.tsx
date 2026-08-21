"use client";

import { useEffect, useState } from "react";

type Marker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  status: "em_rota" | "parado" | "entregue";
};

type MapViewProps = {
  markers?: Marker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  interactive?: boolean;
};

const defaultMarkers: Marker[] = [
  { id: "BRA-1234", lat: -23.55052, lng: -46.633308, label: "BRA-1234 • Rota 12", status: "em_rota" },
  { id: "PEP-5678", lat: -23.565, lng: -46.65, label: "PEP-5678 • Rota 07", status: "parado" },
  { id: "BRA-9988", lat: -23.53, lng: -46.62, label: "BRA-9988 • Rota 03", status: "em_rota" },
];

export default function MapView({
  markers = defaultMarkers,
  center = { lat: -23.55052, lng: -46.633308 },
  height = "380px",
  interactive = false,
}: MapViewProps) {
  const [mounted, setMounted] = useState(false);
  const [useLeaflet, setUseLeaflet] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Tentativa de usar Leaflet se disponível no client; caso contrário placeholder.
    // Como Leaflet precisa de window, ativamos só se o container existir.
    setUseLeaflet(false);
  }, []);

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="animate-pulse rounded-xl bg-slate-100"
      />
    );
  }

  // PLACEHOLDER RICO - simula mapa com grid, ruas e pins
  return (
    <div
      style={{ height }}
      className="relative overflow-hidden rounded-xl border bg-[#e8f0f8]"
    >
      {/* Mapa placeholder visual */}
      <div className="absolute inset-0">
        {/* Grid de ruas */}
        <div className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #0d3b66 1px, transparent 1px), linear-gradient(to bottom, #0d3b66 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Áreas */}
        <div className="absolute left-[15%] top-[20%] h-[35%] w-[22%] rounded-lg bg-white/60 border border-slate-300/50" />
        <div className="absolute right-[18%] top-[12%] h-[28%] w-[26%] rounded-lg bg-amber-50/70 border border-amber-200/50" />
        <div className="absolute bottom-[18%] left-[30%] h-[22%] w-[40%] rounded-lg bg-emerald-50/60 border border-emerald-200/50" />

        {/* Linhas rota */}
        <svg className="absolute inset-0 h-full w-full">
          <path
            d="M 80 120 Q 200 180 300 140 T 520 180"
            stroke="#0d3b66"
            strokeWidth="3"
            strokeDasharray="8 6"
            fill="none"
            opacity="0.8"
          />
          <path
            d="M 120 260 Q 280 240 400 280"
            stroke="#2a9d8f"
            strokeWidth="3"
            strokeDasharray="8 6"
            fill="none"
            opacity="0.6"
          />
        </svg>

        {/* Marcadores */}
        {markers.map((m, idx) => {
          // posições relativas fake para placeholder
          const positions = [
            { x: "22%", y: "32%" },
            { x: "58%", y: "42%" },
            { x: "42%", y: "68%" },
            { x: "72%", y: "28%" },
          ];
          const pos = positions[idx % positions.length];
          return (
            <div
              key={m.id}
              className="absolute -translate-x-1/2 -translate-y-full"
              style={{ left: pos.x, top: pos.y }}
            >
              <div className="flex flex-col items-center">
                <div
                  className={`rounded-full px-2 py-1 text-[10px] font-bold shadow-lg border-2 bg-white flex items-center gap-1 ${
                    m.status === "em_rota"
                      ? "border-emerald-500 text-emerald-700"
                      : m.status === "parado"
                      ? "border-amber-500 text-amber-700"
                      : "border-slate-400 text-slate-600"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      m.status === "em_rota"
                        ? "bg-emerald-500 animate-pulse"
                        : m.status === "parado"
                        ? "bg-amber-500"
                        : "bg-slate-400"
                    }`}
                  />
                  {m.label}
                </div>
                <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#0d3b66] text-white shadow-lg border-2 border-white">
                  <i className="bi bi-truck text-sm" />
                </div>
                <div className="h-2 w-2 rotate-45 bg-[#0d3b66] -mt-1" />
              </div>
            </div>
          );
        })}

        {/* Centro Galpão */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex flex-col items-center">
            <div className="rounded-lg bg-[#0d3b66] px-3 py-1.5 text-xs font-bold text-white shadow-xl flex items-center gap-1.5">
              <i className="bi bi-geo-alt-fill" /> GALPÃO CENTRAL
            </div>
            <div className="mt-1 text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border shadow">
              {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay infos */}
      <div className="absolute left-3 top-3 rounded-lg bg-white/95 backdrop-blur px-3 py-2 shadow border text-xs">
        <div className="font-bold text-slate-800 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Mapa em tempo real
        </div>
        <div className="text-[11px] text-slate-500">
          {markers.length} veículos • Atualização WebSocket
        </div>
      </div>

      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <div className="rounded-lg bg-white/95 backdrop-blur px-3 py-1.5 shadow border text-[11px] font-mono">
          lat: {center.lat.toFixed(5)} • lng: {center.lng.toFixed(5)}
        </div>
        <div className="flex gap-1.5">
          <button className="rounded-lg bg-white p-2 shadow border hover:bg-slate-50">
            <i className="bi bi-plus-lg text-slate-700" />
          </button>
          <button className="rounded-lg bg-white p-2 shadow border hover:bg-slate-50">
            <i className="bi bi-dash-lg text-slate-700" />
          </button>
          <button className="rounded-lg bg-[#0d3b66] p-2 shadow text-white hover:bg-[#0a2f52]">
            <i className="bi bi-crosshair" />
          </button>
        </div>
      </div>

      {/* Legenda */}
      <div className="absolute right-3 top-3 hidden md:block rounded-lg bg-white/95 backdrop-blur px-3 py-2 shadow border text-xs">
        <div className="font-semibold mb-1">Legenda</div>
        <div className="space-y-1 text-[11px]">
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Em rota</div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" /> Parado</div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-slate-400" /> Entregue</div>
        </div>
      </div>

      {/* Leaflet real (desativado por padrão, ativar quando quiser) */}
      {useLeaflet && (
        <div className="absolute inset-0 bg-white flex items-center justify-center">
          <p className="text-sm text-slate-500">Leaflet map aqui (dynamic import)</p>
        </div>
      )}
    </div>
  );
}
