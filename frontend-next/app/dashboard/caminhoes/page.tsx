"use client";

import TruckTable from "@/components/TruckTable";
import ChartCard from "@/components/ChartCard";
import MapView from "@/components/MapView";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const fleetPie = [
  { name: "Em Rota", value: 8, color: "#10b981" },
  { name: "Carregando", value: 2, color: "#f59e0b" },
  { name: "Manutenção", value: 1, color: "#ef4444" },
  { name: "Disponível", value: 1, color: "#64748b" },
];

const consumoData = [
  { placa: "BRA2E19", km: 142, litros: 48, custo: 302 },
  { placa: "PEP4F22", km: 98, litros: 33, custo: 207 },
  { placa: "BRA9G33", km: 165, litros: 56, custo: 352 },
  { placa: "LOG1H44", km: 0, litros: 0, custo: 0 },
  { placa: "BRA5J55", km: 42, litros: 14, custo: 88 },
];

export default function CaminhoesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black">Frota • Caminhões</h2>
          <p className="text-sm text-slate-500">12 veículos • GPS integrado FastAPI • Manutenção preventiva</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-full border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">
            <i className="bi bi-geo-alt mr-1" /> Ver Mapa Geral
          </button>
          <button className="rounded-full bg-[#0d3b66] px-4 py-2 text-sm font-semibold text-white">
            <i className="bi bi-plus-lg mr-1" /> Novo Veículo
          </button>
        </div>
      </div>

      {/* KPIs Frota */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Frota Total</div>
          <div className="text-2xl font-black">12</div>
          <div className="text-xs text-emerald-600 font-semibold">● 11 operacionais</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Em Rota</div>
          <div className="text-2xl font-black text-emerald-600">8</div>
          <div className="text-xs text-slate-500">66% utilização</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Km Hoje</div>
          <div className="text-2xl font-black">447 km</div>
          <div className="text-xs text-slate-500">Média 37 km/veículo</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Combustível</div>
          <div className="text-2xl font-black">R$ 949</div>
          <div className="text-xs text-amber-600">151 L consumidos</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard title="Status da Frota" subtitle="Pizza • Distribuição atual">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={fleetPie} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {fleetPie.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Consumo por Veículo" subtitle="Barra • Km vs Custo" className="xl:col-span-2">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consumoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="placa" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="km" name="Km" fill="#0d3b66" radius={[6,6,0,0]} />
                <Bar dataKey="custo" name="Custo R$" fill="#f4a261" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Mapa + Tabela */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">Localização em Tempo Real (GPS)</h3>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            ● Live WebSocket • 3 veículos visíveis
          </span>
        </div>
        <div className="mt-3">
          <MapView height="320px" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded bg-slate-100 px-2 py-1">Centro: -23.5505, -46.6333 (Galpão)</span>
          <span className="rounded bg-slate-100 px-2 py-1">Atualização: 5s</span>
          <span className="rounded bg-slate-100 px-2 py-1">Protocolo: WS FastAPI /ws/tracking</span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Detalhamento da Frota</h3>
          <div className="flex gap-2">
            <input placeholder="Buscar placa ou motorista..." className="rounded-full border px-3 py-1.5 text-sm w-56 bg-white" />
          </div>
        </div>
        <TruckTable />
      </div>

      {/* Cards manutenção */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-2 font-bold text-sm"><i className="bi bi-tools text-slate-500" /> Próximas Manutenções</div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between rounded-lg bg-amber-50 border border-amber-200 p-2.5">
              <div><div className="font-semibold">PEP4F22</div><div className="text-xs text-slate-600">Troca óleo • em 1.200 km</div></div>
              <span className="text-xs font-bold text-amber-700">5 dias</span>
            </div>
            <div className="flex justify-between rounded-lg bg-slate-50 border p-2.5">
              <div><div className="font-semibold">BRA9G33</div><div className="text-xs text-slate-600">Revisão 40k</div></div>
              <span className="text-xs">12 dias</span>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-2 font-bold text-sm"><i className="bi bi-fuel-pump text-slate-500" /> Ranking Eficiência</div>
          <div className="mt-3 space-y-1.5 text-sm">
            {[
              { p: "BRA5J55", v: "3.0 km/L", c: "text-emerald-600" },
              { p: "BRA2E19", v: "2.9 km/L", c: "text-emerald-600" },
              { p: "BRA9G33", v: "2.9 km/L", c: "text-emerald-600" },
              { p: "PEP4F22", v: "2.7 km/L", c: "text-amber-600" },
            ].map((r) => (
              <div key={r.p} className="flex justify-between border-b py-1.5 last:border-0">
                <span className="font-mono font-semibold">{r.p}</span>
                <span className={`font-bold ${r.c}`}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border bg-[#0d3b66] p-4 text-white">
          <div className="font-bold text-sm flex items-center gap-2"><i className="bi bi-lightning-charge" /> Ação Rápida</div>
          <p className="text-xs opacity-80 mt-1">Veículo em manutenção precisa de liberação.</p>
          <div className="mt-3 rounded-lg bg-white/10 p-3">
            <div className="font-mono font-bold">LOG1H44</div>
            <div className="text-xs opacity-80">Freio • Oficina Zona Leste</div>
            <div className="mt-2 flex gap-2">
              <button className="flex-1 rounded bg-white py-1.5 text-xs font-bold text-[#0d3b66]">Liberar</button>
              <button className="rounded border border-white/30 px-3 py-1.5 text-xs">Detalhes</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
