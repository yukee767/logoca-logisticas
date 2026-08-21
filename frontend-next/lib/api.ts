import axios from "axios";

// URLs - use env ou fallback local
export const NEST_API_URL =
  process.env.NEXT_PUBLIC_NEST_API_URL || "http://localhost:3001";
export const FASTAPI_URL =
  process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

// Axios instances
export const nestApi = axios.create({
  baseURL: NEST_API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

export const fastApi = axios.create({
  baseURL: FASTAPI_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Interceptors - log simples
[nestApi, fastApi].forEach((api) => {
  api.interceptors.response.use(
    (res) => res,
    (err) => {
      console.error(`[API Error] ${api.defaults.baseURL}`, err?.response?.data || err.message);
      return Promise.reject(err);
    }
  );
});

// Types
export type Pedido = {
  id: string;
  cliente: string;
  tipo: "B2C" | "B2B";
  status: "pendente" | "separacao" | "em_rota" | "entregue" | "cancelado";
  total: number;
  itens: number;
  createdAt: string;
};

export type Rota = {
  id: string;
  nome: string;
  status: string;
  entregas: number;
  distanciaKm: number;
};

export type Caminhao = {
  id: string;
  placa: string;
  status: string;
  lat?: number;
  lng?: number;
};

// API Functions - NestJS (CRUD principal)
export const apiNest = {
  pedidos: {
    list: () => nestApi.get<Pedido[]>("/pedidos").then((r) => r.data),
    get: (id: string) => nestApi.get<Pedido>(`/pedidos/${id}`).then((r) => r.data),
    create: (data: Partial<Pedido>) => nestApi.post<Pedido>("/pedidos", data).then((r) => r.data),
  },
  estoque: {
    list: () => nestApi.get("/estoque").then((r) => r.data),
    update: (sku: string, qty: number) => nestApi.patch(`/estoque/${sku}`, { quantidade: qty }).then((r) => r.data),
  },
  caminhoes: {
    list: () => nestApi.get<Caminhao[]>("/caminhoes").then((r) => r.data),
  },
  rotas: {
    list: () => nestApi.get<Rota[]>("/rotas").then((r) => r.data),
    optimize: (rotaId: string) => nestApi.post(`/rotas/${rotaId}/optimize`).then((r) => r.data),
  },
};

// API Functions - FastAPI (otimização, tracking, IA)
export const apiFast = {
  health: () => fastApi.get("/health").then((r) => r.data),
  tracking: {
    positions: () => fastApi.get("/tracking/positions").then((r) => r.data),
    history: (placa: string) => fastApi.get(`/tracking/${placa}/history`).then((r) => r.data),
  },
  routing: {
    optimize: (payload: any) => fastApi.post("/route/optimize", payload).then((r) => r.data),
  },
  finance: {
    kpis: () => fastApi.get("/finance/kpis").then((r) => r.data),
  },
};

// WebSocket helper para FastAPI realtime
export function createTrackingSocket(onMessage: (data: any) => void) {
  if (typeof window === "undefined") return null;

  const url = `${WS_URL.replace(/^http/, "ws")}/ws/tracking`;
  console.log("[WS] Connecting to", url);

  try {
    const ws = new WebSocket(url);
    ws.onopen = () => console.log("[WS] Connected");
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        onMessage(data);
      } catch {
        onMessage(ev.data);
      }
    };
    ws.onerror = (e) => console.error("[WS] Error", e);
    ws.onclose = () => console.log("[WS] Closed");
    return ws;
  } catch (e) {
    console.error("[WS] Failed to create", e);
    return null;
  }
}
