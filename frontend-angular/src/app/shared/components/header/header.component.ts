import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
  <header class="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
    <!-- Topbar -->
    <div class="bg-[#0f2140] text-white text-xs">
      <div class="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <span class="flex items-center gap-4">
          <span class="inline-flex items-center gap-1.5"><i class="bi bi-envelope"></i> logocalogisticas&#64;contato.com</span>
          <span class="hidden sm:inline-flex items-center gap-1.5"><i class="bi bi-telephone"></i> (11) 99999-9999</span>
        </span>
        <span class="inline-flex items-center gap-2">
          <span class="hidden md:inline opacity-80">Parceiros:</span>
          <span class="bg-white text-[#0f2140] px-2 py-0.5 rounded font-black text-[10px] tracking-wider">BRAHMA</span>
          <span class="bg-[#004B93] text-white px-2 py-0.5 rounded font-black text-[10px] tracking-wider">PEPSI</span>
          <span class="opacity-80 hidden lg:inline">| Entrega 24-72h</span>
        </span>
      </div>
    </div>

    <!-- Main nav -->
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex items-center justify-between h-[68px] gap-4">
        <a routerLink="/" class="flex items-center gap-3 shrink-0">
          <div class="w-10 h-10 rounded-xl bg-[#0f2140] flex items-center justify-center text-white font-black text-lg">LC</div>
          <div class="leading-tight">
            <div class="font-display font-extrabold text-[#0f2140] text-lg leading-none">LogoCá</div>
            <div class="text-[11px] tracking-[0.18em] font-bold text-[#ff6b00] -mt-0.5">LOGÍSTICAS</div>
          </div>
        </a>

        <nav class="hidden lg:flex items-center gap-1 font-medium text-sm">
          <a routerLink="/" routerLinkActive="text-[#ff6b00] bg-orange-50" [routerLinkActiveOptions]="{exact:true}" class="px-3 py-2 rounded-lg hover:bg-slate-100 transition">Início</a>
          <a routerLink="/catalogo" routerLinkActive="text-[#ff6b00] bg-orange-50" class="px-3 py-2 rounded-lg hover:bg-slate-100 transition">Catálogo</a>
          <a routerLink="/para-empresas" routerLinkActive="text-[#ff6b00] bg-orange-50" class="px-3 py-2 rounded-lg hover:bg-slate-100 transition">Para Empresas</a>
          <a routerLink="/sobre" routerLinkActive="text-[#ff6b00] bg-orange-50" class="px-3 py-2 rounded-lg hover:bg-slate-100 transition">Sobre</a>
          <a routerLink="/contato" routerLinkActive="text-[#ff6b00] bg-orange-50" class="px-3 py-2 rounded-lg hover:bg-slate-100 transition">Contato</a>
        </nav>

        <div class="flex items-center gap-2">
          <a routerLink="/carrinho" class="relative inline-flex items-center justify-center w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 transition">
            <i class="bi bi-cart3 text-lg text-[#0f2140]"></i>
            <span *ngIf="(cart.count$ | async) as c" class="absolute -top-1 -right-1 bg-[#ff6b00] text-white text-[11px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center">{{ c }}</span>
          </a>
          <a routerLink="/catalogo" class="hidden sm:inline-flex btn-primary-logoca !py-2.5 !px-5 text-sm">Comprar agora</a>
          <button class="lg:hidden inline-flex w-11 h-11 items-center justify-center rounded-xl border border-slate-200" (click)="toggle()">
            <i class="bi" [ngClass]="open ? 'bi-x-lg' : 'bi-list'" style="font-size:1.4rem"></i>
          </button>
        </div>
      </div>

      <!-- Mobile menu -->
      <div *ngIf="open" class="lg:hidden pb-4 border-t border-slate-100 pt-3 flex flex-col gap-1 overscroll-contain max-h-[70vh] overflow-y-auto" style="overscroll-behavior: contain; -webkit-overflow-scrolling: touch;">
        <a (click)="close()" routerLink="/" class="px-3 py-2.5 rounded-lg hover:bg-slate-100 font-medium">Início</a>
        <a (click)="close()" routerLink="/catalogo" class="px-3 py-2.5 rounded-lg hover:bg-slate-100 font-medium">Catálogo</a>
        <a (click)="close()" routerLink="/para-empresas" class="px-3 py-2.5 rounded-lg hover:bg-slate-100 font-medium">Para Empresas</a>
        <a (click)="close()" routerLink="/sobre" class="px-3 py-2.5 rounded-lg hover:bg-slate-100 font-medium">Sobre</a>
        <a (click)="close()" routerLink="/contato" class="px-3 py-2.5 rounded-lg bg-[#0f2140] text-white text-center font-semibold mt-2">Fale conosco</a>
      </div>
    </div>
  </header>
  `
})
export class HeaderComponent {
  open = false;
  constructor(public cart: CartService, public auth: AuthService) {}
  toggle() {
    this.open = !this.open;
    this.lockBody(this.open);
  }
  close() {
    this.open = false;
    this.lockBody(false);
  }
  private lockBody(lock: boolean) {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = lock ? 'hidden' : '';
      document.documentElement.style.overscrollBehavior = lock ? 'none' : '';
      if (lock) {
        document.body.style.touchAction = 'none';
      } else {
        document.body.style.touchAction = '';
      }
    }
  }
}
