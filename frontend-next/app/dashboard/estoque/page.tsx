"use client";

import { useState } from "react";
import ChartCard from "@/components/ChartCard";
import StockAlert, { StockItem } from "@/components/StockAlert";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const stockMock: StockItem[] = [
  { sku: "BRA-LAT350-001", nome: "Brahma Lata 350ml", marca: "Brahma", categoria: "Cerveja", estoqueAtual: 420, estoqueMinimo: 800, unidade: "un", deposito: "A1" },
  { sku: "BRA-LONG355-002", nome: "Brahma Long Neck 355ml", marca: "Brahma", categoria: "Cerveja", estoqueAtual: 1250, estoqueMinimo: 600, unidade: "un", deposito: "A2" },
  { sku: "BRA-600-003", nome: "Brahma Garrafa 600ml", marca: "Brahma", categoria: "Cerveja", estoqueAtual: 310, estoqueMinimo: 500, unidade: "un", deposito: "A1" },
  { sku: "BRA-1L-004", nome: "Brahma Duplo Malte 1L", marca: "Brahma", categoria: "Cerveja", estoqueAtual: 980, estoqueMinimo: 400, unidade: "un", deposito: "B1" },
  { sku: "PEP-2L-001", nome: "Pepsi 2L PET", marca: "Pepsi", categoria: "Refrigerante", estoqueAtual: 210, estoqueMinimo: 600, unidade: "un", deposito: "B2" },
  { sku: "PEP-350-002", nome: "Pepsi Lata 350ml", marca: "Pepsi", categoria: "Refrigerante", estoqueAtual: 850, estoqueMinimo: 500, unidade: "un", deposito: "B2" },
  { sku: "PEP-1L-003", nome: "Pepsi 1L PET", marca: "Pepsi", categoria: "Refrigerante", estoqueAtual: 640, estoqueMinimo: 450, unidade: "un", deposito: "B3" },
  { sku: "PEP-SIX-004", nome: "Pepsi Pack 6x350ml", marca: "Pepsi", categoria: "Refrigerante", estoqueAtual: 120, estoqueMinimo: 200, unidade: "pack", deposito: "B3" },
];

const chartData = stockMock.map((s) => ({
  name: s.sku.split("-")[1],
  atual: s.estoqueAtual,
  minimo: s.estoqueMinimo,
  marca: s.marca,
}));

export default function EstoquePage() {
  const [filter, setFilter] = useState<"todos" | "Brahma" | "Pepsi">("todos");
  const [search, setSearch] = useState("");

  const filtered = stockMock.filter((s) => {
    if (filter !== "todos" && s.marca !== filter) return false;
    if (search && !`${s.nome} ${s.sku}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalValor = filtered.reduce((acc, cur) => acc + cur.estoqueAtual * (cur.marca === "Brahma" ? 3.2 : 4.5), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black">Controle de Estoque</h2>
          <p className="text-sm text-slate-500">Brahma & Pepsi • Alertas de mínimo • Ocupação galpão integrada</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-full border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">
            <i className="bi bi-arrow-down-up mr-1" /> Movimentações
          </button>
          <button className="rounded-full bg-[#0d3b66] px-4 py-2 text-sm font-semibold text-white">
            <i className="bi bi-plus-lg mr-1" /> Entrada NF-e
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between rounded-2xl border bg-white p-4">
        <div className="flex gap-2">
          {[
            { key: "todos", label: "Todos", count: stockMock.length },
            { key: "Brahma", label: "Brahma", count: stockMock.filter(s=>s.marca==="Brahma").length },
            { key: "Pepsi", label: "Pepsi", count: stockMock.filter(s=>s.marca==="Pepsi").length },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold border ${
                filter === f.key ? "bg-[#0d3b66] text-white border-[#0d3b66]" : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f.label} <span className="opacity-70">({f.count})</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border bg-slate-50 px-3 py-1.5">
            <i className="bi bi-search text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar SKU ou nome..."
              className="bg-transparent text-sm outline-none w-48"
            />
          </div>
          <span className="hidden md:inline text-xs text-slate-500">Valor total: <b className="text-slate-800">R$ {totalValor.toLocaleString("pt-BR")}</b></span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4">
          <ChartCard title="Estoque Atual vs Mínimo" subtitle="Barras por SKU • Linha de corte mínimo">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="atual" name="Atual" fill="#0d3b66" radius={[6,6,0,0]} />
                  <Bar dataKey="minimo" name="Mínimo" fill="#f4a261" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <div className="overflow-hidden rounded-2xl border bg-white">
            <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold">Tabela de Estoque</h3>
              <span className="text-xs text-slate-500">{filtered.length} itens</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-slate-500">
                  <tr className="border-b bg-white">
                    <th className="px-4 py-3 text-left">Produto</th>
                    <th className="px-4 py-3 text-left">SKU</th>
                    <th className="px-4 py-3 text-left">Marca</th>
                    <th className="px-4 py-3 text-right">Atual</th>
                    <th className="px-4 py-3 text-right">Mínimo</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Depósito</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((s) => {
                    const status = s.estoqueAtual <= s.estoqueMinimo ? "critico" : s.estoqueAtual <= s.estoqueMinimo*1.5 ? "atenção" : "ok";
                    return (
                      <tr key={s.sku} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-semibold">{s.nome}</div>
                          <div className="text-xs text-slate-500">{s.categoria}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{s.sku}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded px-2 py-1 text-xs font-bold text-white ${s.marca==="Brahma" ? "bg-[#c8102e]" : "bg-[#004b93]"}`}>
                            {s.marca}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold">{s.estoqueAtual} <span className="text-xs font-normal text-slate-500">{s.unidade}</span></td>
                        <td className="px-4 py-3 text-right text-slate-600">{s.estoqueMinimo}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold border ${
                            status==="critico" ? "bg-red-50 text-red-700 border-red-200" : status==="atenção" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs">{s.deposito}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <StockAlert items={stockMock} />
          <div className="mt-4 rounded-2xl border bg-white p-4">
            <h4 className="font-bold text-sm">Sugestão de Reposição (IA)</h4>
            <p className="text-xs text-slate-500 mt-1">Baseado em giro 7 dias + rotas planejadas</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex justify-between items-center">
                <div>
                  <div className="font-semibold">Pepsi 2L PET</div>
                  <div className="text-xs text-slate-600">Comprar 900 un</div>
                </div>
                <span className="text-xs font-bold bg-white border px-2 py-1 rounded-full">ALTA</span>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex justify-between items-center">
                <div>
                  <div className="font-semibold">Brahma Lata 350ml</div>
                  <div className="text-xs text-slate-600">Comprar 600 un</div>
                </div>
                <span className="text-xs font-bold bg-white border px-2 py-1 rounded-full">MÉDIA</span>
              </div>
              <div className="rounded-lg border p-3 flex justify-between items-center bg-slate-50">
                <div>
                  <div className="font-semibold">Brahma 600ml</div>
                  <div className="text-xs text-slate-600">Comprar 300 un</div>
                </div>
                <span className="text-xs font-bold bg-white border px-2 py-1 rounded-full">BAIXA</span>
              </div>
            </div>
            <button className="mt-3 w-full rounded-lg bg-[#0d3b66] py-2 text-sm font-bold text-white">
              Gerar pedido de compra
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
