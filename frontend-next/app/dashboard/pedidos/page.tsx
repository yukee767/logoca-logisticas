"use client";

import { useState } from "react";
import ChartCard from "@/components/ChartCard";
import { formatBRL } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Pedido = {
  id: string;
  cliente: string;
  tipo: "B2C" | "B2B";
  canal: string;
  status: "pendente" | "separacao" | "em_rota" | "entregue" | "cancelado";
  total: number;
  itens: number;
  data: string;
};

const pedidosMock: Pedido[] = [
  { id: "#4821", cliente: "Bar do Zé", tipo: "B2B", canal: "WhatsApp", status: "em_rota", total: 2450, itens: 12, data: "21/08 09:32" },
  { id: "#4820", cliente: "Maria Silva", tipo: "B2C", canal: "App", status: "separacao", total: 89.9, itens: 3, data: "21/08 09:15" },
  { id: "#4819", cliente: "Supermercado Central", tipo: "B2B", canal: "Portal B2B", status: "pendente", total: 5230, itens: 24, data: "21/08 08:50" },
  { id: "#4818", cliente: "João Oliveira", tipo: "B2C", canal: "App", status: "entregue", total: 145.5, itens: 5, data: "21/08 08:20" },
  { id: "#4817", cliente: "Distribuidora Sul", tipo: "B2B", canal: "Representante", status: "em_rota", total: 3120, itens: 18, data: "20/08 16:40" },
  { id: "#4816", cliente: "Ana Costa", tipo: "B2C", canal: "App", status: "cancelado", total: 67.0, itens: 2, data: "20/08 14:10" },
  { id: "#4815", cliente: "Mercado Bom Preço", tipo: "B2B", canal: "Portal B2B", status: "entregue", total: 1890, itens: 9, data: "20/08 11:30" },
  { id: "#4814", cliente: "Pedro Lima", tipo: "B2C", canal: "WhatsApp", status: "entregue", total: 210, itens: 6, data: "20/08 10:05" },
];

