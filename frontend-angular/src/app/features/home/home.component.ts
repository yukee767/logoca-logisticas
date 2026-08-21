import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, Produto } from '../../core/services/api.service';
import { CardProdutoComponent } from '../../shared/components/card-produto/card-produto.component';
// Chart.js
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, CardProdutoComponent],
  template: `
  <!-- HERO -->
  <section class="relative overflow-hidden bg-[#0f2140]">
    <div class="absolute inset-0 opacity-20" style="background: radial-gradient(600px 400px at 80% 10%, #ff6b00 0%, transparent 60%), radial-gradient(800px 600px at 10% 90%, #1a3a6b 0%, transparent 60%)"></div>
    <div class="relative max-w-7xl mx-auto px-4 py-10 sm:py-14 md:py-20 grid lg:grid-cols-2 gap-8 sm:gap-10 items-center">
      <div class="text-white min-w-0">
        <span class="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white text-[11px] sm:text-xs font-bold tracking-widest px-3 py-1.5 rounded-full backdrop-blur max-w-full">
          <span class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0"></span> <span class="truncate">GALPÕES A, B e C • GUARULHOS/SP • 24-72H</span>
        </span>
        <h1 class="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl leading-tight mt-4">
          Logística que<br>
          <span class="text-[#ff6b00]">move o seu</span> negócio
        </h1>
        <p class="text-slate-300 text-base sm:text-lg leading-relaxed mt-4 max-w-xl">
          Armazenagem inteligente, coleta no seu galpão, transporte ágil e e-commerce B2C/B2B integrado. Parceiros oficiais <strong class="text-white">Brahma</strong> e <strong class="text-white">Pepsi</strong>.
        </p>
        <div class="flex flex-col sm:flex-row sm:flex-wrap gap-3 mt-8">
          <a routerLink="/catalogo" class="btn-primary-logoca text-base !px-8 w-full sm:w-auto justify-center">Ver catálogo <i class="bi bi-arrow-right"></i></a>
          <a routerLink="/para-empresas" class="inline-flex items-center justify-center gap-2 bg-white text-[#0f2140] font-bold px-8 py-3 rounded-xl hover:bg-slate-100 transition w-full sm:w-auto">Para empresas</a>
          <a href="mailto:logocalogisticas@contato.com" class="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition w-full sm:w-auto text-sm sm:text-base"><i class="bi bi-envelope"></i> logocalogisticas&#64;contato.com</a>
        </div>
        <div class="grid grid-cols-3 gap-2 sm:gap-4 mt-8 sm:mt-10 max-w-lg">
          <div class="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 backdrop-blur text-center sm:text-left transition hover:bg-white/10">
            <div class="text-lg sm:text-2xl font-black text-white">+2.800</div><div class="text-[11px] sm:text-xs text-slate-400">Entregas/mês</div>
          </div>
          <div class="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 backdrop-blur text-center sm:text-left transition hover:bg-white/10">
            <div class="text-lg sm:text-2xl font-black text-white">3</div><div class="text-[11px] sm:text-xs text-slate-400">Galpões próprios</div>
          </div>
          <div class="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 backdrop-blur text-center sm:text-left transition hover:bg-white/10">
            <div class="text-lg sm:text-2xl font-black text-white">99.2%</div><div class="text-[11px] sm:text-xs text-slate-400">SLA no prazo</div>
          </div>
        </div>
      </div>
      <div class="relative min-w-0">
        <div class="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-2 sm:p-3 shadow-2xl">
          <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=900" alt="Galpão LogoCá" class="rounded-[1.2rem] sm:rounded-[1.4rem] w-full h-[240px] sm:h-[320px] md:h-[380px] object-cover">
          <div class="absolute bottom-3 left-3 right-3 sm:bottom-auto sm:-bottom-4 sm:left-2 sm:right-auto bg-white rounded-2xl shadow-xl p-3 sm:p-4 flex items-center gap-3 border border-slate-100">
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 text-lg sm:text-xl shrink-0"><i class="bi bi-check2-circle"></i></div>
            <div class="min-w-0"><div class="font-bold text-[#0f2140] leading-none text-sm sm:text-base truncate">Coleta agendada</div><div class="text-[11px] sm:text-xs text-slate-500">Retirada no seu galpão em até 24h</div></div>
          </div>
          <div class="absolute -top-2 -right-2 sm:-top-2 sm:-right-2 bg-[#ff6b00] text-white rounded-xl sm:rounded-2xl shadow-xl px-3 py-2 sm:px-4 sm:py-3 scale-[0.9] sm:scale-100 origin-top-right">
            <div class="text-[10px] sm:text-xs font-bold tracking-widest opacity-90">PARCEIROS OFICIAIS</div>
            <div class="flex gap-2 mt-1">
              <span class="bg-white text-[#b91c1c] px-2 py-1 rounded font-black text-[11px] sm:text-xs">BRAHMA</span>
              <span class="bg-[#004B93] text-white px-2 py-1 rounded font-black text-[11px] sm:text-xs">PEPSI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- SERVIÇOS -->
  <section class="max-w-7xl mx-auto px-4 py-10 sm:py-14 overflow-hidden">
    <div class="text-center max-w-2xl mx-auto px-2">
      <span class="badge-logoca">NOSSOS SERVIÇOS</span>
      <h2 class="font-display font-extrabold text-2xl sm:text-3xl text-[#0f2140] mt-3">Do galpão à porta do cliente</h2>
      <p class="text-slate-500 mt-2 text-sm sm:text-base">Operação completa ou modular — você escolhe o que terceirizar com a LogoCá.</p>
      <p class="sm:hidden text-xs text-slate-400 mt-2 flex items-center justify-center gap-1"><i class="bi bi-hand-index"></i> Deslize para ver mais <i class="bi bi-arrow-right"></i></p>
    </div>
    <div class="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 sm:overflow-visible sm:pb-0 scrollbar-hide scroll-smooth mt-8 sm:mt-10">
      <div class="card-logoca group min-w-[85vw] max-w-[340px] sm:min-w-0 sm:max-w-none snap-center shrink-0 sm:shrink">
        <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#0f2140] text-xl transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#0f2140] group-hover:text-white"><i class="bi bi-truck"></i></div>
        <h3 class="font-bold text-[#0f2140] mt-4 text-base sm:text-lg">Coleta no Galpão da Empresa</h3>
        <p class="text-sm text-slate-500 mt-1">Retiramos no seu centro de distribuição com frota própria e rastreio em tempo real.</p>
        <ul class="text-sm mt-3 space-y-1.5 text-slate-600"><li class="flex items-center gap-1.5"><i class="bi bi-check-circle-fill text-emerald-500"></i> Agendamento em até 24h</li><li class="flex items-center gap-1.5"><i class="bi bi-check-circle-fill text-emerald-500"></i> Romaneio digital</li></ul>
      </div>
      <div class="card-logoca group min-w-[85vw] max-w-[340px] sm:min-w-0 sm:max-w-none snap-center shrink-0 sm:shrink">
        <div class="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-[#ff6b00] text-xl transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#ff6b00] group-hover:text-white"><i class="bi bi-box-seam"></i></div>
        <h3 class="font-bold text-[#0f2140] mt-4 text-base sm:text-lg">Armazenagem em Nossos Galpões</h3>
        <p class="text-sm text-slate-500 mt-1">Galpões A (climatizado), B (seco) e C (pátio coberto) com WMS e segurança 24h.</p>
        <ul class="text-sm mt-3 space-y-1.5 text-slate-600"><li class="flex items-center gap-1.5"><i class="bi bi-check-circle-fill text-emerald-500"></i> Endereçamento e inventário</li><li class="flex items-center gap-1.5"><i class="bi bi-check-circle-fill text-emerald-500"></i> Picking & packing</li></ul>
      </div>
      <div class="card-logoca group min-w-[85vw] max-w-[340px] sm:min-w-0 sm:max-w-none snap-center shrink-0 sm:shrink">
        <div class="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-xl transition-transform duration-300 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white"><i class="bi bi-globe-americas"></i></div>
        <h3 class="font-bold text-[#0f2140] mt-4 text-base sm:text-lg">Transporte & Last Mile</h3>
        <p class="text-sm text-slate-500 mt-1">Distribuição nacional com SLA 24-72h e logística reversa.</p>
        <ul class="text-sm mt-3 space-y-1.5 text-slate-600"><li class="flex items-center gap-1.5"><i class="bi bi-check-circle-fill text-emerald-500"></i> Rastreio por pedido</li><li class="flex items-center gap-1.5"><i class="bi bi-check-circle-fill text-emerald-500"></i> Frete B2C e B2B</li></ul>
      </div>
    </div>
  </section>

  <!-- PARCEIROS -->
  <section class="bg-white border-y border-slate-100">
    <div class="max-w-7xl mx-auto px-4 py-8 sm:py-10">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div class="text-center sm:text-left">
          <h3 class="font-display font-bold text-lg sm:text-xl text-[#0f2140]">Parceiros que confiam na LogoCá</h3>
          <p class="text-sm text-slate-500">Qualidade e escala para atender do varejo ao atacado.</p>
        </div>
        <div class="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-4 w-full sm:w-auto">
          <div class="bg-[#fff1f2] border border-red-100 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl text-center transition hover:shadow-md hover:scale-[1.02]">
            <div class="font-black tracking-widest text-[#b91c1c] text-sm sm:text-base">BRAHMA</div><div class="text-[11px] sm:text-xs text-slate-500">Duplo Malte • Zero • Chopp</div>
          </div>
          <div class="bg-[#eff6ff] border border-blue-100 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl text-center transition hover:shadow-md hover:scale-[1.02]">
            <div class="font-black tracking-widest text-[#004B93] text-sm sm:text-base">PEPSI</div><div class="text-[11px] sm:text-xs text-slate-500">Pepsi Black • Guaraná Antarctica</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- PRODUTOS DESTAQUE + GRÁFICOS -->
  <section class="max-w-7xl mx-auto px-4 py-10 sm:py-14">
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div class="min-w-0">
        <span class="badge-logoca">E-COMMERCE B2C/B2B</span>
        <h2 class="font-display font-extrabold text-2xl sm:text-3xl text-[#0f2140] mt-2">Mais pedidos, menos dor de cabeça</h2>
        <p class="text-slate-500 text-sm mt-1">Preço com custo + 20% transparente • Qtd. mínima visível • Frete calculado no detalhe.</p>
      </div>
      <a routerLink="/catalogo" class="btn-outline-logoca w-full sm:w-auto justify-center shrink-0">Ver catálogo completo <i class="bi bi-arrow-right"></i></a>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6 sm:mt-8">
      <app-card-produto *ngFor="let p of destaques" [produto]="p" />
    </div>

    <!-- Gráficos Chart.js -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-8 sm:mt-10">
      <div class="card-logoca">
        <h3 class="font-bold text-[#0f2140] flex items-center gap-2 text-sm sm:text-base"><i class="bi bi-bar-chart-line text-[#ff6b00]"></i> Volume mensal por galpão (mil unidades)</h3>
        <canvas id="chartGalpao" class="mt-4 max-h-[220px] sm:max-h-[260px]"></canvas>
      </div>
      <div class="card-logoca">
        <h3 class="font-bold text-[#0f2140] flex items-center gap-2 text-sm sm:text-base"><i class="bi bi-pie-chart text-[#0f2140]"></i> Mix B2C vs B2B (último trimestre)</h3>
        <canvas id="chartMix" class="mt-4 max-h-[220px] sm:max-h-[260px]"></canvas>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="bg-[#0f2140] relative overflow-hidden">
    <div class="absolute inset-0 opacity-10" style="background: radial-gradient(500px 300px at 90% 20%, #ff6b00 0%, transparent 60%)"></div>
    <div class="relative max-w-7xl mx-auto px-4 py-10 sm:py-14 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
      <div class="text-white text-center lg:text-left">
        <h2 class="font-display font-extrabold text-2xl sm:text-3xl">Pronto para escalar sua operação?</h2>
        <p class="text-slate-300 mt-2 max-w-xl text-sm sm:text-base mx-auto lg:mx-0">Fale com nosso time comercial. Resposta em até 2h úteis. <span class="text-white font-semibold break-all">logocalogisticas&#64;contato.com</span></p>
      </div>
      <div class="flex flex-col sm:flex-row gap-3 shrink-0 w-full lg:w-auto">
        <a routerLink="/contato" class="btn-primary-logoca text-base w-full sm:w-auto justify-center">Solicitar proposta</a>
        <a routerLink="/para-empresas" class="inline-flex items-center justify-center gap-2 bg-white text-[#0f2140] font-bold px-6 py-3 rounded-xl w-full sm:w-auto hover:bg-slate-100 transition">Conhecer Para Empresas</a>
      </div>
    </div>
  </section>
  `
})
export class HomeComponent implements OnInit, AfterViewInit {
  destaques: Produto[] = [];
  constructor(private api: ApiService) {}
  ngOnInit() {
    this.api.getProdutos().subscribe(list => this.destaques = list.slice(0, 4));
  }
  ngAfterViewInit() {
    setTimeout(() => this.renderCharts(), 600);
  }
  private renderCharts() {
    const c1 = document.getElementById('chartGalpao') as HTMLCanvasElement | null;
    const c2 = document.getElementById('chartMix') as HTMLCanvasElement | null;
    if (c1) {
      new Chart(c1, {
        type: 'bar',
        data: {
          labels: ['Galpão A', 'Galpão B', 'Galpão C'],
          datasets: [
            { label: 'Jan', data: [42, 38, 12], backgroundColor: '#0f2140' },
            { label: 'Fev', data: [48, 41, 15], backgroundColor: '#ff6b00' },
            { label: 'Mar', data: [55, 46, 18], backgroundColor: '#94a3b8' },
          ]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
      });
    }
    if (c2) {
      new Chart(c2, {
        type: 'doughnut',
        data: {
          labels: ['B2C', 'B2B'],
          datasets: [{ data: [58, 42], backgroundColor: ['#0f2140', '#ff6b00'], borderWidth: 0 }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } }, cutout: '62%' }
      });
    }
  }
}
