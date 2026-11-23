export const clip = (p) => Math.max(0, Math.min(1, p));
export const sum = (a) => a.reduce((x, y) => x + y, 0);
export const dcg = (grades) => sum(grades.map((v, i) => (2 ** v - 1) / Math.log2(i + 2)));
