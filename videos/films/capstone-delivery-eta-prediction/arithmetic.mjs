export const clamp = (p) => Math.max(0, Math.min(1, p));
export const motion = (p) => {
  const q = clamp((p - 0.08) / 0.7);
  return q * q * (3 - 2 * q);
};
export const sum = (a) => a.reduce((x, y) => x + y, 0);
export const clock = (value) => {
  const total = Math.round(value * 60);
  return (
    String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0')
  );
};
