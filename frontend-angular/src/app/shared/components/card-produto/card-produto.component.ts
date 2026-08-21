import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Produto } from '../../../core/services/api.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-card-produto',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <div class="card-logoca flex flex-col h-full group overflow-hidden !p-0 hover:shadow-xl">
    <a [routerLink]="['/produto', produto.id]" class="relative block overflow-hidden">
      <img [src]="produto.imagem" [alt]="produto.nome" class="w-full h-44 sm:h-48 object-cover group-hover:scale-105 transition duration-500">
      <span *ngIf="produto.marca" class="absolute top-3 left-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-full text-[11px] font-black tracking-wider shadow-sm"
            [ngClass]="produto.marca==='Brahma' ? 'text-[#b91c1c]' : produto.marca==='Pepsi' ? 'text-[#004B93]' : 'text-[#0f2140]'">
        {{produto.marca | uppercase}}
      </span>
      <span *ngIf="produto.estoque < 30" class="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">ESTOQUE BAIXO</span>
    </a>
    <div class="p-4 flex flex-col flex-1">
      <div class="flex items-center gap-2 text-[11px] text-slate-500 mb-1">
        <span class="badge-logoca !px-2 !py-0.5">{{produto.categoria}}</span>
        <span>{{produto.sku}}</span>
      </div>
      <a [routerLink]="['/produto', produto.id]" class="font-semibold text-sm leading-snug text-[#0f2140] line-clamp-2 hover:text-[#ff6b00] transition min-h-[2.6rem]">{{produto.nome}}</a>
      <div class="mt-2 space-y-1 text-xs">
        <div class="flex justify-between"><span class="text-slate-500">Qtd. mínima</span><span class="font-bold text-[#0f2140]">{{produto.quantidadeMinima}} {{produto.unidade}}(s)</span></div>
        <div class="flex justify-between"><span class="text-slate-500">Galpão</span><span class="font-medium truncate max-w-[150px]">{{produto.galpao}}</span></div>
      </div>
      <!-- Preço detalhado custo + 20% -->
      <div class="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
        <div class="flex justify-between text-xs text-slate-500">
          <span>Custo</span><span>{{produto.precoCusto | currency:'BRL'}}</span>
        </div>
        <div class="flex justify-between text-xs text-emerald-600 font-medium">
          <span>Margem +{{produto.margem*100 | number:'1.0-0'}}%</span><span>+ {{(produto.precoVenda - produto.precoCusto) | currency:'BRL'}}</span>
        </div>
        <div class="flex justify-between items-baseline mt-1">
          <span class="text-xs font-bold text-[#0f2140]">Venda B2C</span>
          <span class="text-lg font-black text-[#0f2140]">{{produto.precoVenda | currency:'BRL'}}</span>
        </div>
        <div *ngIf="produto.precoB2B" class="flex justify-between items-center text-xs">
          <span class="font-semibold text-[#ff6b00]">B2B especial</span>
          <span class="font-bold text-[#ff6b00]">{{produto.precoB2B | currency:'BRL'}}</span>
        </div>
        <div class="text-[11px] text-slate-400 mt-1">por {{produto.unidade}} • estoque: {{produto.estoque}}</div>
      </div>

      <div class="mt-3 flex flex-col sm:flex-row gap-2">
        <a [routerLink]="['/produto', produto.id]" class="flex-1 btn-outline-logoca !py-2.5 text-sm justify-center">Ver detalhes</a>
        <button (click)="add()" class="flex-1 btn-primary-logoca !py-2.5 text-sm justify-center"><i class="bi bi-bag-plus"></i> Add</button>
      </div>
    </div>
  </div>
  `
})
export class CardProdutoComponent {
  @Input({ required: true }) produto!: Produto;
  constructor(private cart: CartService) {}
  add() {
    this.cart.add(this.produto, this.produto.quantidadeMinima);
  }
}
