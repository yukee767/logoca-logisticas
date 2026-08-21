"use client";

import { useEffect, useState } from "react";

type Tab = "geral" | "galpoes" | "frete" | "estoque" | "usuarios" | "integracoes" | "sistema";

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "geral", label: "Geral", icon: "bi-building" },
  { id: "galpoes", label: "Galpões", icon: "bi-box-seam" },
  { id: "frete", label: "Frete & Markup", icon: "bi-truck" },
  { id: "estoque", label: "Estoque", icon: "bi-boxes" },
  { id: "usuarios", label: "Usuários", icon: "bi-people" },
  { id: "integracoes", label: "Integrações", icon: "bi-plug" },
  { id: "sistema", label: "Sistema", icon: "bi-cpu" },
];

const defaultConfig = {
  geral: {
    nome: "LogoCá Logísticas",
    cnpj: "12.345.678/0001-99",
    email: "logocalogisticas@contato.com",
    telefone: "(11) 98888-0000",
    endereco: "Av. Marginal Tietê, 1000 - São Paulo/SP",
    timezone: "America/Sao_Paulo",
    moeda: "BRL",
  },
  frete: {
    base: 12.5,
    perKm: 2.8,
    perKg: 0.45,
    markup: 20,
    prazoDias: 2,
  },
  estoque: {
    alertaBrahma: 500,
    alertaPepsi: 400,
    alertaGeral: 200,
    notificacaoEmail: true,
    notificacaoPush: true,
    autoReposicao: false,
  },
  galpoes: [
    { id: "A", nome: "CD São Paulo - Central", code: "CD-SP-01", ocupacao: 78, capacidade: 6000, cidade: "São Paulo/SP", endereco: "Av. Marginal Tietê, 1000", status: "ativo" },
    { id: "B", nome: "CD Campinas", code: "CD-CPS-01", ocupacao: 52, capacidade: 3000, cidade: "Campinas/SP", endereco: "Rod. Anhanguera Km 98", status: "ativo" },
    { id: "C", nome: "CD Santos - Porto", code: "CD-STS-01", ocupacao: 41, capacidade: 2500, cidade: "Santos/SP", endereco: "Av. Portuária, 500", status: "manutencao" },
  ],
  usuarios: [
    { id: "1", nome: "Admin LogoCá", email: "admin@logoca.com", role: "ADMIN", ativo: true },
    { id: "2", nome: "Gerente Operações", email: "gerente@logoca.com", role: "MANAGER", ativo: true },
    { id: "3", nome: "João Motorista", email: "joao.motorista@logoca.com", role: "DRIVER", ativo: true },
    { id: "4", nome: "Cliente B2B Central", email: "b2b@supercentral.com.br", role: "CUSTOMER", ativo: true },
  ],
};

