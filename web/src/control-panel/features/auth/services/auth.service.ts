import type { IAuthService, IAuthTokenStorage } from '@/control-panel/core/ports/auth.port';

export class LocalStorageTokenStorage implements IAuthTokenStorage {
  private key = 'boxty_token';

  getToken(): string | null {
    return localStorage.getItem(this.key);
  }

  setToken(token: string): void {
    localStorage.setItem(this.key, token);
  }

  clearToken(): void {
    localStorage.removeItem(this.key);
  }
}

export class AuthService implements IAuthService {
  constructor(private storage: IAuthTokenStorage) {}

  isAuthenticated(): boolean {
    const token = this.storage.getToken();
    return !!token && token.length > 0;
  }

  login(token: string): void {
    this.storage.setToken(token);
  }

  logout(): void {
    this.storage.clearToken();
  }

  isDevMode(): boolean {
    return (
      import.meta.env.VITE_DEMO_MODE === 'true' ||
      import.meta.env.VITE_DEV_MODE === 'true' ||
      import.meta.env.VITE_DEV_MODE === '1'
    );
  }
}

export const authService = new AuthService(new LocalStorageTokenStorage());
