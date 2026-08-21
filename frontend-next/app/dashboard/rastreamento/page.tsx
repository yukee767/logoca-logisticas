"use client";

import { useEffect, useRef, useState } from "react";
import MapView from "@/components/MapView";
import ChartCard from "@/components/ChartCard";
import { createTrackingSocket, WS_URL } from "@/lib/api";

type Position = {
  placa: string;
  lat: number;
  lng: number;
  speed: number;
  status: "em_rota" | "parado" | "entregue";
  updatedAt: string;
};

const initialPositions: Position[] = [
  { placa: "BRA2E19", lat: -23.55052, lng: -46.633308, speed: 42, status: "em_rota", updatedAt: new Date().toISOString() },
  { placa: "PEP4F22", lat: -23.565, lng: -46.65, speed: 0, status: "parado", updatedAt: new Date().toISOString() },
  { placa: "BRA9G33", lat: -23.53, lng: -46.62, speed: 58, status: "em_rota", updatedAt: new Date().toISOString() },
  { placa: "BRA5J55", lat: -23.58, lng: -46.61, speed: 35, status: "em_rota", updatedAt: new Date().toISOString() },
];

export default function RastreamentoPage() {
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>("BRA2E19");
  const wsRef = useRef<WebSocket | null>(null);
  const [simulate, setSimulate] = useState(true);

  // WebSocket real + fallback simulação
  useEffect(() => {
    const ws = createTrackingSocket((data) => {
      setConnected(true);
      const msg = typeof data === "string" ? data : JSON.stringify(data);
      setLogs((prev) => [`${new Date().toLocaleTimeString()} • ${msg}`, ...prev].slice(0, 30));
      // Se vier posição válida, atualiza
      if (data && data.placa && data.lat) {
        setPositions((prev) => prev.map((p) => (p.placa === data.placa ? { ...p, ...data, updatedAt: new Date().toISOString() } : p)));
      }
    });
    if (ws) {
      wsRef.current = ws;
      ws.onopen = () => setConnected(true);
      ws.onclose = () => setConnected(false);
      ws.onerror = () => setConnected(false);
    } else {
      setConnected(false);
    }

    return () => {
      try { ws?.close(); } catch {}
    };
  }, []);

  // Simulação de movimento quando WS não está conectado ou modo simulate ativo
  useEffect(() => {
    if (!simulate) return;
    const id = setInterval(() => {
      setPositions((prev) =>
        prev.map((p) => ({
          ...p,
          lat: p.lat + (Math.random() - 0.5) * 0.002,
          lng: p.lng + (Math.random() - 0.5) * 0.002,
          speed: p.status === "parado" ? 0 : Math.round(30 + Math.random() * 35),
          updatedAt: new Date().toISOString(),
        }))
      );
      setLogs((prev) => [`${new Date().toLocaleTimeString()} • [SIM] posições atualizadas • ${positions.length} veículos`, ...prev].slice(0, 30));
    }, 2500);
    return () => clearInterval(id);
  }, [simulate, positions.length]);

  const selectedPos = positions.find((p) => p.placa === selected) || positions[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            Rastreamento <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-black text-white animate-pulse">LIVE</span>
          </h2>
          <p className="text-sm text-slate-500">
            Tempo real via WebSocket FastAPI • <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{WS_URL}/ws/tracking</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1.5 text-xs font-bold border flex items-center gap-1.5 ${connected ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
            <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            {connected ? "WebSocket Conectado" : "Modo Simulação"}
          </span>
          <label className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" checked={simulate} onChange={(e) => setSimulate(e.target.checked)} />
            Simular
          </label>
          <button
            onClick={() => {
              try { wsRef.current?.close(); } catch {}
              setConnected(false);
              setLogs((p) => [`${new Date().toLocaleTimeString()} • Reconectando...`, ...p]);
              setTimeout(() => {
                const ws = createTrackingSocket((data) => {
                  setLogs((prev) => [`${new Date().toLocaleTimeString()} • ${JSON.stringify(data)}`, ...prev].slice(0, 30));
                });
                if (ws) wsRef.current = ws;
              }, 500);
            }}
            className="rounded-full border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
          >
            <i className="bi bi-arrow-clockwise" /> Reconectar
          </button>
        </div>
      </div>

      {/* KPIs realtime */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-slate-500">Veículos Live</div>
          <div className="text-2xl font-black">{positions.filter((p) => p.status === "em_rota").length} / {positions.length}</div>
          <div className="text-xs text-emerald-600">em movimento</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-slate-500">Velocidade Média</div>
          <div className="text-2xl font-black">
            {Math.round(positions.reduce((a, b) => a + b.speed, 0) / positions.length)} km/h
          </div>
          <div className="text-xs text-slate-500">max 58 km/h</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-slate-500">Latência</div>
          <div className="text-2xl font-black">{connected ? "42 ms" : "—"}</div>
          <div className="text-xs text-slate-500">WebSocket FastAPI</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-slate-500">Última Atualização</div>
          <div className="text-sm font-bold font-mono">{new Date().toLocaleTimeString("pt-BR")}</div>
          <div className="text-xs text-slate-500">interval 2.5s (sim)</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Mapa */}
        <div className="xl:col-span-2 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Mapa Tempo Real</h3>
            <div className="flex gap-1">
              {positions.map((p) => (
                <button
                  key={p.placa}
                  onClick={() => setSelected(p.placa)}
                  className={`rounded-full px-3 py-1 text-xs font-bold border ${
                    selected === p.placa ? "bg-[#0d3b66] text-white border-[#0d3b66]" : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p.placa}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <MapView
              height="420px"
              center={{ lat: selectedPos.lat, lng: selectedPos.lng }}
              markers={positions.map((p) => ({
                id: p.placa,
                lat: p.lat,
                lng: p.lng,
                label: `${p.placa} • ${p.speed}km/h`,
                status: p.status,
              }))}
            />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3 text-xs">
            <div className="rounded-lg bg-slate-50 p-2.5 border">
              <div className="font-bold">{selectedPos.placa}</div>
              <div className="font-mono text-slate-600">
                {selectedPos.lat.toFixed(5)}, {selectedPos.lng.toFixed(5)}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${selectedPos.status === "em_rota" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                {selectedPos.status} • {selectedPos.speed} km/h
              </div>
            </div>
            <div className="rounded-lg bg-emerald-50 p-2.5 border border-emerald-200">
              <div className="font-bold text-emerald-800">Rota Ativa</div>
              <div className="text-emerald-700">Rota 12 - Zona Sul</div>
              <div className="text-xs text-emerald-600">ETA: 12 min • 4 entregas restantes</div>
            </div>
            <div className="rounded-lg bg-sky-50 p-2.5 border border-sky-200">
              <div className="font-bold text-sky-800">FastAPI WS</div>
              <div className="font-mono text-xs">ws://localhost:8000/ws/tracking</div>
              <div className="text-xs text-sky-600">Protocolo: JSON • 5s heartbeat</div>
            </div>
          </div>
        </div>

        {/* Lista + logs */}
        <div className="space-y-4">
          <div className="rounded-2xl border bg-white p-4">
            <h4 className="font-bold text-sm">Veículos</h4>
            <div className="mt-3 space-y-2">
              {positions.map((p) => (
                <div
                  key={p.placa}
                  onClick={() => setSelected(p.placa)}
                  className={`cursor-pointer rounded-xl border p-3 flex items-center gap-3 hover:bg-slate-50 ${selected === p.placa ? "bg-[#0d3b66]/5 border-[#0d3b66]/30" : "bg-white"}`}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-white ${p.status === "em_rota" ? "bg-emerald-500" : p.status === "parado" ? "bg-amber-500" : "bg-slate-500"}`}>
                    <i className="bi bi-truck" />
                  </div>
                  <div className="flex-1">
                    <div className="font-mono font-bold text-sm">{p.placa}</div>
                    <div className="text-xs text-slate-500 font-mono">
                      {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{p.speed} km/h</div>
                    <div className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${p.status === "em_rota" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {p.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <ChartCard title="Logs WebSocket" subtitle="Últimas mensagens (live)">
            <div className="h-[240px] overflow-y-auto rounded-lg bg-slate-900 p-3 font-mono text-xs text-emerald-300">
              {logs.length === 0 ? (
                <div className="text-slate-500">Aguardando mensagens...</div>
              ) : (
                logs.map((l, i) => (
                  <div key={i} className="border-b border-white/10 py-1 last:border-0">
                    {l}
                  </div>
                ))
              )}
            </div>
            <div className="mt-2 flex gap-2">
              <button onClick={() => setLogs([])} className="rounded border bg-white px-3 py-1 text-xs hover:bg-slate-50">
                Limpar
              </button>
              <span className="text-xs text-slate-500 py-1">Backend: FastAPI + WebSocket • Fallback simulação local</span>
            </div>
          </ChartCard>

          <div className="rounded-xl border bg-[#0d3b66] p-4 text-white">
            <div className="font-bold flex items-center gap-2"><i className="bi bi-code-slash" /> Exemplo Payload WS</div>
            <pre className="mt-2 rounded bg-black/30 p-2 text-xs font-mono overflow-x-auto">
{`{
  "placa": "BRA2E19",
  "lat": -23.5505,
  "lng": -46.6333,
  "speed": 42,
  "status": "em_rota",
  "timestamp": "2025-05-13T14:32:00Z"
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
