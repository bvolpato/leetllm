export const ids = [
  'intro',
  'mesh',
  'tensor',
  'pipeline',
  'context',
  'experts',
  'optimizer',
  'recovery',
];
export const sizes = {
  tp: 4,
  cp: 2,
  dp: 4,
  pp: 2,
};
export const order = ['tp', 'cp', 'dp', 'pp'];
export const input = [1, 2];
export const up = [
  [1, 0, -1, 0.5],
  [0, 1, 1, 0],
];
export const down = [
  [1, 0],
  [0, 1],
  [1, 1],
  [-1, 1],
];
export const context = [
  [1, 3, 9, 8],
  [2, 4, 2],
];
export const trackedColumn = 6;
export const checkpointRow = [1, 2, 3, 4, 5, 6, 1.5, 8];
