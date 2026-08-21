import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <section class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="font-display font-extrabold text-3xl text-[#0f2140]">Seu carrinho</h1>
    <p class="text-slate-500 text-sm mt-1">Revise quantidades (respeitando a quantidade mínima) antes de ir ao checkout.</p>

    <div *ngIf="(cart.items$ | async) as items" class="mt-6">
      <div *ngIf="items.length; else vazio" class="grid lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-4">
          <div *ngFor="let it of items" class="card-logoca flex gap-4 !p-4">
            <a [routerLink]="['/produto', it.produto.id]"><img [src]="it.produto.imagem" class="w-24 h-24 rounded-xl object-cover border border-slate-100"></a>
            <div class="flex-1 min-w-0">
              <a [routerLink]="['/produto', it.produto.id]" class="font-semibold text-[#0f2140] leading-snug line-clamp-2 hover:text-[#ff6b00]">{{it.produto.nome}}</a>
              <div class="text-xs text-slate-500 mt-1">{{it.produto.sku}} • {{it.produto.galpao}} • Mín: {{it.produto.quantidadeMinima}}</div>
              <div class="flex flex-wrap items-center gap-3 mt-3">
                <div class="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden">
                  <button (click)="cart.updateQuantidade(it.produto.id, it.quantidade-1)" class="w-8 h-8 hover:bg-slate-50 font-bold">−</button>
                  <span class="w-10 text-center font-bold text-sm border-x border-slate-200 h-8 flex items-center justify-center">{{it.quantidade}}</span>
                  <button (click)="cart.updateQuantidade(it.produto.id, it.quantidade+1)" class="w-8 h-8 hover:bg-slate-50 font-bold">+</button>
                </div>
                <span class="text-xs text-slate-500">{{it.produto.unidade}}</span>
                <button (click)="cart.remove(it.produto.id)" class="ml-auto text-xs font-semibold text-red-600 hover:text-red-700 inline-flex items-center gap-1"><i class="bi bi-trash"></i> Remover</button>
              </div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-xs text-slate-400">Custo +20%</div>
              <div class="font-black text-[#0f2140]">{{ (it.produto.precoVenda * it.quantidade) | currency:'BRL' }}</div>
              <div class="text-xs text-slate-500">{{it.produto.precoVenda | currency:'BRL'}} / {{it.produto.unidade}}</div>
            </div>
          </div>
          <button (click)="cart.clear()" class="text-sm text-slate-500 hover:text-red-600 inline-flex items-center gap-1"><i class="bi bi-x-circle"></i> Limpar carrinho</button>
        </div>

        <!-- Resumo -->
        <div class="card-logoca h-fit sticky top-[90px]">
          <h3 class="font-bold text-[#0f2140] text-lg">Resumo do pedido</h3>
          <div class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-slate-500">Subtotal (custo)</span><span>{{ (cart.totalCusto$ | async) | currency:'BRL' }}</span></div>
            <div class="flex justify-between text-emerald-600 font-medium"><span>Margem +20%</span><span>{{ ((cart.total$ | async)! - (cart.totalCusto$ | async)!) | currency:'BRL' }}</span></div>
            <div class="h-px bg-slate-200 my-2"></div>
            <div class="flex justify-between items-center text-base"><span class="font-bold text-[#0f2140]">Total</span><span class="text-xl font-black text-[#0f2140]">{{ (cart.total$ | async) | currency:'BRL' }}</span></div>
            <div class="text-xs text-slate-400">Frete calculado no checkout • Galpão e armazenagem inclusos</div>
          </div>
          <a routerLink="/checkout" class="btn-primary-logoca w-full mt-6 !py-3.5 text-base">Ir para checkout <i class="bi bi-arrow-right"></i></a>
          <a routerLink="/catalogo" class="btn-outline-logoca w-full mt-3">Continuar comprando</a>
        </div>
      </div>
      <ng-template #vazio>
        <div class="card-logoca text-center py-16">
          <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-2xl"><i class="bi bi-cart-x"></i></div>
          <h3 class="font-bold text-[#0f2140] mt-4">Seu carrinho está vazio</h3>
          <p class="text-sm text-slate-500 mt-1">Explore o catálogo B2C/B2B com preço transparente.</p>
          <a routerLink="/catalogo" class="btn-primary-logoca mt-6">Ver catálogo</a>
        </div>
      </ng-template>
    </div>
  </section>
  `
})
export class CartComponent {
  constructor(public cart: CartService) {}
}
