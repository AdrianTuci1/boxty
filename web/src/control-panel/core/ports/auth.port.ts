export interface IAuthTokenStorage {
  getToken(): string | null;
  setToken(token: string): void;
  clearToken(): void;
}

export interface IAuthService {
  isAuthenticated(): boolean;
  login(token: string): void;
  logout(): void;
  isDevMode(): boolean;
}
