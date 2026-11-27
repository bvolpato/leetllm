// Scene 7: run-window - The arrival window closes before the last outcome
// 4-phase luminous run pipeline (readiness -> warmup -> [0, 2000) arrival window -> 2500 drain)
// hovering above the signature 6-request Benchmark Receipt Clock.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  SERVING_COHORT,
  aura,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  guardedDynamic,
  receiptClockNodes,
  spanBracket,
  txt,
} from '../parts.mjs';

export default function runWindow(s, c) {
  const phaseLit = s.value(0.3);
  const cohortLit = s.value(0);
  const horizonLit = s.value(0);
  const sustainLit = s.value(0);

  const header = cinemaHeader(
    'RUN PHASES & HORIZON',
    'Arrival window closes',
    'before drain ends',
    {
      x: -860,
      y: -450,
      accent: ROLE.drain,
      size: 46,
    },
  );

  const stageAura = aura(100, 30, 680, '#5ce1e61a', '#fb923c1a');

  const stageView = guardedDynamic(
    () => 1,
    () => {
      const pL = phaseLit.value;
      const cL = cohortLit.value;
      const hL = horizonLit.value;
      const sL = sustainLit.value;

      const xLeft = -520;
      const xRight = 560;
      const horizon = 2500;
      const xOf = (ms) => xLeft + (ms / horizon) * (xRight - xLeft);

      const nodes = [];

      // Four explicit run phases cleanly below header (y = -246)
      const pipeY = -246;
      const phases = [
        { name: 'Readiness', x0: -855, x1: -690, col: COSMOS.muted },
        { name: 'Warmup', x0: -682, x1: -528, col: ROLE.workload },
        { name: '[0, 2000) Arrival Window', x0: xOf(0), x1: xOf(2000) - 6, col: ROLE.open },
        { name: 'Drain', x0: xOf(2000) + 4, x1: xOf(2500), col: ROLE.drain },
      ];
      phases.forEach((ph) => {
        const w = ph.x1 - ph.x0;
        const cx = (ph.x0 + ph.x1) * 0.5;
        nodes.push(
          rect(w, 46, {
            fill: '#0e1526',
            stroke: ph.col,
            width: 2.2,
            radius: 10,
          })
            .at(cx, pipeY)
            .opacity(0.6 + 0.4 * pL),
          txt(ph.name, cx, pipeY, 26, ph.col, 'mono').opacity(0.7 + 0.3 * pL),
        );
      });

      // Signature Benchmark Receipt Clock for r01..r06
      nodes.push(
        ...receiptClockNodes(SERVING_COHORT, {
          xLeft,
          xRight,
          topY: -102,
          spacing: 56,
          windowEnd: 2000,
          horizon: 2500,
          until: 2500,
          showOutcomes: true,
          highlightId: cL > 0.3 && hL < 0.3 ? 'r06' : null,
        }),
      );

      // Mutually exclusive bottom band via half-crossfades (zero motion overlap!)
      const a0 = fadeOutHalf(cL);
      const a1 = fadeInHalf(cL) * fadeOutHalf(hL);
      const a2 = fadeInHalf(hL) * fadeOutHalf(sL);
      const a3 = fadeInHalf(sL);

      if (a0 > 0.02) {
        nodes.push(
          txt(
            'Warm prefix caches only when the target production scenario starts warm',
            0,
            376,
            26,
            COSMOS.muted,
            'sans',
          ).opacity(a0),
        );
      }
      if (a1 > 0.02) {
        nodes.push(
          ...spanBracket(xOf(0), xOf(2000), 344, '[0, 2000) owns 6 offered IDs', ROLE.open, {
            labelSize: 28,
            opacity: a1,
          }),
        );
      }
      if (a2 > 0.02) {
        nodes.push(
          ...spanBracket(xOf(0), xOf(2500), 344, 'Horizon = max(2000, 2500) = 2.5 s', ROLE.drain, {
            labelSize: 28,
            opacity: a2,
          }),
        );
      }
      if (a3 > 0.02) {
        nodes.push(
          txt(
            'SUSTAINED LOAD: TRACK ADMITTED, COMPLETED, REJECTED & TIMED-OUT OVER TIME',
            0,
            354,
            26,
            ROLE.drain,
            'mono',
          )
            .glow(6, ROLE.drain)
            .opacity(a3),
          txt(
            'A flat server queue can coexist with aggressive rejection while users fail',
            0,
            416,
            26,
            COSMOS.muted,
            'sans',
          ).opacity(a3),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, stageView);

  c.on('run-window-beat-0', () => {
    const t = c.cue('run-window-beat-0').start;
    s.play(phaseLit.to(1, { duration: clampDur(c, t, 0.5) }));
  });
  c.on('run-window-beat-1', () => {
    const t = c.cue('run-window-beat-1').start;
    s.play(cohortLit.to(1, { duration: clampDur(c, t, 0.45) }));
  });
  c.on('run-window-beat-2', () => {
    const t = c.cue('run-window-beat-2').start;
    s.play(horizonLit.to(1, { duration: clampDur(c, t, 0.45) }));
  });
  c.on('run-window-beat-3', () => {
    const t = c.cue('run-window-beat-3').start;
    s.play(sustainLit.to(1, { duration: clampDur(c, t, 0.45) }));
  });
}
