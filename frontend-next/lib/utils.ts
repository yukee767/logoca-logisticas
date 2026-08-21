// Finance & logistics utils for LogoCá

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

// Cálculo de faturamento com impostos e margem
export function calcFaturamentoLiquido(
  bruto: number,
  impostoPerc = 0.18,
  custoPerc = 0.62
): { liquido: number; imposto: number; custo: number; margem: number } {
  const imposto = bruto * impostoPerc;
  const custo = bruto * custoPerc;
  const liquido = bruto - imposto - custo;
  const margem = bruto > 0 ? (liquido / bruto) * 100 : 0;
  return { liquido, imposto, custo, margem };
}

// Ocupação galpão
export function calcOcupacaoGalpao(ocupadoM3: number, totalM3: number) {
  const perc = totalM3 > 0 ? (ocupadoM3 / totalM3) * 100 : 0;
  let status: "ok" | "atencao" | "critico" = "ok";
  if (perc >= 85) status = "critico";
  else if (perc >= 70) status = "atencao";
  return { perc: Number(perc.toFixed(1)), status };
}

// Custo por rota (combustível + tempo + pedágio)
export function calcCustoRota(params: {
  distanciaKm: number;
  consumoKmL?: number;
  precoCombustivel?: number;
  horas?: number;
  custoHora?: number;
  pedagio?: number;
}) {
  const {
    distanciaKm,
    consumoKmL = 2.8,
    precoCombustivel = 6.29,
    horas = 0,
    custoHora = 45,
    pedagio = 0,
  } = params;
  const litros = distanciaKm / consumoKmL;
  const combustivel = litros * precoCombustivel;
  const maoObra = horas * custoHora;
  const total = combustivel + maoObra + pedagio;
  return { litros: Number(litros.toFixed(1)), combustivel, maoObra, pedagio, total };
}

// KPI faturamento diário -> média móvel 7 dias
export function movingAverage(data: number[], window = 7): number[] {
  return data.map((_, idx, arr) => {
    const slice = arr.slice(Math.max(0, idx - window + 1), idx + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    return Number(avg.toFixed(2));
  });
}

// Status helpers
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pendente: "warning",
    separacao: "info",
    em_rota: "primary",
    entregue: "success",
    cancelado: "danger",
    em_estoque: "success",
    baixo: "warning",
    critico: "danger",
  };
  return map[status] || "secondary";
}

// Distância haversine (km) entre dois pontos
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return Number((R * c).toFixed(2));
}

// Gerador mock para gráficos
export function generateSalesSeries(days = 14) {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    const base = 18000 + Math.sin(i / 2) * 4000 + Math.random() * 3000;
    return {
      date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      faturamento: Math.round(base),
      pedidos: Math.round(base / 145),
      brahma: Math.round(base * 0.58),
      pepsi: Math.round(base * 0.42),
    };
  });
}
