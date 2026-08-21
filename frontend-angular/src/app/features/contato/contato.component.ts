import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-contato',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <section class="bg-[#0f2140] text-white overflow-hidden">
    <div class="max-w-7xl mx-auto px-4 py-8 sm:py-12 grid lg:grid-cols-2 gap-6 sm:gap-10 items-center">
      <div class="min-w-0">
        <h1 class="font-display font-extrabold text-3xl sm:text-4xl leading-tight">Fale com a LogoCá</h1>
        <p class="text-slate-300 mt-2 leading-relaxed text-sm sm:text-base">Orçamentos B2B, dúvidas de pedidos ou parcerias. Retorno em até 2h úteis.</p>
        <div class="mt-6 space-y-3 text-sm min-w-0">
          <div class="flex flex-col sm:flex-row sm:items-center gap-3 bg-white/10 border border-white/15 rounded-xl p-3 sm:px-4 sm:py-3 backdrop-blur min-w-0">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="w-10 h-10 rounded-lg bg-[#ff6b00] flex items-center justify-center shrink-0"><i class="bi bi-envelope-fill"></i></div>
              <div class="min-w-0 flex-1">
                <div class="text-xs opacity-70">E-mail oficial</div>
                <a href="mailto:logocalogisticas@contato.com" class="font-bold text-white hover:underline break-all text-sm sm:text-base leading-tight">logocalogisticas&#64;contato.com</a>
              </div>
            </div>
            <a href="mailto:logocalogisticas@contato.com" class="bg-white text-[#0f2140] font-bold px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm text-center w-full sm:w-auto shrink-0">Enviar e-mail</a>
          </div>
          <div class="flex gap-2 sm:gap-3 min-w-0">
            <div class="flex-1 min-w-0 bg-white/10 border border-white/15 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3"><div class="text-xs opacity-70">Telefone</div><div class="font-bold text-sm sm:text-base truncate">(11) 99999-9999</div></div>
            <div class="flex-1 min-w-0 bg-white/10 border border-white/15 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3"><div class="text-xs opacity-70">WhatsApp</div><div class="font-bold text-sm sm:text-base truncate">+55 11 99999-9999</div></div>
          </div>
          <div class="bg-white/10 border border-white/15 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 min-w-0"><div class="text-xs opacity-70">Endereço</div><div class="font-semibold text-sm sm:text-base break-words leading-snug">Galpões A, B e C — Guarulhos/SP • Atendemos todo Brasil</div></div>
        </div>
      </div>
      <div class="bg-white rounded-[1.2rem] sm:rounded-[1.6rem] p-1.5 sm:p-2 shadow-2xl min-w-0">
        <img src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=900" alt="Contato LogoCá" class="rounded-[1rem] sm:rounded-[1.2rem] w-full h-[220px] sm:h-[280px] md:h-[360px] object-cover">
      </div>
    </div>
  </section>

  <section class="max-w-7xl mx-auto px-4 py-10 grid lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 card-logoca">
      <h2 class="font-bold text-[#0f2140] text-lg">Envie sua mensagem</h2>
      <p class="text-xs text-slate-500">Todos os campos com * são obrigatórios. Responderemos em logocalogisticas&#64;contato.com</p>
      <form (ngSubmit)="enviar()" class="mt-4 grid sm:grid-cols-2 gap-4">
        <label class="text-sm font-medium">Nome * <input [(ngModel)]="form.nome" name="nome" required placeholder="Seu nome" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/20"></label>
        <label class="text-sm font-medium">E-mail * <input [(ngModel)]="form.email" name="email" required type="email" placeholder="seu@email.com" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50"></label>
        <label class="text-sm font-medium">Telefone <input [(ngModel)]="form.telefone" name="telefone" placeholder="(11) 99999-9999" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50"></label>
        <label class="text-sm font-medium">Assunto * <select [(ngModel)]="form.assunto" name="assunto" class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 bg-white"><option value="">Selecione</option><option>Orçamento B2B</option><option>Dúvida de pedido</option><option>Parceria Brahma/Pepsi</option><option>Outro</option></select></label>
        <label class="sm:col-span-2 text-sm font-medium">Mensagem * <textarea [(ngModel)]="form.mensagem" name="mensagem" required rows="5" placeholder="Descreva sua necessidade: volume mensal, cidade, tipo de operação..." class="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50"></textarea></label>
        <button type="submit" [disabled]="loading" class="sm:col-span-2 btn-primary-logoca !py-3.5 text-base disabled:opacity-50">
          <span *ngIf="!loading"><i class="bi bi-send"></i> Enviar mensagem</span>
          <span *ngIf="loading" class="inline-flex items-center gap-2"><span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span> Enviando...</span>
        </button>
      </form>
      <div *ngIf="sucesso" class="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-sm">
        <i class="bi bi-check-circle-fill"></i> Mensagem enviada com sucesso! Responderemos em <strong>logocalogisticas&#64;contato.com</strong> em até 2h úteis.
      </div>
      <div *ngIf="erro" class="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{{erro}}</div>
    </div>

    <div class="space-y-6">
      <div class="card-logoca bg-[#0f2140] text-white !border-0">
        <h3 class="font-bold">Prefere e-mail direto?</h3>
        <p class="text-sm text-slate-300 mt-1">Clique para abrir seu cliente de e-mail com assunto preenchido.</p>
        <a href="mailto:logocalogisticas@contato.com?subject=Contato%20via%20site%20LogoCá&body=Olá%20LogoCá%2C%0A%0A" class="inline-flex items-center gap-2 bg-[#ff6b00] hover:bg-[#e56000] text-white font-bold px-5 py-3 rounded-xl mt-4 w-full justify-center"><i class="bi bi-envelope-at"></i> logocalogisticas&#64;contato.com</a>
        <p class="text-xs text-slate-400 mt-3 text-center">Resposta garantida em até 2h úteis.</p>
      </div>
      <div class="card-logoca">
        <h3 class="font-bold text-[#0f2140]">Horário de atendimento</h3>
        <ul class="text-sm text-slate-600 mt-2 space-y-1">
          <li class="flex justify-between"><span>Seg - Sex</span><span class="font-semibold">08h - 18h</span></li>
          <li class="flex justify-between"><span>Sábado</span><span class="font-semibold">08h - 12h</span></li>
          <li class="flex justify-between"><span>Domingo</span><span class="font-semibold">Fechado</span></li>
        </ul>
      </div>
      <div class="card-logoca p-0 overflow-hidden">
        <div class="h-48 bg-slate-100 flex items-center justify-center text-slate-400"><i class="bi bi-geo-alt text-3xl"></i><span class="ml-2 font-medium">Mapa • Guarulhos/SP</span></div>
        <div class="p-4 text-sm"><div class="font-bold text-[#0f2140]">Galpões LogoCá</div><div class="text-slate-500">Distrito Industrial, Guarulhos/SP — Fácil acesso às marginais e Rod. Presidente Dutra.</div></div>
      </div>
    </div>
  </section>
  `
})
export class ContatoComponent {
  form = { nome: '', email: '', telefone: '', assunto: '', mensagem: '' };
  loading = false; sucesso = false; erro = '';
  constructor(private api: ApiService) {}
  enviar() {
    this.erro = ''; this.sucesso = false;
    if (!this.form.nome || !this.form.email || !this.form.mensagem || !this.form.assunto) { this.erro = 'Preencha todos os campos obrigatórios (*).'; return; }
    this.loading = true;
    this.api.enviarContato(this.form).subscribe({
      next: () => { this.loading = false; this.sucesso = true; this.form = { nome:'', email:'', telefone:'', assunto:'', mensagem:'' }; },
      error: () => { this.loading = false; this.erro = 'Erro ao enviar. Tente novamente ou envie direto para logocalogisticas@contato.com'; }
    });
  }
}
