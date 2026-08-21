"use client";

import KpiCard from "@/components/KpiCard";
import ChartCard from "@/components/ChartCard";
import MapView from "@/components/MapView";
import { formatBRL, generateSalesSeries } from "@/lib/utils";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const sales = generateSalesSeries(14);

const pieData = [
  { name: "Brahma", value: 58, color: "#c8102e" },
  { name: "Pepsi", value: 42, color: "#004b93" },
];

const ocupacaoData = [
  { name: "Ocupado", value: 4680 },
  { name: "Livre", value: 1320 },
];

const rotasPerformance = [
  { rota: "Rota 03", entregas: 32, tempo: 4.2 },
  { rota: "Rota 07", entregas: 28, tempo: 5.1 },
  { rota: "Rota 12", entregas: 41, tempo: 3.8 },
  { rota: "Rota 15", entregas: 19, tempo: 6.0 },
];

export default function DashboardPage() {
  const faturamentoHoje = 28450;
  const pedidosHoje = 128;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">Visão Geral</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            KPIs operacionais • Atualizado há 2 min • Integração NestJS + FastAPI
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button className="rounded-full border bg-white px-4 py-2.5 sm:py-2 text-sm font-semibold hover:bg-slate-50 w-full sm:w-auto justify-center inline-flex items-center gap-1">
            <i className="bi bi-download" /> Exportar
          </button>
          <button className="rounded-full bg-[#0d3b66] px-4 py-2.5 sm:py-2 text-sm font-semibold text-white w-full sm:w-auto justify-center inline-flex items-center gap-1">
            <i className="bi bi-arrow-clockwise" /> Atualizar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Pedidos (hoje)"
          value={pedidosHoje}
          subtitle="B2C: 92 • B2B: 36"
          icon="bi-receipt"
          color="primary"
          trend={{ value: "+12% vs ontem", positive: true }}
        />
        <KpiCard
          title="Faturamento"
          value={formatBRL(faturamentoHoje)}
          subtitle="Média 7d: R$ 22.430"
          icon="bi-currency-dollar"
          color="success"
          trend={{ value: "+8.4%", positive: true }}
        />
        <KpiCard
          title="Ocupação Galpão"
          value="78%"
          subtitle="4.680 / 6.000 m³"
          icon="bi-building"
          color="warning"
          trend={{ value: "↑ 3% semana", positive: false }}
        />
        <KpiCard
          title="Caminhões em Rota"
          value="8 / 12"
          subtitle="4 disponíveis • 0 manutenção"
          icon="bi-truck"
          color="info"
          trend={{ value: "66% frota ativa", positive: true }}
        />
      </div>

      {/* Gráficos linha + pizza */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-3">
        <ChartCard
          title="Faturamento • 14 dias"
          subtitle="Linha + média Brahma vs Pepsi"
          className="xl:col-span-2"
          action={
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              +14% mês
            </span>
          }
        >
          <div className="h-[240px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name === "faturamento") return [formatBRL(value as number), "Faturamento"];
                    return [formatBRL(value as number), name];
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="faturamento" stroke="#0d3b66" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="brahma" stroke="#c8102e" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="pepsi" stroke="#004b93" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Mix por Marca" subtitle="Pizza • Brahma vs Pepsi">
          <div className="h-[240px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => `${v}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-2 gap-2 text-center text-xs">
              <div className="rounded-lg bg-[#c8102e]/10 p-2 font-semibold text-[#c8102e]">Brahma 58% • R$ 16.5k</div>
              <div className="rounded-lg bg-[#004b93]/10 p-2 font-semibold text-[#004b93]">Pepsi 42% • R$ 11.9k</div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Barra + ocupação */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-3">
        <ChartCard title="Performance por Rota" subtitle="Entregas vs Tempo médio (h)" className="xl:col-span-2">
          <div className="h-[220px] sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rotasPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="rota" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="entregas" fill="#0d3b66" radius={[6, 6, 0, 0]} name="Entregas" />
                <Bar yAxisId="right" dataKey="tempo" fill="#f4a261" radius={[6, 6, 0, 0]} name="Tempo (h)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Ocupação Galpão" subtitle="Donut • 6.000 m³ total">
          <div className="h-[220px] sm:h-[260px] flex flex-col">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ocupacaoData} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={80}>
                    <Cell fill="#f4a261" />
                    <Cell fill="#e2e8f0" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-amber-800">Alerta: 78% ocupado</div>
                <div className="text-xs text-amber-700">Recomendado: liberar 500 m³</div>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-600"><i className="bi bi-exclamation-triangle-fill text-lg"></i></span>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Tabela pedidos recentes + mapa */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="font-bold text-sm sm:text-base">Pedidos Recentes</h3>
            <a href="/dashboard/pedidos" className="text-xs font-semibold text-[#0d3b66] hover:underline self-start sm:self-auto">
              Ver todos →
            </a>
          </div>
          <div className="mt-4 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-sm min-w-[520px]">
              <thead className="text-xs uppercase text-slate-500">
                <tr className="border-b">
                  <th className="py-2 text-left">Pedido</th>
                  <th className="py-2 text-left">Cliente</th>
                  <th className="py-2 text-left">Tipo</th>
                  <th className="py-2 text-left">Status</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { id: "#4821", cliente: "Bar do Zé", tipo: "B2B", status: "Em Rota", total: 2450 },
                  { id: "#4820", cliente: "Maria Silva", tipo: "B2C", status: "Separação", total: 89.9 },
                  { id: "#4819", cliente: "Supermercado Central", tipo: "B2B", status: "Pendente", total: 5230 },
                  { id: "#4818", cliente: "João Oliveira", tipo: "B2C", status: "Entregue", total: 145.5 },
                  { id: "#4817", cliente: "Distribuidora Sul", tipo: "B2B", status: "Em Rota", total: 3120 },
                ].map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-2.5 font-mono font-semibold">{p.id}</td>
                    <td className="py-2.5">{p.cliente}</td>
                    <td className="py-2.5">
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${p.tipo === "B2B" ? "bg-[#0d3b66] text-white" : "bg-slate-100 text-slate-700"}`}>
                        {p.tipo}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-semibold">{formatBRL(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm">
          <h3 className="font-bold text-sm sm:text-base">Frota em Tempo Real</h3>
          <p className="text-xs text-slate-500">Mapa placeholder com lat/lng • WebSocket FastAPI</p>
          <div className="mt-4">
            <MapView height="220px" />
          </div>
        </div>
      </div>
    </div>
  );
}
