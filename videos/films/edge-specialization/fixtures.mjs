import { hash } from './construction.mjs';
import { createPrivateKey, createPublicKey, sign } from 'node:crypto';
import { createCueTrack } from 'vizmatic';
export const ids = [
  'intro',
  'grounding',
  'training',
  'export-runtime',
  'thermal',
  'energy',
  'privacy',
  'updates',
];
export const tracks = Object.fromEntries(
  ids.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: `${id}-initial`,
        snapshot: {
          step: 0,
        },
      },
      cues: [0, 1, 2].map((step) => ({
        id: `${id}-${step}`,
        beat: step,
        at: 0,
        snapshot: {
          step,
        },
      })),
    }),
  ]),
);
export const manuals = {
  M7: {
    sensor: 'A',
    code: 'E2',
    meaning: 'battery low',
  },
  M8: {
    sensor: 'B',
    code: 'E2',
    meaning: 'lens covered',
  },
};
export const teacherLogits = [4, 2, 1];
export const operations = [
  {
    name: 'Projection',
    cpu: 5,
    npu: 1,
    run: (x) => [x[0] - x[1], 0.5 * x[0] + 0.5 * x[1]],
  },
  {
    name: 'Activation',
    cpu: 3,
    npu: 0.5,
    run: (x) => x.map((value) => Math.max(0, value)),
  },
  {
    name: 'Output',
    cpu: 5,
    npu: 1,
    run: (x) => [0.5 * x[0] + x[1]],
  },
];
export const thermalTraces = [
  [
    {
      minute: 0,
      rate: 23,
    },
    {
      minute: 1.5,
      rate: 19.4,
    },
    {
      minute: 10,
      rate: 16.8,
    },
  ],
  [
    {
      minute: 0,
      rate: 21,
    },
    {
      minute: 1.5,
      rate: 20,
    },
    {
      minute: 10,
      rate: 19,
    },
  ],
];
export const trustedAssets = {
  manual: {
    class: 'restricted',
  },
  incident: {
    class: 'restricted',
  },
  metrics: {
    class: 'public',
  },
};
export // A deterministic public teaching seed makes this signature fixture reproducible.
const privateKey = createPrivateKey({
  key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), Buffer.alloc(32, 7)]),
  format: 'der',
  type: 'pkcs8',
});
export const publicKey = createPublicKey(privateKey);
export const bundle = Buffer.from(
  JSON.stringify({
    model: 'student 2',
    tokenizer: 'toy 3',
    runtime: 2,
  }),
);
export const manifest = {
  version: 2,
  expires: 200,
  device: 'handheld',
  runtime: 2,
  tokenizer: 'toy 3',
  length: bundle.length,
  sha256: hash(bundle),
};
export const signedBytes = Buffer.from(JSON.stringify(manifest));
export const signature = sign(null, signedBytes, privateKey);
export const EDGE_NEW = new Set([
  'job-admission',
  'bandwidth',
  'resident-memory',
  'alignment-data',
  'distill-objective',
  'gradient-scaling',
  'mode-objectives',
  'export-quality',
  'small-architecture',
  'kv-geometry',
  'dated-models',
  'runtime-bundles',
  'cpu-export',
  'thermal-telemetry',
  'hybrid-scores',
  'trusted-route',
  'update-freshness',
  'diagnostic-evidence',
  'fresh-device',
]);
