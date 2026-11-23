export const matvec = (matrix, vector) =>
  matrix.map((row) => row.reduce((sum, value, i) => sum + value * vector[i], 0));
export const matmul = (left, right) =>
  left.map((row) =>
    right[0].map((_, j) => row.reduce((sum, value, k) => sum + value * right[k][j], 0)),
  );
