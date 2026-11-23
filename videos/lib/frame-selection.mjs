// FFmpeg 9.0.2 rejected a flat `a+b+c` sum of 228 frame terms, and it parsed the same terms when
// they were grouped into a balanced sum. Lessons with many beats need this many terms.
export function frameSelection(frames) {
  const sum = (terms) => {
    if (terms.length <= 4) return terms.join('+');
    const middle = Math.ceil(terms.length / 2);
    return `(${sum(terms.slice(0, middle))})+(${sum(terms.slice(middle))})`;
  };
  return sum(frames.map((frame) => `eq(n\\,${frame})`));
}
