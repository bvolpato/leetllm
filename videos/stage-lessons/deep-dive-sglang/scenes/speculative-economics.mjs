// Scene 20: Count saved target steps against the whole draft cycle (3D Speculative Rig + 4ms target vs 3+9+1=13ms cycle: 6 tokens 13 vs 24 ms; 1 token 13 vs 4 ms).
import {
  COSMOS,
  ROLE,
  aura,
  buildSpeculativeTree3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function speculativeEconomics(s, c) {
  const phase = s.value(0);
  // step:
  // 0 = draft sources (small model, target features, MTP heads, n-gram)
  // 1 = cycle breakdown: draft 3 + verify 9 + commit 1 ms; ordinary target step = 4 ms
  // 2 = 5 accepted + 1 replacement = 6 tokens
  // 3 = cycle cost = 13 ms
  // 4 = vs 6 ordinary target steps = 24 ms (WIN!)
  // 5 = 0 accepted drafts (only 1 replacement)
  // 6 = 13 ms vs 4 ms ordinary (LOSS!)
  // 7 = high concurrency / short outputs / extra KV & grammar can erase benefit
  const step = s.value(0);

  const bgAura = aura(460, 20, 560, '#fb923c1c', '#5ce1e618');
  const { view: spec3d } = buildSpeculativeTree3d(step, phase, { x: 475, y: 25, unit: 92 });

  const title = heroTitle(['Count the Whole Cycle,', 'Not Just Accepted Hits'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.spec,
    eyebrow: 'SPECULATIVE ECONOMICS · 13 MS CYCLE VS 4 MS STEP',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const isZero = st >= 5;
    const nodes = [
      txt('3D DRAFT & PARALLEL VERIFIER', 475, -390, 26, ROLE.spec, 'mono').glow(5, ROLE.spec),
      txt('Break-even requires high acceptance', 475, 405, 26, COSMOS.gold, 'mono'),
    ];

    if (st === 0) {
      const sources = [
        { k: 'Draft Model', v: 'Smaller model proposes k tokens', col: ROLE.radix },
        {
          k: 'Target Feats',
          v: 'EAGLE / EAGLE-3 reuse hidden states',
          col: ROLE.prefill,
        },
        { k: 'MTP Heads', v: 'Trained multi-token prediction heads', col: ROLE.grammar },
        { k: 'N-gram', v: 'Prompt / history exact suffix match', col: ROLE.spec },
      ];
      sources.forEach((src, i) => {
        const y = -165 + i * 118;
        nodes.push(
          glassCell(-420, y, 860, 96, src.col, { fill: '#0f1c32', glow: 8 }),
          txt(src.k, -820, y, 28, src.col, 'mono', 'left'),
          txt(src.v, -565, y, 26, COSMOS.ink, 'sans', 'left'),
        );
      });
    } else {
      // Cost bar comparison (domain 0..24 ms)
      const barMax = 610;
      const wOf = (ms) => (ms / 24) * barMax;
      const xLeft = -830;
      const barStart = xLeft + 145;

      nodes.push(
        txt(
          'FIXED CYCLE:  3 draft + 9 verify + 1 commit = 13 ms',
          -420,
          -195,
          26,
          COSMOS.gold,
          'mono',
        ),
      );

      // Cycle bar (3 + 9 + 1 = 13 ms)
      const dW = wOf(3);
      const vW = wOf(9);
      const cW = wOf(1);
      nodes.push(
        txt('Cycle', xLeft, -118, 26, COSMOS.muted, 'mono', 'left'),
        rect(dW, 54, { fill: ROLE.fail, stroke: null, radius: 6 }).at(barStart + dW / 2, -118),
        rect(vW, 54, { fill: ROLE.radix, stroke: null, radius: 6 }).at(
          barStart + dW + vW / 2,
          -118,
        ),
        rect(cW, 54, { fill: ROLE.decode, stroke: null, radius: 6 }).at(
          barStart + dW + vW + cW / 2,
          -118,
        ),
        txt(
          st >= 3 ? '13 ms' : '3+9+1',
          barStart + dW + vW + cW + 20,
          -118,
          28,
          COSMOS.gold,
          'mono',
          'left',
        ),
      );

      // Ordinary target bar: 6*4 = 24 ms (st 2..5) vs 1*4 = 4 ms (st >= 6)
      const ordMs = st >= 6 ? 4 : 24;
      const showOrd = st >= 4;
      const ordW = wOf(ordMs);
      nodes.push(
        txt('Normal', xLeft, -28, 26, COSMOS.muted, 'mono', 'left'),
        rect(barMax, 54, { fill: '#0b1220', stroke: '#334155', width: 2, radius: 6 }).at(
          barStart + barMax / 2,
          -28,
        ),
      );
      if (showOrd) {
        nodes.push(
          rect(ordW, 50, { fill: ROLE.prefill, stroke: null, radius: 6 }).at(
            barStart + ordW / 2,
            -28,
          ),
          txt(`${ordMs} ms`, barStart + barMax + 18, -28, 28, ROLE.prefill, 'mono', 'left'),
        );
      }

      // Case summary cards
      nodes.push(
        glassCell(-420, 108, 860, 104, !isZero ? ROLE.decode : COSMOS.dim, {
          fill: !isZero ? '#0d2922' : '#0b101d',
          glow: !isZero ? 10 : 2,
        }),
        txt(
          'HIGH ACCEPT (5 + 1 = 6 tokens)',
          -820,
          82,
          26,
          !isZero ? ROLE.decode : COSMOS.muted,
          'mono',
          'left',
        ),
        txt(
          st >= 4
            ? '13 ms cycle vs 24 ms ordinary -> FASTER!'
            : st >= 2
              ? '6 tokens advanced in 13 ms'
              : 'Measuring 5 accepted drafts...',
          -820,
          132,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ),

        glassCell(-420, 232, 860, 104, isZero ? ROLE.fail : COSMOS.dim, {
          fill: isZero ? '#2c1120' : '#0b101d',
          glow: isZero ? 10 : 2,
        }),
        txt(
          'ZERO ACCEPT (0 + 1 = 1 token)',
          -820,
          206,
          26,
          isZero ? ROLE.fail : COSMOS.muted,
          'mono',
          'left',
        ),
        txt(
          st >= 6
            ? '13 ms cycle vs 4 ms ordinary -> 3.25x SLOWER!'
            : st === 5
              ? '0 accepted drafts -> only 1 replacement token'
              : 'Waiting for 0-accept comparison',
          -820,
          256,
          26,
          isZero ? ROLE.fail : COSMOS.dim,
          'mono',
          'left',
        ),
      );
    }

    const caption =
      st >= 6
        ? 'Zero accepted drafts: 13 ms vs 4 ms; high batch or overhead can erase gains.'
        : 'Compare total cycle time (draft + verify + commit) against ordinary target steps for equal tokens.';

    nodes.push(txt(caption, -855, 358, 26, COSMOS.ink, 'sans', 'left'));
    return group(...nodes);
  });

  s.add(bgAura, spec3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, spec3d, { theta: -0.2, phi: 0.9 });
  wireStepCues(s, c, step, [
    ['sg-speculative-economics-beat-0', 0],
    ['sg-speculative-economics-beat-1', 1],
    ['sg-spec-cost', 2],
    ['sg-spec-thirteen', 3, true],
    ['sg-spec-twentyfour', 4, true],
    ['sg-spec-zero-input', 5],
    ['sg-spec-zero', 6, true],
    ['sg-speculative-economics-beat-2', 7],
  ]);
}
