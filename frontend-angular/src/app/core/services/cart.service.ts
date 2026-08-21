import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { Produto } from './api.service';

export interface CartItem {
  produto: Produto;
  quantidade: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private itemsSubject = new BehaviorSubject<CartItem[]>(this.load());
  items$ = this.itemsSubject.asObservable();

  count$ = this.items$.pipe(map(items => items.reduce((a, i) => a + i.quantidade, 0)));
  total$ = this.items$.pipe(map(items => items.reduce((a, i) => a + i.produto.precoVenda * i.quantidade, 0)));
  totalCusto$ = this.items$.pipe(map(items => items.reduce((a, i) => a + i.produto.precoCusto * i.quantidade, 0)));

  private load(): CartItem[] {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('logoca_cart') : null;
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
  private persist(items: CartItem[]) {
    if (typeof localStorage !== 'undefined') localStorage.setItem('logoca_cart', JSON.stringify(items));
  }

  getItems(): CartItem[] { return this.itemsSubject.value; }

  add(produto: Produto, qtd: number = 1) {
    const items = [...this.itemsSubject.value];
    const idx = items.findIndex(i => i.produto.id === produto.id);
    const minima = produto.quantidadeMinima;
    let quantidade = qtd < minima ? minima : qtd;
    if (idx >= 0) {
      items[idx] = { ...items[idx], quantidade: items[idx].quantidade + quantidade };
    } else {
      items.push({ produto, quantidade });
    }
    this.itemsSubject.next(items);
    this.persist(items);
  }

  updateQuantidade(produtoId: number, qtd: number) {
    const items = this.itemsSubject.value.map(i => i.produto.id === produtoId ? { ...i, quantidade: Math.max(i.produto.quantidadeMinima, qtd) } : i);
    this.itemsSubject.next(items);
    this.persist(items);
  }

  remove(produtoId: number) {
    const items = this.itemsSubject.value.filter(i => i.produto.id !== produtoId);
    this.itemsSubject.next(items);
    this.persist(items);
  }

  clear() {
    this.itemsSubject.next([]);
    this.persist([]);
  }

  getTotal(): number {
    return this.getItems().reduce((a, i) => a + i.produto.precoVenda * i.quantidade, 0);
  }
}
