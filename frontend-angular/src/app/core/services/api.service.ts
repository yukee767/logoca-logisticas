import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Produto {
  id: number;
  nome: string;
  sku: string;
  categoria: string;
  marca: string;
  descricao: string;
  precoCusto: number;
  margem: number; // 0.20 = 20%
  precoVenda: number;
  precoB2B?: number; // preço com desconto B2B
  quantidadeMinima: number;
  estoque: number;
  unidade: string;
  imagem: string;
  galeria: string[];
  galpao: string;
  pesoKg: number;
  dimensoes: string;
  destaque?: boolean;
}

export interface FreteSimulacao {
  cep: string;
  pesoTotal: number;
  prazoDias: number;
  valor: number;
  transportadora: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiUrl = environment.apiUrl;

  // Mock produtos - em produção viria do backend Nest/FastAPI
  private produtosMock: Produto[] = [
    {
      id: 1, nome: 'Cerveja Brahma Duplo Malte 350ml - Caixa c/ 12', sku: 'BRA-350-CX12', categoria: 'Bebidas', marca: 'Brahma',
      descricao: 'Cerveja Brahma Duplo Malte lata 350ml. Caixa com 12 unidades. Produto armazenado em galpão climatizado.',
      precoCusto: 28.50, margem: 0.20, precoVenda: 34.20, precoB2B: 31.50, quantidadeMinima: 5, estoque: 240, unidade: 'caixa',
      imagem: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=500', galeria: [], galpao: 'Galpão A - Climatizado (Guarulhos/SP)', pesoKg: 4.8, dimensoes: '30x20x12cm'
    },
    {
      id: 2, nome: 'Pepsi Black 350ml - Fardo c/ 12', sku: 'PEP-BLK-350-F12', categoria: 'Bebidas', marca: 'Pepsi',
      descricao: 'Pepsi Black zero açúcar, lata 350ml. Fardo com 12 unidades.',
      precoCusto: 22.00, margem: 0.20, precoVenda: 26.40, precoB2B: 24.20, quantidadeMinima: 10, estoque: 500, unidade: 'fardo',
      imagem: 'https://images.unsplash.com/photo-1553456558-aff63285bdd1?w=500', galeria: [], galpao: 'Galpão B - Seco (Guarulhos/SP)', pesoKg: 4.5, dimensoes: '28x18x12cm'
    },
    {
      id: 3, nome: 'Cerveja Brahma Zero 355ml - Pack c/ 15', sku: 'BRA-ZERO-355-P15', categoria: 'Bebidas', marca: 'Brahma',
      descricao: 'Brahma Zero álcool, long neck 355ml. Pack com 15 unidades.',
      precoCusto: 38.00, margem: 0.20, precoVenda: 45.60, quantidadeMinima: 3, estoque: 120, unidade: 'pack',
      imagem: 'https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=500', galeria: [], galpao: 'Galpão A - Climatizado', pesoKg: 6.2, dimensoes: '35x25x14cm'
    },
    {
      id: 4, nome: 'Pepsi Tradicional 2L - Fardo c/ 6', sku: 'PEP-2L-F06', categoria: 'Bebidas', marca: 'Pepsi',
      descricao: 'Pepsi 2 litros PET. Fardo com 6 unidades. Ideal para revenda B2B.',
      precoCusto: 31.00, margem: 0.20, precoVenda: 37.20, precoB2B: 34.10, quantidadeMinima: 6, estoque: 320, unidade: 'fardo',
      imagem: 'https://images.unsplash.com/photo-1624552184280-9e9631bbeee9?w=500', galeria: [], galpao: 'Galpão B - Seco', pesoKg: 12.5, dimensoes: '40x30x20cm'
    },
    {
      id: 5, nome: 'Palete PBR Logística Reforçado', sku: 'PAL-PBR-001', categoria: 'Embalagens', marca: 'LogoCá',
      descricao: 'Palete PBR madeira reflorestada, capacidade 1.500kg. Venda B2B.',
      precoCusto: 45.00, margem: 0.20, precoVenda: 54.00, quantidadeMinima: 20, estoque: 800, unidade: 'unidade',
      imagem: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500', galeria: [], galpao: 'Galpão C - Pátio Coberto', pesoKg: 22, dimensoes: '120x100x15cm'
    },
    {
      id: 6, nome: 'Filme Stretch 500mm - Caixa c/ 6 rolos', sku: 'FILM-500-CX6', categoria: 'Embalagens', marca: 'LogoCá',
      descricao: 'Filme stretch para paletização, 500mm x 300m. Caixa com 6 rolos.',
      precoCusto: 68.00, margem: 0.20, precoVenda: 81.60, quantidadeMinima: 2, estoque: 150, unidade: 'caixa',
      imagem: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=500', galeria: [], galpao: 'Galpão C', pesoKg: 8, dimensoes: '50x30x30cm'
    },
    {
      id: 7, nome: 'Brahma Chopp Claro 50L - Barril', sku: 'BRA-CHOPP-50L', categoria: 'Bebidas', marca: 'Brahma',
      descricao: 'Barril de chopp Brahma claro 50 litros. Uso exclusivo B2B eventos.',
      precoCusto: 280.00, margem: 0.20, precoVenda: 336.00, precoB2B: 310.00, quantidadeMinima: 2, estoque: 45, unidade: 'barril',
      imagem: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=500', galeria: [], galpao: 'Galpão A - Câmara Fria', pesoKg: 55, dimensoes: '60x60x80cm', destaque: true
    },
    {
      id: 8, nome: 'Guaraná Pepsi Antarctica 269ml - Caixa c/ 15', sku: 'GUA-ANT-269-CX15', categoria: 'Bebidas', marca: 'Pepsi',
      descricao: 'Guaraná Antarctica lata 269ml. Caixa com 15 unidades.',
      precoCusto: 18.90, margem: 0.20, precoVenda: 22.68, quantidadeMinima: 8, estoque: 600, unidade: 'caixa',
      imagem: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500', galeria: [], galpao: 'Galpão B', pesoKg: 4.2, dimensoes: '27x18x10cm'
    }
  ];

