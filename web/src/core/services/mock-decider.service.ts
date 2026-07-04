export function shouldUseMocks(): boolean {
  try {
    const env = import.meta.env;
    return (
      env.VITE_DEMO_MODE === 'true' ||
      env.VITE_USE_MOCKS === 'true' ||
      env.VITE_DEV_MODE === 'true' ||
      env.VITE_DEV_MODE === '1'
    );
  } catch {
    return false;
  }
}
