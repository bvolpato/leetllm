export const A = Object.freeze([
  [1, 2, 0],
  [-1, 3, 2],
]);
export const B = Object.freeze([
  [2, -1],
  [1, 4],
  [3, 0],
]);

export const rightEdge = { a: A, b: B.map(([left]) => [left]), row: 1, col: 0 };

export const bottomEdge = {
  a: [[...A[0], 1, 1]],
  b: [...B, [2, -2], [1, 4]],
  row: 0,
  col: 1,
};
