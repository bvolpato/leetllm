export const ids = [
  'intro',
  'blocks',
  'prefix',
  'budget',
  'lifetime',
  'admission',
  'goodput',
  'synthesis',
];
export const r0 = ['The', 'little', 'bird', 'sat', 'on', 'the', 'green', 'branch'];
export const r1 = ['The', 'little', 'bird', 'sat', 'on', 'the', 'stone', 'wall', 'today'];
export const sharedPrefix = r0.findIndex((word, i) => word !== r1[i]);
