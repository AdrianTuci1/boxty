export function shouldUseMocks(): boolean {
  try {
    return (import.meta as any).env?.VITE_USE_MOCKS === 'true';
  } catch {
    return false;
  }
}
