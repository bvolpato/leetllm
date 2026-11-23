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
export const ids = [
  'intro',
  'artifacts',
  'loader',
  'registers',
  'identity',
  'publication',
  'ownership',
];
export const tracks = track(ids);
export const artifactLines = {
  source: ['float a = x[i];', 'float b = y[i];', 'float sum = a + b;', 'out[i] = sum;'],
  ptx: [
    'ld.global.f32 %f1, [%rd1];',
    'ld.global.f32 %f2, [%rd2];',
    'add.f32 %f3, %f1, %f2;',
    'st.global.f32 [%rd3], %f3;',
  ],
  sass: ['LDG.E R4, [R2]', 'LDG.E R5, [R3]', 'FADD R6, R4, R5', 'STG.E [R1], R6'],
};
export const ARTIFACT = [83, 73, 77, 84, 1, 2, 3, 4];
export const coreScenes = new Set([
  'host-device-package',
  'captured-native',
  'actual-loader-cases',
  'register-lifetimes',
  'spill-workload',
  'manifest-contract',
  'cache-cooperation',
  'request-clock',
  'triton-lowering',
  'ownership-boundaries',
  'control-surfaces',
  'first-failing-boundary',
]);
