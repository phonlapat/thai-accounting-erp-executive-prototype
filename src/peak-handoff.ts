export type ZeroDataSurface = 'gate' | 'waiting-dashboard' | 'real-dashboard';

export function zeroDataSurface(hasSnapshot: boolean, handoffStarted: boolean): ZeroDataSurface {
  if (hasSnapshot) return 'real-dashboard';
  return handoffStarted ? 'waiting-dashboard' : 'gate';
}
