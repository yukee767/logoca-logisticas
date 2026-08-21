"use client";

type StockItem = {
  sku: string;
  nome: string;
  marca: "Brahma" | "Pepsi";
  categoria: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  unidade: string;
  deposito: string;
};

type StockAlertProps = {
  items: StockItem[];
};

export default function StockAlert({ items }: StockAlertProps) {
  const alerts = items.filter((i) => i.estoqueAtual <= i.estoqueMinimo);
  const warnings = items.filter((i) => i.estoqueAtual > i.estoqueMinimo && i.estoqueAtual <= i.estoqueMinimo * 1.5);
  const ok = items.filter((i) => i.estoqueAtual > i.estoqueMinimo * 1.5);

  return (
    <div className="space-y-4">
      {alerts.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 font-bold text-red-700">
            <i className="bi bi-exclamation-triangle-fill" /> Estoque crítico — {alerts.length} itens abaixo do mínimo
          </div>
          <div className="mt-3 grid gap-2">
            {alerts.map((item) => (
              <div key={item.sku} className="flex items-center justify-between rounded-lg bg-white px-3 py-2.5 border border-red-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className={`rounded px-2 py-1 text-[10px] font-black text-white ${item.marca === "Brahma" ? "bg-[#c8102e]" : "bg-[#004b93]"}`}>
                    {item.marca.toUpperCase()}
                  </span>
                  <div>
                    <div className="text-sm font-semibold">{item.nome}</div>
                    <div className="text-xs text-slate-500">{item.sku} • {item.deposito}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-red-600">
                    {item.estoqueAtual} {item.unidade}
                  </div>
                  <div className="text-xs text-slate-500">mín: {item.estoqueMinimo}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 font-bold text-amber-700">
            <i className="bi bi-exclamation-circle" /> Atenção — {warnings.length} itens próximos do mínimo
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {warnings.map((item) => (
              <div key={item.sku} className="flex items-center justify-between rounded-lg bg-white px-3 py-2.5 border border-amber-100">
                <div>
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${item.marca === "Brahma" ? "bg-[#c8102e]" : "bg-[#004b93]"}`} />
                    {item.nome}
                  </div>
                  <div className="text-xs text-slate-500">{item.sku}</div>
                </div>
                <div className="text-sm font-bold text-amber-600">{item.estoqueAtual} {item.unidade}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-slate-800">Resumo por marca</h4>
          <span className="text-xs text-slate-500">{ok.length} itens OK • {items.length} total</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-[#c8102e]/20 bg-[#c8102e]/5 p-3">
            <div className="text-xs font-bold text-[#c8102e]">BRAHMA</div>
            <div className="text-lg font-black">{items.filter(i=>i.marca==="Brahma").length} SKUs</div>
            <div className="text-xs text-slate-600">
              {alerts.filter(i=>i.marca==="Brahma").length} críticos
            </div>
          </div>
          <div className="rounded-lg border border-[#004b93]/20 bg-[#004b93]/5 p-3">
            <div className="text-xs font-bold text-[#004b93]">PEPSI</div>
            <div className="text-lg font-black">{items.filter(i=>i.marca==="Pepsi").length} SKUs</div>
            <div className="text-xs text-slate-600">
              {alerts.filter(i=>i.marca==="Pepsi").length} críticos
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { StockItem };
