import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Produto } from '../../core/services/api.service';
import { CardProdutoComponent } from '../../shared/components/card-produto/card-produto.component';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, CardProdutoComponent],
  template: `
  <section class="bg-[#0f2140] text-white">
    <div class="max-w-7xl mx-auto px-4 py-10">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="font-display font-extrabold text-3xl">Catálogo E-commerce</h1>
          <p class="text-slate-300 mt-1">B2C e B2B • Preço com custo + 20% detalhado • Estoque em tempo real</p>
        </div>
        <div class="bg-white/10 border border-white/15 rounded-2xl px-4 py-3 text-sm">
          <div class="font-bold">Modo B2B ativo para CNPJ</div>
          <div class="text-slate-300 text-xs">Desconto especial visível no card (ex: Brahma/Pepsi)</div>
        </div>
      </div>
    </div>
  </section>

  <section class="max-w-7xl mx-auto px-4 py-8">
    <!-- Filtros -->
    <div class="card-logoca flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
      <div class="flex-1 relative">
        <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
        <input [(ngModel)]="busca" (ngModelChange)="filtrar()" placeholder="Buscar por nome ou SKU (ex: BRA-350, Pepsi...)" class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/30 focus:border-[#ff6b00] bg-slate-50">
      </div>
      <div class="flex gap-3 flex-wrap">
        <select [(ngModel)]="categoria" (change)="filtrar()" class="px-4 py-3 rounded-xl border border-slate-200 bg-white font-medium min-w-[160px]">
          <option *ngFor="let c of categorias" [value]="c">{{c}}</option>
        </select>
        <select [(ngModel)]="marca" (change)="filtrar()" class="px-4 py-3 rounded-xl border border-slate-200 bg-white font-medium min-w-[160px]">
          <option *ngFor="let m of marcas" [value]="m">{{m}}</option>
        </select>
        <button (click)="limpar()" class="px-5 py-3 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50">Limpar</button>
      </div>
    </div>

    <!-- Info barra -->
    <div class="flex flex-wrap items-center justify-between gap-3 mt-6 text-sm">
      <span class="text-slate-500"><strong class="text-[#0f2140]">{{filtrados.length}}</strong> produtos encontrados • Quantidade mínima visível em cada card</span>
      <span class="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold"><i class="bi bi-shield-check"></i> Preço transparente: custo + 20%</span>
    </div>

    <!-- Grid -->
    <div *ngIf="filtrados.length; else vazio" class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
      <app-card-produto *ngFor="let p of filtrados" [produto]="p" />
    </div>
    <ng-template #vazio>
      <div class="card-logoca text-center py-16 mt-6">
        <div class="text-4xl mb-3">🔍</div>
        <h3 class="font-bold text-[#0f2140]">Nenhum produto encontrado</h3>
        <p class="text-sm text-slate-500 mt-1">Tente limpar os filtros ou buscar por outro termo.</p>
      </div>
    </ng-template>

    <!-- Legenda B2C/B2B -->
    <div class="card-logoca mt-8 bg-gradient-to-r from-[#0f2140] to-[#1a3a6b] text-white !border-0">
      <div class="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div>
          <h3 class="font-bold text-lg flex items-center gap-2"><i class="bi bi-info-circle"></i> Como funciona o preço?</h3>
          <p class="text-slate-300 text-sm mt-1">Todo produto exibe <strong class="text-white">Custo</strong> + <strong class="text-emerald-300">Margem 20%</strong> = <strong class="text-white">Preço de venda B2C</strong>. Clientes B2B (CNPJ) veem preço especial adicional.</p>
        </div>
        <div class="bg-white text-[#0f2140] rounded-xl px-4 py-3 text-sm font-mono">
          <div>Custo R$ 28,50 + 20% = <strong>R$ 34,20 (B2C)</strong></div>
          <div class="text-[#ff6b00] font-bold">B2B: R$ 31,50</div>
        </div>
      </div>
    </div>
  </section>
  `
})
export class CatalogComponent implements OnInit {
  produtos: Produto[] = [];
  filtrados: Produto[] = [];
  busca = '';
  categoria = 'Todos';
  marca = 'Todas';
  categorias: string[] = [];
  marcas: string[] = [];

  constructor(private api: ApiService) {}
  ngOnInit() {
    this.categorias = this.api.getCategorias();
    this.marcas = this.api.getMarcas();
    this.api.getProdutos().subscribe(list => { this.produtos = list; this.filtrados = list; });
  }
  filtrar() {
    this.api.getProdutos({ categoria: this.categoria, marca: this.marca, busca: this.busca }).subscribe(list => this.filtrados = list);
  }
  limpar() { this.busca=''; this.categoria='Todos'; this.marca='Todas'; this.filtrar(); }
}
