export const RETAINED_CHECKS = Object.freeze({
  safety: [10, 10, 9, 8, 7].map((count) =>
    Array.from(
      {
        length: 10,
      },
      (_, i) => i < count,
    ),
  ),
  reasoning: [8, 8, 7, 7, 6].map((count) =>
    Array.from(
      {
        length: 10,
      },
      (_, i) => i < count,
    ),
  ),
});
export const DOMAIN_DOCUMENTS = Object.freeze([
  {
    id: 'D1',
    text: 'The tide rises near the reef.',
    licensed: true,
  },
  {
    id: 'D2',
    text: 'The tide rises near a reef.',
    licensed: true,
  },
  {
    id: 'D3',
    text: 'Home | Subscribe | Contact',
    licensed: true,
    boilerplate: true,
  },
  {
    id: 'D4',
    text: 'ree�f t�de',
    licensed: true,
    corrupt: true,
  },
  {
    id: 'D5',
    text: 'Fish gather near the reef.',
    licensed: false,
  },
  {
    id: 'D6',
    text: 'The reef shelters young fish.',
    licensed: true,
  },
]);
export const CHECKPOINT_PIECES = ['The', ' tide', ' rises', ' near', ' the', ' re', 'ef', '.'];
export const CHECKPOINTS = Object.freeze([
  {
    label: 'Base',
    domain: 42,
    general: 19.2,
    task: 62,
  },
  {
    label: 'CPT 1k',
    domain: 31.5,
    general: 19.5,
    task: 68,
  },
  {
    label: 'CPT 4k',
    domain: 27.9,
    general: 20.1,
    task: 72,
  },
  {
    label: 'CPT 12k',
    domain: 25.8,
    general: 23.9,
    task: 71,
  },
]);
export const PACKED_DOCUMENTS = Object.freeze([[11, 12, 13], [21, 22], [31, 32, 33, 34], [41]]);
export const WINDOW_ORDER = Object.freeze([
  17, 15, 11, 18, 7, 6, 19, 3, 14, 0, 9, 5, 16, 8, 13, 2, 1, 12, 4, 10,
]);
export const FRESH_CHECKPOINTS = Object.freeze([
  {
    label: 'A',
    domain: 22,
    general: 18.8,
    task: 78,
  },
  {
    label: 'B',
    domain: 20,
    general: 19.2,
    task: 82,
  },
  {
    label: 'C',
    domain: 21,
    general: 18.9,
    task: 78,
  },
]);
export const CENTROID_INPUTS = Object.freeze([
  [
    1.9269152879714966, 1.4872840642929077, 0.9007171988487244, -2.1055209636688232,
    0.6784184575080872, -1.2345448732376099, -0.04306747764348984, -1.6046669483184814,
  ],
  [
    -0.7521352767944336, 1.6487230062484741, -0.3924786448478699, -1.4036071300506592,
    -0.7278813123703003, -0.5594301819801331, -0.7688388824462891, 0.7624453902244568,
  ],
  [
    1.6423169374465942, -0.1595974713563919, -0.4973975419998169, 0.439589262008667,
    -0.7581311464309692, 1.078317642211914, 0.8008005619049072, 1.680620551109314,
  ],
]);
