import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <section class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="font-display font-extrabold text-3xl text-[#0f2140]">Checkout</h1>
    <p class="text-sm text-slate-500 mt-1">B2C e B2B • Entrega via LogoCá Express • Armazenagem em galpões próprios</p>

    <div *ngIf="(cart.items$ | async) as items" class="grid lg:grid-cols-3 gap-6 mt-6">
      <!-- Form -->
      <div class="lg:col-span-2 space-y-6">
        <div class="card-logoca">
          <h3 class="font-bold text-[#0f2140] flex items-center gap-2"><span class="w-7 h-7 rounded-full bg-[#0f2140] text-white flex items-center justify-center text-xs font-black">1</span> Dados do cliente</h3>
          <div class="grid sm:grid-cols-2 gap-4 mt-4">
            <label class="text-sm font-medium">Nome / Razão social <input [(ngModel)]="form.nome" placeholder="Ex: Empresa XYZ Ltda" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/20"></label>
            <label class="text-sm font-medium">Tipo <select [(ngModel)]="form.tipo" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 bg-white"><option value="B2C">B2C (CPF)</option><option value="B2B">B2B (CNPJ)</option></select></label>
            <label class="text-sm font-medium">Documento <input [(ngModel)]="form.documento" placeholder="CPF ou CNPJ" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50"></label>
            <label class="text-sm font-medium">E-mail <input [(ngModel)]="form.email" type="email" placeholder="seu@empresa.com" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50"></label>
            <label class="text-sm font-medium">Telefone <input [(ngModel)]="form.telefone" placeholder="(11) 99999-9999" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50"></label>
            <label class="text-sm font-medium">CEP <input [(ngModel)]="form.cep" placeholder="07000-000" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50"></label>
          </div>
          <label class="text-sm font-medium block mt-4">Endereço completo <input [(ngModel)]="form.endereco" placeholder="Rua, número, bairro, cidade/UF" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50"></label>
        </div>

        <div class="card-logoca">
          <h3 class="font-bold text-[#0f2140] flex items-center gap-2"><span class="w-7 h-7 rounded-full bg-[#ff6b00] text-white flex items-center justify-center text-xs font-black">2</span> Pagamento</h3>
          <div class="grid sm:grid-cols-3 gap-3 mt-4">
            <label class="border-2 rounded-xl p-4 cursor-pointer flex flex-col gap-2" [class.border-[#0f2140]]="form.pagamento==='pix'" [class.bg-blue-50]="form.pagamento==='pix'">
              <input type="radio" name="pag" value="pix" [(ngModel)]="form.pagamento" class="accent-[#0f2140]"> <span class="font-bold text-sm"><i class="bi bi-qr-code"></i> PIX (5% off)</span><span class="text-xs text-slate-500">Aprovação imediata</span>
            </label>
            <label class="border-2 rounded-xl p-4 cursor-pointer flex flex-col gap-2" [class.border-[#0f2140]]="form.pagamento==='boleto'" [class.bg-blue-50]="form.pagamento==='boleto'">
              <input type="radio" name="pag" value="boleto" [(ngModel)]="form.pagamento" class="accent-[#0f2140]"> <span class="font-bold text-sm"><i class="bi bi-upc-scan"></i> Boleto</span><span class="text-xs text-slate-500">1-2 dias úteis</span>
            </label>
            <label class="border-2 rounded-xl p-4 cursor-pointer flex flex-col gap-2" [class.border-[#0f2140]]="form.pagamento==='cartao'" [class.bg-blue-50]="form.pagamento==='cartao'">
              <input type="radio" name="pag" value="cartao" [(ngModel)]="form.pagamento" class="accent-[#0f2140]"> <span class="font-bold text-sm"><i class="bi bi-credit-card"></i> Cartão</span><span class="text-xs text-slate-500">Até 12x</span>
            </label>
          </div>
          <p class="text-xs text-slate-500 mt-3">B2B: faturado com prazo (contato: logocalogisticas&#64;contato.com) disponível após análise.</p>
        </div>
      </div>

      <!-- Resumo -->
      <div class="card-logoca h-fit sticky top-[90px]">
        <h3 class="font-bold text-[#0f2140]">Resumo</h3>
        <div class="mt-3 space-y-2 text-sm max-h-64 overflow-auto pr-1">
          <div *ngFor="let it of items" class="flex justify-between gap-2 border-b border-slate-100 pb-2">
            <span class="truncate">{{it.quantidade}}× {{it.produto.nome}}</span>
            <span class="font-semibold shrink-0">{{ (it.produto.precoVenda * it.quantidade) | currency:'BRL' }}</span>
          </div>
        </div>
        <div *ngIf="items.length===0" class="text-sm text-slate-500 py-6 text-center">Carrinho vazio — <a routerLink="/catalogo" class="text-[#ff6b00] font-bold underline">ir ao catálogo</a></div>
        <div class="mt-4 space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-slate-500">Subtotal</span><span class="font-semibold">{{ (cart.total$ | async) | currency:'BRL' }}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Frete estimado</span><span class="font-semibold text-emerald-600">R$ 32,00</span></div>
          <div *ngIf="form.pagamento==='pix'" class="flex justify-between text-emerald-600 font-bold"><span>Desconto PIX 5%</span><span>- {{ (((cart.total$ | async) || 0) * 0.05) | currency:'BRL' }}</span></div>
          <div class="h-px bg-slate-200 my-2"></div>
          <div class="flex justify-between text-base"><span class="font-bold text-[#0f2140]">Total</span><span class="text-xl font-black text-[#0f2140]">{{ totalComFrete(items) | currency:'BRL' }}</span></div>
        </div>
        <button (click)="finalizar()" [disabled]="items.length===0 || loading" class="btn-primary-logoca w-full mt-6 !py-3.5 disabled:opacity-50">
          <span *ngIf="!loading">Finalizar pedido <i class="bi bi-bag-check-fill"></i></span>
          <span *ngIf="loading" class="inline-flex items-center gap-2"><span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span> Processando...</span>
        </button>
        <p *ngIf="pedidoId" class="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-sm text-center">
          <i class="bi bi-check-circle-fill"></i> Pedido <strong>{{pedidoId}}</strong> criado!<br><span class="text-xs">Confirmação enviada para {{form.email || 'seu e-mail'}}</span>
        </p>
        <p class="text-xs text-slate-400 mt-3 text-center">Dúvidas? Fale em logocalogisticas&#64;contato.com</p>
      </div>
    </div>
  </section>
  `
})
export class CheckoutComponent {
  form = { nome: '', tipo: 'B2C' as 'B2C'|'B2B', documento: '', email: '', telefone: '', cep: '', endereco: '', pagamento: 'pix' };
  loading = false;
  pedidoId = '';
  constructor(public cart: CartService, private api: ApiService, private router: Router) {}

  totalComFrete(items: any[]): number {
    const subtotal = items.reduce((a, i) => a + i.produto.precoVenda * i.quantidade, 0);
    const frete = 32;
    const desc = this.form.pagamento === 'pix' ? subtotal * 0.05 : 0;
    return subtotal + frete - desc;
  }
  finalizar() {
    if (!this.form.nome || !this.form.email) { alert('Preencha nome e e-mail.'); return; }
    this.loading = true;
    const payload = { ...this.form, itens: this.cart.getItems(), total: this.totalComFrete(this.cart.getItems()) };
    this.api.criarPedido(payload).subscribe(res => {
      this.pedidoId = res.id;
      this.loading = false;
      this.cart.clear();
      setTimeout(() => this.router.navigateByUrl('/catalogo'), 3000);
    });
  }
}
