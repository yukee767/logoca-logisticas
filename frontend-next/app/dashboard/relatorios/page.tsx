"use client";

import { useState, useMemo } from "react";
import ChartCard from "@/components/ChartCard";
import KpiCard from "@/components/KpiCard";
import { formatBRL, generateSalesSeries } from "@/lib/utils";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

type PedidoRow = {
  id: string;
  data: string;
  cliente: string;
  tipo: "B2B" | "B2C";
  marca: "Brahma" | "Pepsi" | "Misto";
  status: "Entregue" | "Em Rota" | "Pendente" | "Cancelado";
  total: number;
  itens: number;
};

const pedidosMock: PedidoRow[] = [
  { id: "#4821", data: "2026-05-13", cliente: "Bar do Zé", tipo: "B2B", marca: "Brahma", status: "Em Rota", total: 2450, itens: 12 },
  { id: "#4820", data: "2026-05-13", cliente: "Maria Silva", tipo: "B2C", marca: "Pepsi", status: "Entregue", total: 89.9, itens: 2 },
  { id: "#4819", data: "2026-05-12", cliente: "Supermercado Central", tipo: "B2B", marca: "Misto", status: "Entregue", total: 5230, itens: 24 },
  { id: "#4818", data: "2026-05-12", cliente: "João Oliveira", tipo: "B2C", marca: "Brahma", status: "Entregue", total: 145.5, itens: 3 },
  { id: "#4817", data: "2026-05-11", cliente: "Distribuidora Sul", tipo: "B2B", marca: "Pepsi", status: "Pendente", total: 3120, itens: 18 },
  { id: "#4816", data: "2026-05-11", cliente: "Ana Costa", tipo: "B2C", marca: "Brahma", status: "Entregue", total: 67.2, itens: 1 },
  { id: "#4815", data: "2026-05-10", cliente: "Atacadão Paulista", tipo: "B2B", marca: "Brahma", status: "Cancelado", total: 1890, itens: 9 },
  { id: "#4814", data: "2026-05-10", cliente: "Carlos Lima", tipo: "B2C", marca: "Pepsi", status: "Entregue", total: 210, itens: 4 },
  { id: "#4813", data: "2026-05-09", cliente: "Bar do Chico", tipo: "B2B", marca: "Pepsi", status: "Em Rota", total: 1780, itens: 8 },
  { id: "#4812", data: "2026-05-09", cliente: "Fernanda Alves", tipo: "B2C", marca: "Misto", status: "Entregue", total: 95.4, itens: 2 },
  { id: "#4811", data: "2026-05-08", cliente: "Supermercado Central", tipo: "B2B", marca: "Brahma", status: "Entregue", total: 4120, itens: 20 },
  { id: "#4810", data: "2026-05-08", cliente: "Roberto Dias", tipo: "B2C", marca: "Brahma", status: "Pendente", total: 132, itens: 3 },
];

const topProdutos = [
  { nome: "Brahma Lata 350ml", qtd: 420, valor: 1344 },
  { nome: "Pepsi 2L PET", qtd: 310, valor: 1395 },
  { nome: "Brahma 600ml", qtd: 285, valor: 1567 },
  { nome: "Pepsi Lata 350ml", qtd: 260, valor: 1170 },
  { nome: "Brahma Duplo Malte 1L", qtd: 180, valor: 810 },
];

