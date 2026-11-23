export const TRAINING_REQUESTS = [
  {
    id: 'TRAIN-1',
    products: [
      ['A1', 0.95, 0.3, 1],
      ['A2', 0.85, 0.9, 3],
      ['A3', 0.8, 0.65, 2],
    ],
  },
  {
    id: 'TRAIN-2',
    products: [
      ['B1', 0.92, 0.75, 3],
      ['B2', 0.87, 0.4, 1],
      ['B3', 0.82, 0.7, 2],
    ],
  },
  {
    id: 'TRAIN-3',
    products: [
      ['C1', 0.91, 0.35, 1],
      ['C2', 0.86, 0.6, 2],
      ['C3', 0.81, 0.85, 3],
    ],
  },
];
export const TRAINING_PAIRS = TRAINING_REQUESTS.flatMap((request) =>
  request.products.flatMap((better) =>
    request.products
      .filter((worse) => better[3] > worse[3])
      .map((worse) => ({
        request: request.id,
        better: better[0],
        worse: worse[0],
        difference: [better[1] - worse[1], better[2] - worse[2]],
      })),
  ),
);
