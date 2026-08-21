import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
  <footer class="bg-[#0a1830] text-slate-300">
    <div class="max-w-7xl mx-auto px-4 py-12">
      <div class="grid md:grid-cols-4 gap-10">
        <div>
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#0f2140] font-black">LC</div>
            <div class="leading-tight">
              <div class="font-display font-extrabold text-white text-lg leading-none">LogoCá</div>
              <div class="text-[11px] tracking-[0.18em] font-bold text-[#ff6b00]">LOGÍSTICAS</div>
            </div>
          </div>
          <p class="text-sm leading-relaxed text-slate-400">Soluções completas em armazenagem, transporte e logística. Galpões modernos em Guarulhos/SP atendendo B2C e B2B em todo Brasil.</p>
          <div class="flex gap-2 mt-4">
            <span class="bg-white text-[#0f2140] px-2.5 py-1 rounded font-black text-xs">BRAHMA</span>
            <span class="bg-[#004B93] text-white px-2.5 py-1 rounded font-black text-xs">PEPSI</span>
          </div>
        </div>
        <div>
          <h4 class="text-white font-bold mb-3">Navegação</h4>
          <ul class="space-y-2 text-sm">
            <li><a routerLink="/" class="hover:text-white">Início</a></li>
            <li><a routerLink="/catalogo" class="hover:text-white">Catálogo</a></li>
            <li><a routerLink="/para-empresas" class="hover:text-white">Para Empresas</a></li>
            <li><a routerLink="/sobre" class="hover:text-white">Sobre</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-white font-bold mb-3">Serviços</h4>
          <ul class="space-y-2 text-sm text-slate-400">
            <li>Coleta no galpão da empresa</li>
            <li>Transporte rodoviário</li>
            <li>Armazenagem em galpões próprios</li>
            <li>E-commerce B2C / B2B</li>
            <li>Gestão de estoque & WMS</li>
          </ul>
        </div>
        <div>
          <h4 class="text-white font-bold mb-3">Contato</h4>
          <ul class="space-y-2 text-sm">
            <li class="flex gap-2"><i class="bi bi-envelope text-[#ff6b00]"></i> <a href="mailto:logocalogisticas@contato.com" class="hover:text-white">logocalogisticas&#64;contato.com</a></li>
            <li class="flex gap-2"><i class="bi bi-telephone text-[#ff6b00]"></i> (11) 99999-9999</li>
            <li class="flex gap-2"><i class="bi bi-geo-alt text-[#ff6b00]"></i> Guarulhos/SP - Galpões A, B e C</li>
          </ul>
          <a routerLink="/contato" class="inline-flex mt-4 bg-[#ff6b00] hover:bg-[#e56000] text-white font-semibold px-5 py-2.5 rounded-xl transition">Solicitar orçamento</a>
        </div>
      </div>
      <div class="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <span>© {{year}} LogoCá Logísticas. Todos os direitos reservados.</span>
        <span class="flex gap-4"><span>CNPJ 00.000.000/0001-00</span><span>•</span><span>Política de Privacidade</span></span>
      </div>
    </div>
  </footer>
  `
})
export class FooterComponent { year = new Date().getFullYear(); }
