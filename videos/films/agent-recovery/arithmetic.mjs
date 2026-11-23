export function fullJitter(attempt, fraction) {
  const cap = Math.min(8, 2 ** (attempt - 1));
  return {
    cap,
    wait: cap * fraction,
  };
}