const statusData = [
  { name: "Entregue", value: 7, color: "#10b981" },
  { name: "Em Rota", value: 2, color: "#0d3b66" },
  { name: "Pendente", value: 2, color: "#f59e0b" },
  { name: "Cancelado", value: 1, color: "#ef4444" },
];

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState<"7" | "14" | "30" | "90">("14");
  const [tipo, setTipo] = useState<"todos" | "B2B" | "B2C">("todos");
  const [marca, setMarca] = useState<"todos" | "Brahma" | "Pepsi">("todos");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const sales = useMemo(() => generateSalesSeries(parseInt(periodo)), [periodo]);

  const filtrados = useMemo(() => {
    return pedidosMock.filter((p) => {
      if (tipo !== "todos" && p.tipo !== tipo) return false;
      if (marca !== "todos" && p.marca !== marca && p.marca !== "Misto") return false;
      if (search && !`${p.id} ${p.cliente} ${p.marca}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tipo, marca, search]);

  const faturamentoTotal = filtrados.reduce((a, b) => a + b.total, 0);
  const ticketMedio = filtrados.length ? faturamentoTotal / filtrados.length : 0;
  const taxaEntrega = filtrados.length ? (filtrados.filter((p) => p.status === "Entregue").length / filtrados.length) * 100 : 0;

  const exportCSV = () => {
    const header = "Pedido,Data,Cliente,Tipo,Marca,Status,Total,Itens";
    const rows = filtrados.map((p) => `${p.id},${p.data},${p.cliente},${p.tipo},${p.marca},${p.status},${p.total},${p.itens}`).join("\n");
    const csv = `${header}\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-logoca-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast("CSV exportado com sucesso!");
    setTimeout(() => setToast(null), 3000);
  };

  const exportPDF = () => {
    window.print();
    setToast("Use 'Salvar como PDF' na impressão");
    setTimeout(() => setToast(null), 3000);
  };

  const pieMix = [
    { name: "Brahma", value: 58, color: "#c8102e" },
    { name: "Pepsi", value: 35, color: "#004b93" },
    { name: "Misto", value: 7, color: "#64748b" },
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-lg bg-[#0d3b66] px-4 py-3 text-sm font-semibold text-white shadow-lg">
          <i className="bi bi-check-circle mr-2" /> {toast}
        </div>
      )}

      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Relatórios</h2>
          <p className="text-sm text-slate-500">Análise operacional • Faturamento, pedidos e mix Brahma/Pepsi • Exportação CSV/PDF</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="rounded-full border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">
            <i className="bi bi-filetype-csv mr-1" /> CSV
          </button>
          <button onClick={exportPDF} className="rounded-full border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">
            <i className="bi bi-file-earmark-pdf mr-1" /> PDF
          </button>
          <button onClick={() => window.print()} className="rounded-full bg-[#0d3b66] px-4 py-2 text-sm font-semibold text-white">
            <i className="bi bi-printer mr-1" /> Imprimir
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1 rounded-full border bg-slate-50 p-1">
              {[
                { k: "7", l: "7d" },
                { k: "14", l: "14d" },
                { k: "30", l: "30d" },
                { k: "90", l: "90d" },
              ].map((p) => (
                <button
                  key={p.k}
                  onClick={() => setPeriodo(p.k as any)}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${periodo === p.k ? "bg-[#0d3b66] text-white" : "text-slate-600 hover:bg-white"}`}
                >
                  {p.l}
                </button>
              ))}
            </div>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as any)} className="rounded-full border bg-white px-3 py-1.5 text-sm">
              <option value="todos">Todos os tipos</option>
              <option value="B2B">B2B</option>
              <option value="B2C">B2C</option>
            </select>
            <select value={marca} onChange={(e) => setMarca(e.target.value as any)} className="rounded-full border bg-white px-3 py-1.5 text-sm">
              <option value="todos">Todas as marcas</option>
              <option value="Brahma">Brahma</option>
              <option value="Pepsi">Pepsi</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border bg-slate-50 px-3 py-1.5">
              <i className="bi bi-search text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar pedido/cliente/marca..." className="bg-transparent text-sm outline-none w-56" />
            </div>
            <span className="text-xs text-slate-500 hidden md:inline">{filtrados.length} pedidos • {formatBRL(faturamentoTotal)}</span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Pedidos filtrados" value={filtrados.length} subtitle={`${tipo === "todos" ? "B2B+B2C" : tipo} • ${marca === "todos" ? "Todas marcas" : marca}`} icon="bi-receipt" color="primary" trend={{ value: `${periodo}d`, positive: true }} />
        <KpiCard title="Faturamento" value={formatBRL(faturamentoTotal)} subtitle={`Período ${periodo}d`} icon="bi-currency-dollar" color="success" trend={{ value: "+12.3% vs anterior", positive: true }} />
        <KpiCard title="Ticket Médio" value={formatBRL(ticketMedio)} subtitle={`${filtrados.length} pedidos`} icon="bi-graph-up" color="info" trend={{ value: "↑ 4.1%", positive: true }} />
        <KpiCard title="Taxa Entrega" value={`${taxaEntrega.toFixed(1)}%`} subtitle="Entregues / total" icon="bi-check2-circle" color="warning" trend={{ value: taxaEntrega > 70 ? "Boa" : "Atenção", positive: taxaEntrega > 70 }} />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard title={`Faturamento • ${periodo} dias`} subtitle="Brahma vs Pepsi" className="xl:col-span-2">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any, n: string) => [formatBRL(v as number), n === "faturamento" ? "Total" : n]} />
                <Legend />
                <Line type="monotone" dataKey="faturamento" stroke="#0d3b66" strokeWidth={2.5} dot={false} name="Total" />
                <Line type="monotone" dataKey="brahma" stroke="#c8102e" strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="Brahma" />
                <Line type="monotone" dataKey="pepsi" stroke="#004b93" strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="Pepsi" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Pedidos por Status" subtitle="Distribuição">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6,6,0,0]}>
                  {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard title="Top 5 Produtos" subtitle="Qtd vs Valor">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProdutos} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={140} />
                <Tooltip formatter={(v: any) => [v, "Qtd"]} />
                <Bar dataKey="qtd" fill="#0d3b66" radius={[0,6,6,0]} name="Qtd vendida" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Mix por Marca" subtitle="Pizza">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieMix} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {pieMix.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: any) => `${v}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded bg-[#c8102e]/10 p-2 font-bold text-[#c8102e]">Brahma 58%</div>
              <div className="rounded bg-[#004b93]/10 p-2 font-bold text-[#004b93]">Pepsi 35%</div>
              <div className="rounded bg-slate-100 p-2 font-bold">Misto 7%</div>
            </div>
          </div>
        </ChartCard>
        <div className="rounded-2xl border bg-white p-5">
          <h3 className="font-bold">Resumo Financeiro</h3>
          <p className="text-xs text-slate-500">Cálculo JS: venda = custo * 1.20 (20% armazenagem)</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between rounded-lg bg-slate-50 p-3">
              <span>Faturamento bruto</span><b>{formatBRL(faturamentoTotal)}</b>
            </div>
            <div className="flex justify-between rounded-lg bg-amber-50 p-3">
              <span>Impostos (18%)</span><b className="text-amber-700">{formatBRL(faturamentoTotal*0.18)}</b>
            </div>
            <div className="flex justify-between rounded-lg bg-blue-50 p-3">
              <span>Custo (62%)</span><b className="text-blue-700">{formatBRL(faturamentoTotal*0.62)}</b>
            </div>
            <div className="flex justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-3 font-bold">
              <span>Líquido / Margem</span><span className="text-emerald-700">{formatBRL(faturamentoTotal*0.20)} • 20%</span>
            </div>
            <div className="rounded-lg bg-[#0d3b66] p-3 text-white text-xs">
              <div className="font-bold flex items-center gap-1"><i className="bi bi-info-circle" /> Fórmula LogoCá</div>
              <div className="font-mono mt-1">precoVenda = precoCusto * 1.20</div>
              <div className="opacity-80">Armazenagem em galpão incluso • Contato: logocalogisticas@contato.com</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold">Pedidos Detalhados • {filtrados.length}</h3>
          <span className="text-xs text-slate-500">Período {periodo}d • {tipo}/{marca}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr className="border-b">
                <th className="px-4 py-3 text-left">Pedido</th>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Marca</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtrados.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold">{p.id}</td>
                  <td className="px-4 py-3 text-xs">{new Date(p.data).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3">{p.cliente}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${p.tipo==="B2B" ? "bg-[#0d3b66] text-white" : "bg-slate-100"}`}>{p.tipo}</span></td>
                  <td className="px-4 py-3"><span className={`rounded px-2 py-1 text-xs font-bold text-white ${p.marca==="Brahma" ? "bg-[#c8102e]" : p.marca==="Pepsi" ? "bg-[#004b93]" : "bg-slate-500"}`}>{p.marca}</span></td>
                  <td className="px-4 py-3 text-center"><span className={`rounded-full px-2.5 py-1 text-xs font-bold border ${p.status==="Entregue" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : p.status==="Em Rota" ? "bg-blue-50 text-blue-700 border-blue-200" : p.status==="Pendente" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200"}`}>{p.status}</span></td>
                  <td className="px-4 py-3 text-right font-bold">{formatBRL(p.total)}</td>
                </tr>
              ))}
              {filtrados.length===0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Nenhum pedido no filtro</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl bg-[#0d3b66] p-4 text-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="font-bold">Precisa de relatório customizado?</div>
          <div className="text-sm opacity-80">Entre em contato com a equipe administrativa • logocalogisticas@contato.com</div>
        </div>
        <a href="mailto:logocalogisticas@contato.com" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0d3b66] text-center">Solicitar relatório</a>
      </div>
    </div>
  );
}
