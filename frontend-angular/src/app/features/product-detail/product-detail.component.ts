import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, Produto, FreteSimulacao } from '../../core/services/api.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
  <div *ngIf="produto; else loading" class="max-w-7xl mx-auto px-4 py-8">
    <a routerLink="/catalogo" class="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#0f2140]"><i class="bi bi-arrow-left"></i> Voltar ao catálogo</a>

    <div class="grid lg:grid-cols-2 gap-8 mt-4">
      <!-- Imagem -->
      <div class="card-logoca !p-3">
        <img [src]="produto.imagem" [alt]="produto.nome" class="w-full h-[420px] object-cover rounded-xl">
        <div class="grid grid-cols-3 gap-3 mt-3">
          <div *ngFor="let i of [1,2,3]" class="h-20 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 text-xs">Galeria {{i}}</div>
        </div>
      </div>

      <!-- Info -->
      <div>
        <div class="flex items-center gap-2 text-xs">
          <span class="badge-logoca">{{produto.categoria}}</span>
          <span class="text-slate-500">{{produto.sku}} • {{produto.marca}}</span>
          <span class="ml-auto inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold border border-emerald-200"><i class="bi bi-box"></i> {{produto.estoque}} em estoque</span>
        </div>
        <h1 class="font-display font-extrabold text-2xl md:text-3xl text-[#0f2140] mt-3 leading-tight">{{produto.nome}}</h1>
        <p class="text-slate-500 mt-2 leading-relaxed">{{produto.descricao}}</p>

        <!-- Preço detalhado -->
        <div class="mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <h3 class="font-bold text-[#0f2140] flex items-center gap-2"><i class="bi bi-receipt text-[#ff6b00]"></i> Composição de preço transparente</h3>
          <div class="mt-3 space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-slate-500">Preço de custo</span><span class="font-semibold">{{produto.precoCusto | currency:'BRL'}}</span></div>
            <div class="flex justify-between text-emerald-600"><span>Margem LogoCá (+{{produto.margem*100 | number:'1.0-0'}}%)</span><span class="font-bold">+ {{(produto.precoVenda - produto.precoCusto) | currency:'BRL'}}</span></div>
            <div class="h-px bg-slate-200"></div>
            <div class="flex justify-between items-center">
              <span class="font-bold text-[#0f2140]">Preço B2C</span>
              <span class="text-2xl font-black text-[#0f2140]">{{produto.precoVenda | currency:'BRL'}}</span>
            </div>
            <div *ngIf="produto.precoB2B" class="flex justify-between items-center bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
              <span class="font-bold text-[#ff6b00]">Preço B2B (CNPJ)</span>
              <span class="text-xl font-black text-[#ff6b00]">{{produto.precoB2B | currency:'BRL'}}</span>
            </div>
            <div class="text-xs text-slate-400">por {{produto.unidade}} • Quantidade mínima: <strong class="text-[#0f2140]">{{produto.quantidadeMinima}} {{produto.unidade}}(s)</strong></div>
          </div>
        </div>

        <!-- Galpão e armazenagem -->
        <div class="mt-4 grid sm:grid-cols-2 gap-3">
          <div class="bg-white border border-slate-200 rounded-xl p-4">
            <div class="text-xs font-bold tracking-widest text-slate-500">ARMAZENAGEM</div>
            <div class="font-bold text-[#0f2140] mt-1 flex items-center gap-1.5"><i class="bi bi-buildings text-[#ff6b00]"></i> {{produto.galpao}}</div>
            <div class="text-xs text-slate-500 mt-1">WMS, picking, segurança 24h</div>
          </div>
          <div class="bg-white border border-slate-200 rounded-xl p-4">
            <div class="text-xs font-bold tracking-widest text-slate-500">LOGÍSTICA</div>
            <div class="font-semibold text-[#0f2140] mt-1">{{produto.pesoKg}} kg • {{produto.dimensoes}}</div>
            <div class="text-xs text-slate-500 mt-1">Transporte LogoCá Express</div>
          </div>
        </div>

        <!-- Qtd + Add -->
        <div class="mt-6 flex flex-wrap items-center gap-3">
          <div class="inline-flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white">
            <button (click)="qtd = max(produto.quantidadeMinima, qtd-1)" class="w-11 h-11 hover:bg-slate-50 font-bold text-lg">−</button>
            <input [(ngModel)]="qtd" type="number" [min]="produto.quantidadeMinima" class="w-16 h-11 text-center font-bold border-x border-slate-200 focus:outline-none">
            <button (click)="qtd = qtd+1" class="w-11 h-11 hover:bg-slate-50 font-bold text-lg">+</button>
          </div>
          <span class="text-xs text-slate-500">Mín: {{produto.quantidadeMinima}}</span>
          <button (click)="add()" class="btn-primary-logoca flex-1 !py-3 text-base"><i class="bi bi-bag-check"></i> Adicionar ao carrinho • {{ (produto.precoVenda * qtd) | currency:'BRL' }}</button>
        </div>
        <p *ngIf="added" class="mt-3 text-sm bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-xl"><i class="bi bi-check-circle-fill"></i> Adicionado! <a routerLink="/carrinho" class="underline font-bold">Ver carrinho</a></p>

        <!-- Calcular frete -->
        <div class="mt-6 card-logoca">
          <h3 class="font-bold text-[#0f2140] flex items-center gap-2"><i class="bi bi-truck-flatbed text-[#0f2140]"></i> Calcular frete e prazo</h3>
          <p class="text-xs text-slate-500">Simulação com LogoCá Express baseada em peso e CEP.</p>
          <div class="flex gap-2 mt-3">
            <input [(ngModel)]="cep" placeholder="CEP (ex: 07000-000)" maxlength="9" class="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/20">
            <button (click)="simularFrete()" [disabled]="loadingFrete" class="btn-outline-logoca !py-3 whitespace-nowrap disabled:opacity-50">
              <span *ngIf="!loadingFrete">Calcular</span><span *ngIf="loadingFrete" class="inline-flex items-center gap-2"><span class="w-4 h-4 border-2 border-slate-300 border-t-[#0f2140] rounded-full animate-spin"></span> Calculando</span>
            </button>
          </div>
          <div *ngIf="frete" class="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm">
            <div class="flex justify-between"><span class="text-slate-500">Transportadora</span><span class="font-bold">{{frete.transportadora}}</span></div>
            <div class="flex justify-between"><span class="text-slate-500">Peso total</span><span class="font-semibold">{{frete.pesoTotal | number:'1.1-1'}} kg</span></div>
            <div class="flex justify-between"><span class="text-slate-500">Prazo</span><span class="font-bold text-emerald-600">{{frete.prazoDias}} dias úteis</span></div>
            <div class="flex justify-between text-base mt-2 pt-2 border-t border-slate-200"><span class="font-bold">Frete</span><span class="font-black text-[#0f2140]">{{frete.valor | currency:'BRL'}}</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <ng-template #loading><div class="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">Carregando produto...</div></ng-template>
  `
})
export class ProductDetailComponent implements OnInit {
  produto?: Produto;
  qtd = 1;
  cep = '';
  frete?: FreteSimulacao;
  loadingFrete = false;
  added = false;

  constructor(private route: ActivatedRoute, private api: ApiService, private cart: CartService) {}
  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getProduto(id).subscribe(p => { this.produto = p; if (p) this.qtd = p.quantidadeMinima; });
  }
  max(a: number, b: number) { return Math.max(a, b); }
  add() {
    if (!this.produto) return;
    const q = Math.max(this.produto.quantidadeMinima, this.qtd || this.produto.quantidadeMinima);
    this.cart.add(this.produto, q);
    this.added = true;
    setTimeout(() => this.added = false, 2500);
  }
  simularFrete() {
    if (!this.produto || !this.cep) return;
    this.loadingFrete = true;
    this.api.calcularFrete(this.cep, this.produto.pesoKg, this.qtd).subscribe(f => { this.frete = f; this.loadingFrete = false; });
  }
}
