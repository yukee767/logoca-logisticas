import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <app-header />
    <main class="min-h-[60vh] overscroll-contain" style="overscroll-behavior: contain;"><router-outlet /></main>
    <app-footer />
  `
})
export class LayoutComponent {}