const statusMap: Record<Pedido["status"], { label: string; cls: string }> = {
  pendente: { label: "Pendente", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  separacao: { label: "Separação", cls: "bg-sky-100 text-sky-700 border-sky-200" },
  em_rota: { label: "Em Rota", cls: "bg-violet-100 text-violet-700 border-violet-200" },
  entregue: { label: "Entregue", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  cancelado: { label: "Cancelado", cls: "bg-red-100 text-red-700 border-red-200" },
};

const chartPedidos = [
  { dia: "15/08", b2c: 22, b2b: 9 },
  { dia: "16/08", b2c: 28, b2b: 11 },
  { dia: "17/08", b2c: 19, b2b: 14 },
  { dia: "18/08", b2c: 31, b2b: 10 },
  { dia: "19/08", b2c: 26, b2b: 13 },
  { dia: "20/08", b2c: 34, b2b: 15 },
  { dia: "21/08", b2c: 29, b2b: 12 },
];

export default function PedidosPage() {
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [search, setSearch] = useState("");

  const filtered = pedidosMock.filter((p) => {
    if (filterStatus !== "todos" && p.status !== filterStatus) return false;
    if (filterTipo !== "todos" && p.tipo !== filterTipo) return false;
    if (search && !`${p.id} ${p.cliente}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalB2B = pedidosMock.filter((p) => p.tipo === "B2B").reduce((a, b) => a + b.total, 0);
  const totalB2C = pedidosMock.filter((p) => p.tipo === "B2C").reduce((a, b) => a + b.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black">Pedidos • B2C / B2B</h2>
          <p className="text-sm text-slate-500">Gestão via NestJS • {pedidosMock.length} pedidos (mock) • Integração ERP</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-full border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">
            <i className="bi bi-funnel mr-1" /> Filtros Avançados
          </button>
          <button className="rounded-full bg-[#0d3b66] px-4 py-2 text-sm font-semibold text-white">
            <i className="bi bi-plus-lg mr-1" /> Novo Pedido
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-slate-500">Total Pedidos (7d)</div>
          <div className="text-2xl font-black">203</div>
          <div className="text-xs text-emerald-600">+11% vs semana anterior</div>
        </div>
        <div className="rounded-xl border bg-[#0d3b66] p-4 text-white">
          <div className="text-xs uppercase opacity-70">B2B • Atacado</div>
          <div className="text-2xl font-black">{formatBRL(totalB2B)}</div>
          <div className="text-xs opacity-80">36 pedidos • Ticket R$ 1.420</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-slate-500">B2C • Varejo</div>
          <div className="text-xl font-black">{formatBRL(totalB2C)}</div>
          <div className="text-xs text-slate-500">92 pedidos • Ticket R$ 112</div>
        </div>
        <div className="rounded-xl border bg-amber-50 p-4 border-amber-200">
          <div className="text-xs uppercase text-amber-700 font-bold">Pendentes</div>
          <div className="text-2xl font-black text-amber-700">3</div>
          <div className="text-xs text-amber-600">Aguardando separação</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard title="Pedidos por Dia" subtitle="B2C vs B2B • 7 dias" className="xl:col-span-2">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartPedidos}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="b2c" name="B2C" stackId="a" fill="#2a9d8f" radius={[0,0,0,0]} />
                <Bar dataKey="b2b" name="B2B" stackId="a" fill="#0d3b66" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-bold text-sm">Split por Canal</h3>
          <div className="mt-4 space-y-3">
            {[
              { canal: "App (B2C)", val: 58, color: "bg-emerald-500" },
              { canal: "Portal B2B", val: 24, color: "bg-[#0d3b66]" },
              { canal: "WhatsApp", val: 12, color: "bg-[#25D366]" },
              { canal: "Representante", val: 6, color: "bg-amber-500" },
            ].map((c) => (
              <div key={c.canal} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold">{c.canal}</span>
                  <span className="font-bold">{c.val}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${c.color}`} style={{ width: `${c.val}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs">
            <div className="font-bold">Insight FastAPI</div>
            <div className="text-slate-600">B2B cresce 18% no portal • Recomendação: campanha Brahma pack 12 un</div>
          </div>
        </div>
      </div>

      {/* Filtros + Tabela */}
      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="flex flex-col gap-3 border-b bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="rounded-full border bg-white px-3 py-1.5 text-sm"
            >
              <option value="todos">Todos os tipos</option>
              <option value="B2C">B2C</option>
              <option value="B2B">B2B</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-full border bg-white px-3 py-1.5 text-sm"
            >
              <option value="todos">Todos status</option>
              <option value="pendente">Pendente</option>
              <option value="separacao">Separação</option>
              <option value="em_rota">Em Rota</option>
              <option value="entregue">Entregue</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <span className="rounded-full bg-white border px-3 py-1.5 text-xs font-semibold">
              {filtered.length} resultados
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full border bg-white px-3 py-1.5">
            <i className="bi bi-search text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar pedido ou cliente..."
              className="bg-transparent text-sm outline-none w-48"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-500 bg-white">
              <tr className="border-b">
                <th className="px-4 py-3 text-left">Pedido</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Canal</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-center">Itens</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-mono font-bold">{p.id}</div>
                    <div className="text-xs text-slate-500">{p.data}</div>
                  </td>
                  <td className="px-4 py-3 font-medium">{p.cliente}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.tipo === "B2B" ? "bg-[#0d3b66] text-white" : "bg-emerald-100 text-emerald-700"}`}>
                      {p.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="rounded bg-slate-100 px-2 py-1">{p.canal}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMap[p.status].cls}`}>
                      {statusMap[p.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold">{p.itens}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatBRL(p.total)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="rounded p-1.5 hover:bg-slate-100" title="Ver"><i className="bi bi-eye" /></button>
                      <button className="rounded p-1.5 hover:bg-slate-100" title="Editar"><i className="bi bi-pencil" /></button>
                      <button className="rounded p-1.5 hover:bg-slate-100" title="Mais"><i className="bi bi-three-dots-vertical" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t bg-slate-50 px-4 py-3 text-xs">
          <span className="text-slate-500">Mostrando {filtered.length} de {pedidosMock.length} • API NestJS: <span className="font-mono">GET /pedidos</span></span>
          <div className="flex gap-1">
            <button className="rounded border bg-white px-3 py-1 hover:bg-slate-50">Anterior</button>
            <button className="rounded bg-[#0d3b66] px-3 py-1 text-white">1</button>
            <button className="rounded border bg-white px-3 py-1 hover:bg-slate-50">2</button>
            <button className="rounded border bg-white px-3 py-1 hover:bg-slate-50">Próximo</button>
          </div>
        </div>
      </div>
    </div>
  );
}
