import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, delay, tap } from 'rxjs';

export interface User {
  id: number;
  nome: string;
  email: string;
  tipo: 'B2C' | 'B2B';
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(this.loadUser());
  user$ = this.userSubject.asObservable();
  isLogged$ = this.user$.pipe();

  private loadUser(): User | null {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('logoca_user') : null;
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  get user(): User | null { return this.userSubject.value; }
  get isLogged(): boolean { return !!this.userSubject.value; }
  get token(): string | null { return this.user?.token ?? null; }

  login(email: string, _senha: string): Observable<User> {
    // mock - em produção chama /auth/login
    const mock: User = {
      id: 1, nome: 'Cliente LogoCá', email, tipo: email.includes('empresa') ? 'B2B' : 'B2C', token: 'mock-jwt-token-' + Date.now()
    };
    return of(mock).pipe(delay(600), tap(u => {
      localStorage.setItem('logoca_user', JSON.stringify(u));
      localStorage.setItem('logoca_token', u.token);
      this.userSubject.next(u);
    }));
  }

  logout() {
    localStorage.removeItem('logoca_user');
    localStorage.removeItem('logoca_token');
    this.userSubject.next(null);
  }

  register(data: { nome: string; email: string; tipo: 'B2C' | 'B2B' }): Observable<User> {
    return this.login(data.email, 'senha');
  }
}
