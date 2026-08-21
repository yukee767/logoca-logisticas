"use client";

import { useState } from "react";
import ChartCard from "@/components/ChartCard";
import MapView from "@/components/MapView";
import { calcCustoRota, formatBRL } from "@/lib/utils";

type Rota = {
  id: string;
  nome: string;
  origem: string;
  destino: string;
  distanciaKm: number;
  entregas: number;
  status: "planejada" | "em_rota" | "concluida" | "atrasada";
  caminhao: string;
  horario: string;
};

const rotasMock: Rota[] = [
  { id: "R-001", nome: "Rota 03 - Zona Leste", origem: "Galpão Central", destino: "Itaquera / Guaianases", distanciaKm: 42.5, entregas: 32, status: "em_rota", caminhao: "BRA2E19", horario: "06:30 - 14:00" },
  { id: "R-002", nome: "Rota 07 - Centro", origem: "Galpão Central", destino: "Sé / República", distanciaKm: 18.2, entregas: 28, status: "planejada", caminhao: "PEP4F22", horario: "07:00 - 12:30" },
  { id: "R-003", nome: "Rota 12 - Zona Sul", origem: "Galpão Central", destino: "Santo Amaro / Interlagos", distanciaKm: 38.7, entregas: 41, status: "em_rota", caminhao: "BRA9G33", horario: "05:45 - 13:30" },
  { id: "R-004", nome: "Rota 15 - Zona Norte", origem: "Galpão Central", destino: "Santana / Tucuruvi", distanciaKm: 26.4, entregas: 19, status: "atrasada", caminhao: "LOG1H44", horario: "06:00 - 11:00" },
];

const statusStyle: Record<Rota["status"], string> = {
  planejada: "bg-slate-100 text-slate-700 border-slate-200",
  em_rota: "bg-emerald-100 text-emerald-700 border-emerald-200",
  concluida: "bg-sky-100 text-sky-700 border-sky-200",
  atrasada: "bg-red-100 text-red-700 border-red-200",
};

export default function RotasPage() {
  const [selected, setSelected] = useState<Rota>(rotasMock[0]);
  const custo = calcCustoRota({ distanciaKm: selected.distanciaKm, horas: 6, pedagio: 12.5 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black">Gestão de Rotas</h2>
          <p className="text-sm text-slate-500">Otimização via FastAPI • Algoritmo de roteirização • {rotasMock.length} rotas hoje</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-full border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">
            <i className="bi bi-funnel mr-1" /> Filtros
          </button>
          <button className="rounded-full bg-[#0d3b66] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a2f52]">
            <i className="bi bi-magic mr-1" /> Otimizar Rotas (FastAPI)
          </button>
        </div>
      </div>

      {/* KPIs rotas */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total Rotas", value: "12", sub: "8 em rota", icon: "bi-signpost" },
          { label: "Entregas Hoje", value: "120", sub: "94 concluídas", icon: "bi-box-seam" },
          { label: "Km Rodados", value: "482 km", sub: "Média 40km/rota", icon: "bi-speedometer" },
          { label: "Eficiência", value: "94.2%", sub: "On-time", icon: "bi-graph-up-arrow" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                <i className={`bi ${k.icon}`} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">{k.label}</div>
                <div className="text-lg font-black">{k.value}</div>
                <div className="text-xs text-slate-500">{k.sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Tabela */}
        <div className="overflow-hidden rounded-2xl border bg-white xl:col-span-2">
          <div className="p-4 flex items-center justify-between border-b bg-slate-50">
            <h3 className="font-bold">Rotas do Dia</h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Em rota
              <span className="h-2 w-2 rounded-full bg-amber-500 ml-2" /> Planejada
              <span className="h-2 w-2 rounded-full bg-red-500 ml-2" /> Atrasada
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white text-xs uppercase text-slate-500">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left">Rota</th>
                  <th className="px-4 py-3 text-left">Horário</th>
                  <th className="px-4 py-3 text-left">Entregas</th>
                  <th className="px-4 py-3 text-left">Distância</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rotasMock.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className={`cursor-pointer hover:bg-slate-50 ${selected.id === r.id ? "bg-[#0d3b66]/5" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold">{r.nome}</div>
                      <div className="text-xs text-slate-500">{r.id} • {r.caminhao}</div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">{r.horario}</td>
                    <td className="px-4 py-3 font-bold">{r.entregas}</td>
                    <td className="px-4 py-3">{r.distanciaKm} km</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle[r.status]}`}>
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="rounded bg-[#0d3b66] px-3 py-1 text-xs font-semibold text-white">Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detalhe + mapa */}
        <div className="space-y-4">
          <ChartCard title={selected.nome} subtitle={`${selected.origem} → ${selected.destino}`}>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Distância</div>
                  <div className="font-black text-lg">{selected.distanciaKm} km</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Entregas</div>
                  <div className="font-black text-lg">{selected.entregas}</div>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Custo estimado</div>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between"><span>Combustível ({custo.litros} L)</span><span className="font-semibold">{formatBRL(custo.combustivel)}</span></div>
                  <div className="flex justify-between"><span>Mão de obra (6h)</span><span className="font-semibold">{formatBRL(custo.maoObra)}</span></div>
                  <div className="flex justify-between"><span>Pedágio</span><span className="font-semibold">{formatBRL(custo.pedagio)}</span></div>
                  <div className="flex justify-between border-t pt-1 font-black"><span>Total</span><span className="text-[#0d3b66]">{formatBRL(custo.total)}</span></div>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-bold text-white hover:bg-emerald-700">
                  <i className="bi bi-play-fill" /> Iniciar Rota
                </button>
                <button className="rounded-lg border bg-white px-3 py-2 hover:bg-slate-50">
                  <i className="bi bi-pencil" />
                </button>
              </div>
            </div>
          </ChartCard>

          <div className="rounded-2xl border bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-bold">Mapa da Rota</h4>
              <span className="text-xs text-slate-500">{selected.caminhao} • lat/lng</span>
            </div>
            <MapView
              height="240px"
              markers={[
                { id: selected.caminhao, lat: -23.55, lng: -46.63, label: `${selected.caminhao} • ${selected.nome}`, status: "em_rota" },
              ]}
              center={{ lat: -23.55, lng: -46.633 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
