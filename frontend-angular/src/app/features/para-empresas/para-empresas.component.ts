import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-para-empresas',
  standalone: true,
  imports: [RouterLink],
  template: `
  <section class="bg-[#0f2140] text-white relative overflow-hidden">
    <div class="absolute inset-0 opacity-20" style="background: radial-gradient(600px 300px at 85% 30%, #ff6b00 0%, transparent 60%)"></div>
    <div class="relative max-w-7xl mx-auto px-4 py-14 grid lg:grid-cols-2 gap-10 items-center">
      <div>
        <span class="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3 py-1.5 rounded-full text-xs font-bold tracking-widest">B2B • ATACADO • LOGÍSTICA DEDICADA</span>
        <h1 class="font-display font-extrabold text-4xl leading-tight mt-4">Logística completa<br><span class="text-[#ff6b00]">para sua empresa</span></h1>
        <p class="text-slate-300 text-lg leading-relaxed mt-3">Da coleta no seu galpão à armazenagem nos nossos e distribuição nacional. Solução modular ou full outsourcing.</p>
        <div class="flex flex-wrap gap-3 mt-8">
          <a href="mailto:logocalogisticas@contato.com?subject=Orçamento%20B2B%20-%20LogoCá" class="btn-primary-logoca text-base">Solicitar orçamento <i class="bi bi-envelope-arrow-up"></i></a>
          <span class="inline-flex items-center gap-2 border border-white/20 px-5 py-3 rounded-xl font-semibold bg-white/5 backdrop-blur"><i class="bi bi-envelope"></i> logocalogisticas&#64;contato.com</span>
        </div>
      </div>
      <div class="bg-white rounded-[1.8rem] p-2 shadow-2xl">
        <img src="https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=900" alt="Operação B2B" class="rounded-[1.4rem] w-full h-[360px] object-cover">
      </div>
    </div>
  </section>

  <section class="max-w-7xl mx-auto px-4 py-14">
    <div class="grid md:grid-cols-3 gap-6">
      <div class="card-logoca border-t-4 border-t-[#0f2140]">
        <div class="w-12 h-12 rounded-xl bg-[#0f2140] text-white flex items-center justify-center text-xl"><i class="bi bi-truck"></i></div>
        <h3 class="font-bold text-[#0f2140] mt-4 text-lg">1. Coleta no Galpão da Empresa</h3>
        <p class="text-sm text-slate-500 mt-1">Retirada programada no seu CD/fábrica com frota própria, conferência e romaneio digital. Sem precisar levar até nós.</p>
        <ul class="mt-3 space-y-1.5 text-sm text-slate-700">
          <li><i class="bi bi-check-circle-fill text-emerald-500"></i> Agendamento 24h • Janela fixa</li>
          <li><i class="bi bi-check-circle-fill text-emerald-500"></i> Frota rastreada • Seguro de carga</li>
          <li><i class="bi bi-check-circle-fill text-emerald-500"></i> Coleta fracionada ou lotação</li>
        </ul>
      </div>
      <div class="card-logoca border-t-4 border-t-[#ff6b00]">
        <div class="w-12 h-12 rounded-xl bg-[#ff6b00] text-white flex items-center justify-center text-xl"><i class="bi bi-box-seam"></i></div>
        <h3 class="font-bold text-[#0f2140] mt-4 text-lg">2. Transporte Inteligente</h3>
        <p class="text-sm text-slate-500 mt-1">Transferência entre galpões e distribuição last mile. Roteirização e SLA 24-72h.</p>
        <ul class="mt-3 space-y-1.5 text-sm text-slate-700">
          <li><i class="bi bi-check-circle-fill text-emerald-500"></i> Rastreio por pedido/NF</li>
          <li><i class="bi bi-check-circle-fill text-emerald-500"></i> Entrega B2B e B2C</li>
          <li><i class="bi bi-check-circle-fill text-emerald-500"></i> Logística reversa</li>
        </ul>
      </div>
      <div class="card-logoca border-t-4 border-t-emerald-500">
        <div class="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl"><i class="bi bi-buildings"></i></div>
        <h3 class="font-bold text-[#0f2140] mt-4 text-lg">3. Armazenagem em Nossos Galpões</h3>
        <p class="text-sm text-slate-500 mt-1">Galpões A (climatizado), B (seco) e C (pátio) em Guarulhos/SP com WMS completo.</p>
        <ul class="mt-3 space-y-1.5 text-sm text-slate-700">
          <li><i class="bi bi-check-circle-fill text-emerald-500"></i> Endereçamento, inventário cíclico</li>
          <li><i class="bi bi-check-circle-fill text-emerald-500"></i> Picking, packing e kitting</li>
          <li><i class="bi bi-check-circle-fill text-emerald-500"></i> Segurança 24h + CFTV</li>
        </ul>
      </div>
    </div>

    <!-- Comparativo / Benefícios -->
    <div class="grid lg:grid-cols-2 gap-6 mt-10">
      <div class="card-logoca bg-[#0f2140] text-white !border-0">
        <h3 class="font-display font-bold text-xl">Por que terceirizar com a LogoCá?</h3>
        <div class="grid sm:grid-cols-2 gap-4 mt-6 text-sm">
          <div class="bg-white/10 rounded-xl p-4 border border-white/10"><div class="font-bold">-30% custo logístico</div><div class="text-slate-300 text-xs mt-1">vs operação própria (cliente médio)</div></div>
          <div class="bg-white/10 rounded-xl p-4 border border-white/10"><div class="font-bold">99,2% OTIF</div><div class="text-slate-300 text-xs mt-1">On-time in-full</div></div>
          <div class="bg-white/10 rounded-xl p-4 border border-white/10"><div class="font-bold">WMS integrado</div><div class="text-slate-300 text-xs mt-1">API com seu ERP/e-commerce</div></div>
          <div class="bg-white/10 rounded-xl p-4 border border-white/10"><div class="font-bold">Escalável</div><div class="text-slate-300 text-xs mt-1">Sazonalidade sem dor</div></div>
        </div>
      </div>
      <div class="card-logoca">
        <h3 class="font-bold text-[#0f2140] text-lg">Planos B2B</h3>
        <div class="mt-4 space-y-3 text-sm">
          <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div><div class="font-bold text-[#0f2140]">Essencial</div><div class="text-xs text-slate-500">Até 500 pedidos/mês</div></div>
            <div class="text-right"><div class="font-black text-[#0f2140]">Sob consulta</div><a href="mailto:logocalogisticas@contato.com?subject=Plano%20Essencial" class="text-xs font-bold text-[#ff6b00] underline">Solicitar</a></div>
          </div>
          <div class="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-200">
            <div><div class="font-bold text-[#0f2140]">Profissional ⭐</div><div class="text-xs text-slate-500">Até 2.000 pedidos/mês + WMS</div></div>
            <div class="text-right"><div class="font-black text-[#0f2140]">Sob consulta</div><a href="mailto:logocalogisticas@contato.com?subject=Plano%20Profissional" class="text-xs font-bold text-[#ff6b00] underline">Solicitar</a></div>
          </div>
          <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div><div class="font-bold text-[#0f2140]">Enterprise</div><div class="text-xs text-slate-500">Ilimitado + operação dedicada</div></div>
            <div class="text-right"><div class="font-black text-[#0f2140]">Sob consulta</div><a href="mailto:logocalogisticas@contato.com?subject=Plano%20Enterprise" class="text-xs font-bold text-[#ff6b00] underline">Solicitar</a></div>
          </div>
        </div>
        <p class="text-xs text-slate-400 mt-3">Todos os planos incluem preço B2B especial no catálogo (ex: Brahma/Pepsi com desconto).</p>
      </div>
    </div>

    <!-- CTA -->
    <div class="mt-10 bg-gradient-to-r from-[#ff6b00] to-[#ff8c33] rounded-[1.8rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 text-white shadow-xl">
      <div>
        <h3 class="font-display font-extrabold text-2xl">Vamos desenhar sua operação?</h3>
        <p class="text-white/90 mt-1">Resposta em até 2h úteis. Fale direto com o comercial.</p>
        <p class="font-mono font-bold mt-2 bg-white text-[#ff6b00] inline-block px-3 py-1 rounded-lg">logocalogisticas&#64;contato.com</p>
      </div>
      <div class="flex flex-col gap-3 shrink-0">
        <a href="mailto:logocalogisticas@contato.com?subject=Quero%20contratar%20a%20LogoCá%20-%20B2B&body=Olá%20LogoCá%2C%0A%0AGostaria%20de%20um%20orçamento%20para%3A%0A-%20Coleta%20no%20galpão%0A-%20Armazenagem%0A-%20Transporte%0A%0AEmpresa%3A%0ACidade%3A%0AVolume%20mensal%3A" class="inline-flex items-center justify-center gap-2 bg-[#0f2140] hover:bg-[#0a1830] text-white font-bold px-8 py-3.5 rounded-xl transition shadow-lg">Enviar e-mail agora <i class="bi bi-send"></i></a>
        <a routerLink="/contato" class="inline-flex items-center justify-center gap-2 bg-white text-[#0f2140] font-bold px-8 py-3 rounded-xl">Formulário de contato</a>
      </div>
    </div>
  </section>
  `
})
export class ParaEmpresasComponent {}
