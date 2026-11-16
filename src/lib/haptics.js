import { useStore } from '../store.js';
export function vibrate(pattern = 12) {
  if (!useStore.getState().settings.haptics) return;
  try { navigator.vibrate && navigator.vibrate(pattern); } catch {}
}
