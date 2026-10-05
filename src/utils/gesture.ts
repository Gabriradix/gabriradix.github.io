export function getGestureAxis(deltaX: number, deltaY: number, threshold = 8): 'pending' | 'horizontal' | 'vertical' {
  if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < threshold) return 'pending';
  return Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
}
