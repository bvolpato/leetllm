import { fileURLToPath } from 'node:url';
import { resolveImageAsset } from 'vizmatic/stage';
import manifest from '../../assets/papers/attention-is-all-you-need-v7/manifest.json' with { type: 'json' };

const root = fileURLToPath(new URL('../../../', import.meta.url));

// Decode and verify source images once, before compiling any frame. Stage nodes remain per-build.
const prepared = new Map(
  await Promise.all(
    manifest.assets.map(async (entry) => [
      entry.id,
      Object.freeze({
        entry,
        image: await resolveImageAsset(entry.path, { ...entry, baseDir: root }),
      }),
    ]),
  ),
);

export function paperAsset(id) {
  const asset = prepared.get(id);
  if (!asset) throw new Error(`Unknown Attention paper asset: ${id}`);
  return asset;
}

// Regions use intrinsic pixels in the exact prepared crops, not reconstructed paper typography.
export const equationHighlights = [
  { id: 'query-key', region: { x: 890, y: 42, width: 155, height: 78 }, color: '#8c5d00' },
  { id: 'scale', region: { x: 900, y: 135, width: 143, height: 76 }, color: '#8c5d00' },
  { id: 'softmax', region: { x: 644, y: 92, width: 224, height: 66 }, color: '#17764a' },
  { id: 'values', region: { x: 1073, y: 90, width: 65, height: 75 }, color: '#1555b8' },
];

export const figureHighlights = [
  { id: 'left', region: { x: 116, y: 112, width: 337, height: 558 }, color: '#8c5d00' },
  { id: 'scores', region: { x: 158, y: 509, width: 190, height: 66 }, color: '#8c5d00' },
  { id: 'scale', region: { x: 183, y: 420, width: 140, height: 67 }, color: '#8c5d00' },
  { id: 'mask', region: { x: 148, y: 333, width: 210, height: 66 }, color: '#ad235f' },
  { id: 'softmax', region: { x: 157, y: 247, width: 192, height: 68 }, color: '#17764a' },
  { id: 'mix', region: { x: 225, y: 160, width: 203, height: 69 }, color: '#1555b8' },
  { id: 'projections', region: { x: 871, y: 471, width: 458, height: 107 }, color: '#1555b8' },
  { id: 'core', region: { x: 871, y: 308, width: 462, height: 143 }, color: '#17764a' },
  { id: 'head-count', region: { x: 1268, y: 351, width: 111, height: 94 }, color: '#8c5d00' },
  { id: 'concat', region: { x: 1004, y: 218, width: 153, height: 66 }, color: '#8c5d00' },
  { id: 'output', region: { x: 1018, y: 111, width: 130, height: 71 }, color: '#17764a' },
];
