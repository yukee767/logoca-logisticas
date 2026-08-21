"use client";

type Truck = {
  id: string;
  placa: string;
  motorista: string;
  status: "em_rota" | "carregando" | "manutencao" | "disponivel";
  rota?: string;
  ocupacao: number;
  gps?: { lat: number; lng: number };
  updatedAt: string;
};

const statusMap: Record<Truck["status"], { label: string; color: string; icon: string }> = {
  em_rota: { label: "Em Rota", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "bi-truck" },
  carregando: { label: "Carregando", color: "bg-amber-100 text-amber-700 border-amber-200", icon: "bi-box-seam" },
  manutencao: { label: "Manutenção", color: "bg-red-100 text-red-700 border-red-200", icon: "bi-tools" },
  disponivel: { label: "Disponível", color: "bg-slate-100 text-slate-700 border-slate-200", icon: "bi-check-circle" },
};

const mockTrucks: Truck[] = [
  { id: "1", placa: "BRA2E19", motorista: "Carlos Silva", status: "em_rota", rota: "Rota 12 - Zona Sul", ocupacao: 92, gps: { lat: -23.5505, lng: -46.6333 }, updatedAt: "há 2 min" },
  { id: "2", placa: "PEP4F22", motorista: "Ana Souza", status: "carregando", rota: "Rota 07 - Centro", ocupacao: 45, gps: { lat: -23.565, lng: -46.65 }, updatedAt: "há 5 min" },
  { id: "3", placa: "BRA9G33", motorista: "Roberto Lima", status: "em_rota", rota: "Rota 03 - Zona Leste", ocupacao: 78, gps: { lat: -23.53, lng: -46.62 }, updatedAt: "há 1 min" },
  { id: "4", placa: "LOG1H44", motorista: "Fernanda Costa", status: "manutencao", ocupacao: 0, updatedAt: "há 3h" },
  { id: "5", placa: "BRA5J55", motorista: "Marcos Oliveira", status: "disponivel", ocupacao: 0, updatedAt: "há 10 min" },
];

export default function TruckTable({ trucks = mockTrucks }: { trucks?: Truck[] }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Veículo</th>
              <th className="px-4 py-3 text-left">Motorista</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Rota</th>
              <th className="px-4 py-3 text-left">Ocupação</th>
              <th className="px-4 py-3 text-left">GPS</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {trucks.map((t) => {
              const s = statusMap[t.status];
              return (
                <tr key={t.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0d3b66] text-white">
                        <i className={`bi ${s.icon}`} />
                      </div>
                      <div>
                        <div className="font-mono font-bold">{t.placa}</div>
                        <div className="text-xs text-slate-500">{t.gps ? `${t.gps.lat.toFixed(4)}, ${t.gps.lng.toFixed(4)}` : "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{t.motorista}</div>
                    <div className="text-xs text-slate-500">{t.updatedAt}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${s.color}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.rota || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${t.ocupacao > 80 ? "bg-emerald-500" : t.ocupacao > 50 ? "bg-amber-500" : "bg-slate-400"}`}
                          style={{ width: `${t.ocupacao}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold">{t.ocupacao}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {t.gps ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-xs font-mono text-emerald-700">
                        <i className="bi bi-geo-alt" /> Live
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Offline</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="rounded p-1.5 hover:bg-slate-100" title="Ver no mapa">
                        <i className="bi bi-map" />
                      </button>
                      <button className="rounded p-1.5 hover:bg-slate-100" title="Histórico">
                        <i className="bi bi-clock-history" />
                      </button>
                      <button className="rounded p-1.5 hover:bg-slate-100" title="Editar">
                        <i className="bi bi-three-dots-vertical" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export type { Truck };
export { mockTrucks };
