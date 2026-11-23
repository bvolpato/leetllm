import { sum } from './arithmetic.mjs';
import assert from 'node:assert/strict';
import { createCueTrack } from 'vizmatic';
export const ids = [
  'intro',
  'clocks',
  'history',
  'freshness',
  'cost',
  'selection',
  'monitor',
  'synthesis',
];
export const track = createCueTrack({
  initial: {
    id: 'start',
    snapshot: 0,
  },
  cues: [
    {
      id: 'explain',
      beat: 1,
      at: 0,
      snapshot: 1,
    },
  ],
});
export const scans = [
  {
    name: 'Transit scan',
    event: 11,
    available: 11.05,
  },
  {
    name: 'Hub scan',
    event: 11.5,
    available: 12.5,
  },
  {
    name: 'Delay scan',
    event: 15,
    available: 15.05,
  },
];
export const orders = [
  {
    id: 'Expedited late',
    late: true,
    age: 5,
    risk: 0.78,
    miss: 150,
  },
  {
    id: 'Standard late',
    late: true,
    age: 20,
    risk: 0.64,
    miss: 60,
  },
  {
    id: 'On-time A',
    late: false,
    age: 4,
    risk: 0.12,
    miss: 60,
  },
  {
    id: 'On-time B',
    late: false,
    age: 3,
    risk: 0.58,
    miss: 60,
  },
];
export function buildFittedEtaFixture() {
  function fittedEtaFixture() {
    const input = [
        10.12207635503364, 0.9940541492409611, 1, 11.862574373238338, 10.903920892426518,
      ],
      mean = [
        7.690356921272788, 3.555013808787003, 0.4177215189873418, 16.32865754517586,
        14.155966104127442,
      ],
      scale = [
        5.544785534539892, 2.1801211847274824, 0.4931837908551433, 7.645423924899089,
        5.827044108250839,
      ],
      weights = [
        0.7662681204449675, 0.7018147080632336, -0.43326524354324053, 0.34091554556769343,
        -1.7031642997955148,
      ],
      intercept = -0.8317350801867216,
      contributions = input.map((v, i) => ((v - mean[i]) / scale[i]) * weights[i]),
      logit = intercept + sum(contributions),
      probability = 1 / (1 + Math.exp(-logit)),
      eta =
        1.9241693897197987 +
        sum(
          input.map(
            (v, i) =>
              v *
              [
                0.5639643941293434, 1.3481956415835321, -1.4483832966717094, 0.013285893186714474,
                0.06315631574563015,
              ][i],
          ),
        );
    return {
      input,
      mean,
      scale,
      weights,
      intercept,
      contributions,
      logit,
      probability,
      eta,
    };
  }
  assert(Math.abs(fittedEtaFixture().logit + 1.080247218) < 1e-8);
  assert(Math.abs(fittedEtaFixture().eta - 8.3707126) < 1e-6);
  return {
    fittedEtaFixture,
  };
}
export const { fittedEtaFixture } = buildFittedEtaFixture();