  constructor(private http: HttpClient) {}

  getProdutos(filtro?: { categoria?: string; marca?: string; busca?: string }): Observable<Produto[]> {
    // Tenta backend real, fallback mock
    // return this.http.get<Produto[]>(`${this.apiUrl}/produtos`, { params });
    let lista = [...this.produtosMock];
    if (filtro?.categoria && filtro.categoria !== 'Todos') lista = lista.filter(p => p.categoria === filtro.categoria);
    if (filtro?.marca && filtro.marca !== 'Todas') lista = lista.filter(p => p.marca === filtro.marca);
    if (filtro?.busca) {
      const b = filtro.busca.toLowerCase();
      lista = lista.filter(p => p.nome.toLowerCase().includes(b) || p.sku.toLowerCase().includes(b));
    }
    return of(lista).pipe(delay(300));
  }

  getProduto(id: number): Observable<Produto | undefined> {
    return of(this.produtosMock.find(p => p.id === id)).pipe(delay(200));
  }

  calcularFrete(cep: string, pesoKg: number, qtd: number): Observable<FreteSimulacao> {
    const pesoTotal = pesoKg * qtd;
    const distFactor = parseInt(cep.replace(/\D/g, '').slice(0, 2) || '10', 10);
    const valor = Math.max(18, pesoTotal * 2.8 + distFactor * 0.4);
    const prazo = pesoTotal > 20 ? 5 : 3;
    return of({
      cep, pesoTotal, prazoDias: prazo, valor: parseFloat(valor.toFixed(2)), transportadora: 'LogoCá Express'
    }).pipe(delay(600));
  }

  enviarContato(payload: any): Observable<{ ok: boolean }> {
    // Em produção: this.http.post(`${this.apiUrl}/contato`, payload)
    console.log('Contato payload', payload);
    return of({ ok: true }).pipe(delay(800));
  }

  criarPedido(payload: any): Observable<{ id: string }> {
    return of({ id: 'LC-' + Math.floor(100000 + Math.random() * 900000) }).pipe(delay(700));
  }

  // Categorias/marcas dinâmicas
  getCategorias(): string[] { return ['Todos', 'Bebidas', 'Embalagens']; }
  getMarcas(): string[] { return ['Todas', 'Brahma', 'Pepsi', 'LogoCá']; }
}