export default function ConfiguracoesPage() {
  const [active, setActive] = useState<Tab>("geral");
  const [toast, setToast] = useState<string | null>(null);
  const [config, setConfig] = useState<any>(defaultConfig);
  const [editGalpao, setEditGalpao] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("logoca_config");
    if (saved) {
      try { setConfig(JSON.parse(saved)); } catch {}
    }
  }, []);

  const save = (msg = "Configurações salvas com sucesso!") => {
    localStorage.setItem("logoca_config", JSON.stringify(config));
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const clearCache = (which: string) => {
    setToast(`Cache ${which} limpo! (Ignite ${which} invalidado)`);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg flex items-center gap-2">
          <i className="bi bi-check-circle" /> {toast}
        </div>
      )}

      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Configurações</h2>
          <p className="text-sm text-slate-500">Sistema • Galpões, frete, estoque Brahma/Pepsi, usuários e integrações • logocalogisticas@contato.com</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setToast("Cache sincronizado com Ignite!")} className="rounded-full border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">
            <i className="bi bi-arrow-clockwise mr-1" /> Sincronizar
          </button>
          <button onClick={() => save()} className="rounded-full bg-[#0d3b66] px-6 py-2 text-sm font-bold text-white">
            <i className="bi bi-check-lg mr-1" /> Salvar tudo
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto rounded-2xl border bg-white p-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold border ${
              active === t.id ? "bg-[#0d3b66] text-white border-[#0d3b66]" : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <i className={`bi ${t.icon}`} /> {t.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        {active === "geral" && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2"><i className="bi bi-building text-[#0d3b66]" /> Informações Gerais</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Nome da Empresa</span>
                <input value={config.geral.nome} onChange={(e) => setConfig({ ...config, geral: { ...config.geral, nome: e.target.value } })} className="w-full rounded-lg border px-3 py-2 text-sm" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">CNPJ</span>
                <input value={config.geral.cnpj} onChange={(e) => setConfig({ ...config, geral: { ...config.geral, cnpj: e.target.value } })} className="w-full rounded-lg border px-3 py-2 text-sm font-mono" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Email de contato *</span>
                <input value={config.geral.email} onChange={(e) => setConfig({ ...config, geral: { ...config.geral, email: e.target.value } })} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="logocalogisticas@contato.com" />
                <span className="text-xs text-slate-500">Usado em todo o site e e-commerces B2C/B2B</span>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Telefone</span>
                <input value={config.geral.telefone} onChange={(e) => setConfig({ ...config, geral: { ...config.geral, telefone: e.target.value } })} className="w-full rounded-lg border px-3 py-2 text-sm" />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs font-semibold text-slate-600">Endereço Matriz</span>
                <input value={config.geral.endereco} onChange={(e) => setConfig({ ...config, geral: { ...config.geral, endereco: e.target.value } })} className="w-full rounded-lg border px-3 py-2 text-sm" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Fuso horário</span>
                <select value={config.geral.timezone} onChange={(e) => setConfig({ ...config, geral: { ...config.geral, timezone: e.target.value } })} className="w-full rounded-lg border px-3 py-2 text-sm">
                  <option>America/Sao_Paulo</option>
                  <option>America/Manaus</option>
                  <option>America/Fortaleza</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Moeda</span>
                <select value={config.geral.moeda} onChange={(e) => setConfig({ ...config, geral: { ...config.geral, moeda: e.target.value } })} className="w-full rounded-lg border px-3 py-2 text-sm">
                  <option>BRL</option>
                  <option>USD</option>
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => save("Informações gerais salvas!")} className="rounded-full bg-[#0d3b66] px-6 py-2 text-sm font-bold text-white">Salvar Geral</button>
            </div>
          </div>
        )}

        {active === "galpoes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2"><i className="bi bi-box-seam text-[#0d3b66]" /> Galpões • {config.galpoes.length}</h3>
              <button onClick={() => save("Galpões sincronizados!")} className="rounded-full border bg-white px-4 py-2 text-sm font-semibold">Sincronizar estoque</button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {config.galpoes.map((g: any) => (
                <div key={g.id} className="rounded-xl border p-4 bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold">{g.nome}</div>
                      <div className="text-xs font-mono text-slate-500">{g.code} • {g.cidade}</div>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-bold border ${g.status==="ativo" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{g.status}</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs"><span>Ocupação</span><b>{g.ocupacao}%</b></div>
                    <div className="mt-1 h-2 rounded-full bg-slate-200 overflow-hidden"><div className="h-full bg-[#f4a261]" style={{ width: `${g.ocupacao}%` }} /></div>
                    <div className="mt-1 text-xs text-slate-500">{Math.round(g.capacidade*g.ocupacao/100)} / {g.capacidade} m³</div>
                  </div>
                  <div className="mt-3 text-xs text-slate-600">{g.endereco}</div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setEditGalpao(g)} className="flex-1 rounded-full border bg-white py-1.5 text-xs font-semibold">Editar</button>
                    <button onClick={() => { setConfig({ ...config, galpoes: config.galpoes.map((x: any) => x.id===g.id ? { ...x, ocupacao: Math.min(95, x.ocupacao+5)} : x)}); setToast(`Ocupação ${g.code} +5%`); setTimeout(()=>setToast(null),2000); }} className="rounded-full bg-[#0d3b66] px-3 py-1.5 text-xs font-bold text-white">+5%</button>
                  </div>
                </div>
              ))}
            </div>
            {editGalpao && (
              <div className="rounded-xl border bg-white p-4">
                <h4 className="font-bold">Editar {editGalpao.code}</h4>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input value={editGalpao.nome} onChange={(e) => setEditGalpao({ ...editGalpao, nome: e.target.value})} className="rounded-lg border px-3 py-2 text-sm" placeholder="Nome" />
                  <input value={editGalpao.cidade} onChange={(e) => setEditGalpao({ ...editGalpao, cidade: e.target.value})} className="rounded-lg border px-3 py-2 text-sm" placeholder="Cidade" />
                  <input value={editGalpao.endereco} onChange={(e) => setEditGalpao({ ...editGalpao, endereco: e.target.value})} className="rounded-lg border px-3 py-2 text-sm md:col-span-2" placeholder="Endereço" />
                </div>
                <div className="mt-3 flex gap-2 justify-end">
                  <button onClick={() => setEditGalpao(null)} className="rounded-full border px-4 py-2 text-sm">Cancelar</button>
                  <button onClick={() => { setConfig({ ...config, galpoes: config.galpoes.map((x: any) => x.id===editGalpao.id ? editGalpao : x)}); setEditGalpao(null); save("Galpão atualizado!"); }} className="rounded-full bg-[#0d3b66] px-6 py-2 text-sm font-bold text-white">Salvar</button>
                </div>
              </div>
            )}
          </div>
        )}

        {active === "frete" && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2"><i className="bi bi-truck text-[#0d3b66]" /> Frete & Markup</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="space-y-1"><span className="text-xs font-semibold">Base (R$)</span><input type="number" value={config.frete.base} onChange={(e) => setConfig({ ...config, frete: { ...config.frete, base: parseFloat(e.target.value)}})} className="w-full rounded-lg border px-3 py-2 text-sm" /></label>
              <label className="space-y-1"><span className="text-xs font-semibold">Por Km (R$)</span><input type="number" step="0.1" value={config.frete.perKm} onChange={(e) => setConfig({ ...config, frete: { ...config.frete, perKm: parseFloat(e.target.value)}})} className="w-full rounded-lg border px-3 py-2 text-sm" /></label>
              <label className="space-y-1"><span className="text-xs font-semibold">Por Kg (R$)</span><input type="number" step="0.05" value={config.frete.perKg} onChange={(e) => setConfig({ ...config, frete: { ...config.frete, perKg: parseFloat(e.target.value)}})} className="w-full rounded-lg border px-3 py-2 text-sm" /></label>
            </div>
            <div className="rounded-xl bg-slate-50 border p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Markup armazenagem</span>
                <span className="rounded-full bg-[#0d3b66] text-white px-3 py-1 text-sm font-bold">{config.frete.markup}%</span>
              </div>
              <input type="range" min={5} max={40} value={config.frete.markup} onChange={(e) => setConfig({ ...config, frete: { ...config.frete, markup: parseInt(e.target.value)}})} className="w-full mt-3" />
              <div className="mt-2 text-xs text-slate-600">Fórmula: <code className="bg-white border px-1.5 py-0.5 rounded font-mono">precoVenda = precoCusto * (1 + {config.frete.markup/100})</code> — ex: Brahma R$ 1,80 → R$ {(1.8*(1+config.frete.markup/100)).toFixed(2)}</div>
              <div className="mt-2 text-xs">Exemplo frete 98km (SP→Campinas) + 10kg: <b>R$ {(config.frete.base + 98*config.frete.perKm + 10*config.frete.perKg).toFixed(2)}</b></div>
            </div>
            <div className="flex justify-end"><button onClick={() => save("Frete & markup salvos!")} className="rounded-full bg-[#0d3b66] px-6 py-2 text-sm font-bold text-white">Salvar Frete</button></div>
          </div>
        )}

        {active === "estoque" && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2"><i className="bi bi-boxes text-[#0d3b66]" /> Estoque • Brahma/Pepsi</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="space-y-1"><span className="text-xs font-semibold">Alerta Brahma (un)</span><input type="number" value={config.estoque.alertaBrahma} onChange={(e) => setConfig({ ...config, estoque: { ...config.estoque, alertaBrahma: parseInt(e.target.value)}})} className="w-full rounded-lg border px-3 py-2 text-sm" /></label>
              <label className="space-y-1"><span className="text-xs font-semibold">Alerta Pepsi (un)</span><input type="number" value={config.estoque.alertaPepsi} onChange={(e) => setConfig({ ...config, estoque: { ...config.estoque, alertaPepsi: parseInt(e.target.value)}})} className="w-full rounded-lg border px-3 py-2 text-sm" /></label>
              <label className="space-y-1"><span className="text-xs font-semibold">Alerta Geral</span><input type="number" value={config.estoque.alertaGeral} onChange={(e) => setConfig({ ...config, estoque: { ...config.estoque, alertaGeral: parseInt(e.target.value)}})} className="w-full rounded-lg border px-3 py-2 text-sm" /></label>
            </div>
            <div className="space-y-2">
              {[
                { k: "notificacaoEmail", l: "Notificar por email (logocalogisticas@contato.com)" },
                { k: "notificacaoPush", l: "Push no dashboard (badge !)" },
                { k: "autoReposicao", l: "Gerar pedido de reposição automático (IA)" },
              ].map((f) => (
                <label key={f.k} className="flex items-center justify-between rounded-lg border p-3 bg-slate-50">
                  <span className="text-sm font-medium">{f.l}</span>
                  <input type="checkbox" checked={config.estoque[f.k]} onChange={(e) => setConfig({ ...config, estoque: { ...config.estoque, [f.k]: e.target.checked}})} className="h-5 w-5" />
                </label>
              ))}
            </div>
            <div className="flex justify-end"><button onClick={() => save("Alertas de estoque salvos!")} className="rounded-full bg-[#0d3b66] px-6 py-2 text-sm font-bold text-white">Salvar Estoque</button></div>
          </div>
        )}

        {active === "usuarios" && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><i className="bi bi-people text-[#0d3b66]" /> Usuários • RBAC</h3>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 text-left">Nome</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Role</th><th className="px-4 py-3 text-center">Ativo</th><th className="px-4 py-3"></th></tr></thead>
                <tbody className="divide-y">
                  {config.usuarios.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold">{u.nome}</td>
                      <td className="px-4 py-3 font-mono text-xs">{u.email}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">{u.role}</span></td>
                      <td className="px-4 py-3 text-center">{u.ativo ? "✅" : "❌"}</td>
                      <td className="px-4 py-3 text-right"><button onClick={() => { setConfig({ ...config, usuarios: config.usuarios.map((x: any) => x.id===u.id ? { ...x, ativo: !x.ativo } : x)}); save(`Usuário ${u.nome} ${!u.ativo ? "ativado" : "desativado"}`); }} className="rounded-full border px-3 py-1 text-xs">{u.ativo ? "Desativar" : "Ativar"}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm flex items-center justify-between">
              <span><b>4 usuários</b> • Convites via email • Senha padrão <code className="bg-white px-1 rounded">logoca123</code></span>
              <button onClick={() => setToast("Convite enviado! (mock)")} className="rounded-full bg-[#0d3b66] px-4 py-1.5 text-xs font-bold text-white">Convidar usuário</button>
            </div>
          </div>
        )}

        {active === "integracoes" && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><i className="bi bi-plug text-[#0d3b66]" /> Integrações • Status</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                { name: "PostgreSQL 16", port: "5432", status: "degraded", desc: "Fonte da verdade • init.sql" },
                { name: "Redis 7", port: "6379", status: "online", desc: "Cache • PONG OK" },
                { name: "RabbitMQ 3", port: "5672/15672", status: "offline", desc: "user→empresa • sem Docker" },
                { name: "Kafka + Zookeeper", port: "9092/2181", status: "offline", desc: "admin events • sem Docker" },
                { name: "Apache Ignite 2.15", port: "10800", status: "offline", desc: "user-cache / admin-cache" },
                { name: "NestJS", port: "3000", status: "offline", desc: "Gateway • precisa Postgres" },
                { name: "FastAPI", port: "8000", status: "online", desc: "Health degraded mas ON" },
                { name: "Next.js / Angular", port: "3001/4200", status: "online", desc: "Frontends OK" },
              ].map((s) => (
                <div key={s.name} className="rounded-xl border p-4 flex items-center justify-between bg-slate-50">
                  <div>
                    <div className="font-bold flex items-center gap-2">{s.name} <span className={`h-2 w-2 rounded-full ${s.status==="online" ? "bg-emerald-500" : s.status==="degraded" ? "bg-amber-500" : "bg-red-500"}`} /></div>
                    <div className="text-xs font-mono text-slate-500">:{s.port} • {s.desc}</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold border ${s.status==="online" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : s.status==="degraded" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200"}`}>{s.status}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-[#0d3b66] p-4 text-white flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div><div className="font-bold">Modo sem Docker</div><div className="text-sm opacity-80">Frontends + FastAPI + Redis nativo • Para stack completa: <code className="bg-white/20 px-1 rounded">docker compose up -d</code></div></div>
              <button onClick={() => setToast("Teste de conexão: Redis OK, FastAPI OK, Postgres falhou (sem Docker)")} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0d3b66]">Testar conexões</button>
            </div>
          </div>
        )}

        {active === "sistema" && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2"><i className="bi bi-cpu text-[#0d3b66]" /> Sistema</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border p-4">
                <div className="font-bold">Cache Distribuído</div>
                <div className="text-xs text-slate-500">Apache Ignite • separação user-cache / admin-cache</div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => clearCache("user-cache")} className="flex-1 rounded-full border bg-white py-2 text-sm font-semibold">Limpar user-cache</button>
                  <button onClick={() => clearCache("admin-cache")} className="flex-1 rounded-full bg-[#0d3b66] py-2 text-sm font-bold text-white">Limpar admin-cache</button>
                </div>
              </div>
              <div className="rounded-xl border p-4">
                <div className="font-bold">Versão & Build</div>
                <div className="mt-2 space-y-1 text-sm font-mono">
                  <div>Next.js 14.2.5 • Angular 17.3.17 • Nest 10 • FastAPI 0.110 • Django 5</div>
                  <div>Postgres 16 • Redis 7 • Ignite 2.15</div>
                  <div className="text-xs text-slate-500">Build: {new Date().toLocaleDateString("pt-BR")} • v1.0.0 • X: subst</div>
                </div>
              </div>
              <div className="rounded-xl border p-4 md:col-span-2">
                <div className="font-bold">Suporte</div>
                <div className="mt-2 flex flex-col md:flex-row gap-2">
                  <a href="mailto:logocalogisticas@contato.com" className="rounded-full bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-bold text-emerald-700 text-center">logocalogisticas@contato.com</a>
                  <span className="rounded-full bg-slate-50 border px-4 py-2 text-sm font-mono text-center">Postgres init.sql • Seeds Brahma/Pepsi</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => { localStorage.clear(); setToast("LocalStorage limpo!"); }} className="rounded-full border bg-white px-4 py-2 text-sm">Limpar localStorage</button>
                  <button onClick={() => setToast("Logs exportados! (mock)")} className="rounded-full border bg-white px-4 py-2 text-sm">Exportar logs</button>
                  <button onClick={() => window.location.reload()} className="rounded-full bg-[#0d3b66] px-4 py-2 text-sm font-bold text-white">Recarregar app</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
