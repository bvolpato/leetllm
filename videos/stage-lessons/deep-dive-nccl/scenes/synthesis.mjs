// Scene 25: Three ranks timed out. Where would you look? R0/R1/R3 timeout at step 8 -> open Rank 2's earlier log (hold!) -> OOM before entering collective!
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function synthesis(s, c) {
  // step: 0=3 peers timeout, 1=ask which rank? (hold!), 2=open R2 log, 3=R2 OOM before collective!, 4=triage ladder
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#fb71851c', '#ffd16618');
  const title = heroTitle(['Three Ranks Timed Out.', 'Where Do You Look?'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.bad,
    eyebrow: 'DISTRIBUTED HANG TRIAGE · EARLIEST NON-TIMEOUT LOG',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const rankCols = [ROLE.r0, ROLE.r1, ROLE.r2, ROLE.r3];

    const nodes = [
      txt('PRE-COLLECTIVE LOG', -220, -218, 26, COSMOS.muted, 'mono'),
      txt('STEP 8 COLLECTIVE', 400, -218, 26, ROLE.bad, 'mono'),
    ];

    for (let r = 0; r < 4; r++) {
      const y = -125 + r * 92;
      const isR2 = r === 2;
      const preTxt = isR2
        ? st >= 3
          ? 'CUDA OOM (alloc failed!)'
          : st >= 2
            ? 'Opening Rank 2 log...'
            : '(unopened log)'
        : 'ready -> entering step 8';
      const stepTxt = isR2
        ? st >= 3
          ? '(NEVER ENTERED!)'
          : 'no timeout printed'
        : 'TIMEOUT waiting on peer!';
      const preCol = isR2 && st >= 3 ? ROLE.bad : isR2 && st >= 2 ? COSMOS.gold : COSMOS.dim;
      const stepCol = isR2 ? (st >= 3 ? ROLE.bad : COSMOS.gold) : ROLE.bad;

      nodes.push(
        txt(`Rank ${r}`, -760, y, 28, rankCols[r], 'mono'),
        glassCell(-220, y, 560, 72, preCol, {
          fill: isR2 && st >= 3 ? '#2d1222' : '#0f182a',
          glow: isR2 && st >= 2 ? 10 : 2,
        }),
        txt(preTxt, -220, y, 26, isR2 && st >= 3 ? ROLE.bad : COSMOS.ink, 'mono'),
        glassCell(400, y, 560, 72, stepCol, {
          fill: isR2 ? (st >= 3 ? '#2d1222' : '#241c0f') : '#291220',
          glow: 6,
        }),
        txt(stepTxt, 400, y, 26, stepCol, 'mono'),
      );
    }

    nodes.push(
      txt(
        st >= 4
          ? 'Triage order: (1) missing/OOM rank -> (2) sequence/arg mismatch -> (3) test selected route'
          : st >= 3
            ? 'Rank 2 hit OOM before entering step 8; healthy peers timed out waiting for a missing partner'
            : 'Predict: Ranks 0, 1, 3 timed out at step 8; which rank log do you open FIRST?',
        0,
        355,
        28,
        st >= 3 ? ROLE.good : COSMOS.gold,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['synth-peers', 0],
    ['synth-question', 1],
    ['synth-open', 2],
    ['synth-oom', 3, true],
    ['synth-first', 4],
  ]);
}
