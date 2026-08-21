import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sobre',
  standalone: true,
  imports: [RouterLink],
  template: `
  <section class="bg-[#0f2140] text-white">
    <div class="max-w-7xl mx-auto px-4 py-14">
      <span class="badge-logoca !bg-white/10 !text-white !border-white/15">SOBRE A LOGOCÁ</span>
      <h1 class="font-display font-extrabold text-4xl leading-tight mt-3">Logística é sobre<br><span class="text-[#ff6b00]">confiança</span></h1>
      <p class="text-slate-300 max-w-2xl mt-3 leading-relaxed">Nascemos para resolver a dor de quem precisa armazenar, transportar e vender sem dor de cabeça. Hoje operamos 3 galpões em Guarulhos/SP e atendemos de pequenos e-commerces a grandes contas como Brahma e Pepsi.</p>
    </div>
  </section>

  <section class="max-w-7xl mx-auto px-4 py-12">
    <div class="grid lg:grid-cols-3 gap-6">
      <div class="card-logoca text-center">
        <div class="text-3xl">🎯</div><h3 class="font-bold text-[#0f2140] mt-2">Missão</h3><p class="text-sm text-slate-500 mt-1">Entregar operações logísticas simples, transparentes e escaláveis para empresas B2C e B2B.</p>
      </div>
      <div class="card-logoca text-center">
        <div class="text-3xl">👁️</div><h3 class="font-bold text-[#0f2140] mt-2">Visão</h3><p class="text-sm text-slate-500 mt-1">Ser a plataforma logística preferida do Brasil até 2030, conectando galpões, transporte e e-commerce.</p>
      </div>
      <div class="card-logoca text-center">
        <div class="text-3xl">🤝</div><h3 class="font-bold text-[#0f2140] mt-2">Valores</h3><p class="text-sm text-slate-500 mt-1">Transparência no preço (custo +20%), pontualidade e parceria de longo prazo.</p>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-8 mt-10">
      <div>
        <h2 class="font-display font-bold text-2xl text-[#0f2140]">Nossa história</h2>
        <div class="mt-4 space-y-4 text-sm leading-relaxed text-slate-600">
          <p><strong class="text-[#0f2140]">2019</strong> — Fundação em Guarulhos com 1 galpão (B) focado em bebidas.</p>
          <p><strong class="text-[#0f2140]">2021</strong> — Parceria com Brahma e Pepsi, expansão para galpão A climatizado.</p>
          <p><strong class="text-[#0f2140]">2023</strong> — Lançamento do e-commerce B2C/B2B com preço transparente e WMS próprio.</p>
          <p><strong class="text-[#0f2140]">2026</strong> — 3 galpões, +2.800 entregas/mês, 99,2% SLA.</p>
        </div>
      </div>
      <div class="card-logoca !p-2">
        <img src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800" alt="Equipe LogoCá" class="rounded-xl w-full h-64 object-cover">
        <div class="p-4">
          <h3 class="font-bold text-[#0f2140]">Galpões em Guarulhos/SP</h3>
          <ul class="text-sm text-slate-500 mt-2 space-y-1">
            <li><i class="bi bi-check2 text-emerald-500"></i> Galpão A — Climatizado (bebidas premium)</li>
            <li><i class="bi bi-check2 text-emerald-500"></i> Galpão B — Seco (alto giro)</li>
            <li><i class="bi bi-check2 text-emerald-500"></i> Galpão C — Pátio coberto (paletes, embalagens)</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="mt-10 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200" class="w-14 h-14 rounded-xl object-cover">
        <div><div class="font-bold text-[#0f2140]">Diretoria LogoCá</div><div class="text-xs text-slate-500">“Logística boa é invisível. Quando tudo chega no prazo, nosso cliente vende mais.”</div></div>
      </div>
      <a routerLink="/contato" class="btn-primary-logoca whitespace-nowrap">Fale com a gente</a>
    </div>
  </section>
  `
})
export class SobreComponent {}
