import { createCueTrack } from 'vizmatic';
export const track = (ids) =>
  Object.fromEntries(
    ids.map((id) => [
      id,
      createCueTrack({
        initial: {
          id: id + '-initial',
          snapshot: {
            step: 0,
          },
        },
        cues: [0, 1, 2].map((step) => ({
          id: id + '-' + step,
          beat: step,
          at: 0,
          snapshot: {
            step,
          },
        })),
      }),
    ]),
  );
export const ids = ['intro', 'tail', 'dispatch', 'hidden', 'epsilon', 'traffic', 'promotion'];
export const tracks = track(ids);
export const calls = [
  {
    name: 'CUDA contiguous H=256',
    cuda: true,
    contiguous: true,
    h: 256,
    grad: false,
  },
  {
    name: 'CUDA transposed H=256',
    cuda: true,
    contiguous: false,
    h: 256,
    grad: false,
  },
  {
    name: 'CUDA contiguous H=129',
    cuda: true,
    contiguous: true,
    h: 129,
    grad: false,
  },
  {
    name: 'CUDA backward required',
    cuda: true,
    contiguous: true,
    h: 256,
    grad: true,
  },
  {
    name: 'CPU ordinary input',
    cuda: false,
    contiguous: true,
    h: 256,
    grad: false,
  },
];
export const gappedRows = {
  shape: [2, 4],
  strides: [6, 1],
  storage: [1, 2, 3, 4, null, null, 5, 6, 7, 8],
};
export const hostKernelFixtures = [
  {
    id: 'public',
    name: 'Public 2×4',
    shape: [2, 4],
    strides: [4, 1],
    storage: [1, 2, 3, 4, 5, 6, 7, 8],
  },
  ...[
    [10, 'Scaled large'],
    [0.01, 'Scaled small'],
    [-1, 'Negated'],
  ].map(([scale, name]) => ({
    id: name.toLowerCase().replaceAll(' ', '-'),
    name,
    shape: [2, 4],
    strides: [4, 1],
    storage: [1, 2, 3, 4, 5, 6, 7, 8].map((value) => value * scale),
  })),
  {
    id: 'hidden-shape',
    name: 'Changed shape 3×5',
    shape: [3, 5],
    strides: [5, 1],
    storage: Array.from(
      {
        length: 15,
      },
      (_, i) => i + 1,
    ),
  },
  {
    id: 'transposed-view',
    name: 'Transposed view 2×4',
    shape: [2, 4],
    strides: [1, 2],
    storage: [1, 2, 3, 4, 5, 6, 7, 8],
  },
];
export const KERNEL_CHAPTERS = new Set([
  'domain-contract',
  'library-boundary',
  'ownership-audit',
  'tolerance-policy',
  'overflow-oracle',
  'address-order',
  'build-resources',
  'safety-tools',
  'timing-clocks',
  'roofline-model',
  'public-refinement',
  'benchmark-boundaries',
  'checker-mutations',
  'shadow-budget',
  'canary-evidence',
  'receipt-binding',
  'fresh-promotion',
]);
