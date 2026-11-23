export const TEMPERATURE = 0.2;
export const IMAGE_NAMES = ['Photo 17', 'Photo 08', 'Photo 42'];
export const CAPTIONS = [
  'Blocked vent on rack door',
  'Tape across the asset tag',
  'Clear rack door',
];
export const IMAGE_FEATURES = [
  [0.95, 0.05, 0.0],
  [0.05, 0.92, 0.03],
  [0.0, 0.07, 0.94],
];
export const TEXT_FEATURES = [
  [0.91, 0.08, 0.01],
  [0.06, 0.89, 0.04],
  [0.02, 0.09, 0.9],
];
export const visualPrefix = Object.freeze({
  crops: 4,
  patch: 14,
  side: 336,
  question: 180,
});
export const PATCH_KV = Object.freeze([
  {
    id: 'tag',
    key: [1, 0],
    value: [2, 0],
  },
  {
    id: 'vent',
    key: [0, 1],
    value: [0, 2],
  },
  {
    id: 'frame',
    key: [-1, 0],
    value: [0, 0],
  },
]);
export const IMAGE_REQUEST = Object.freeze({
  tenant: 'Ops',
  key: 'ingest-17',
  imageID: 'Ops/image17@v1',
  bytes: Object.freeze([82, 65, 67, 75, 49, 55]),
  site: 'East',
  metadata: {
    schema: 1,
    description: 'rack inspection',
  },
});
