// Scene 17: verifier-boundaries - What did three passing tests establish?
// Two non-overlapping stages:
//   1. Reward-hacking / incomplete-suite probe: f(x) = 2*x if x <= 3 else 0.
//      Tests x=1,2,3 return 2,4,6 (3/3 PASS!). Fourth row x=4 stays withheld (?) through the
//      prediction pause -> verifier-zero reveals Observed = 0 -> verifier-expected reveals 8!
//   2. Three concrete release-record checks (scan vs source, action errors vs tokens, empty budget).
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  glowTex,
  guardedDynamic,
  orbNode,
  orbRadius,
  trimSeg,
  txt,
} from '../parts.mjs';

const CANDIDATE_FN = (x) => (x <= 3 ? 2 * x : 0);

export default function verifierBoundaries(s, c) {
  const pulse = s.value(0);
  const testsT = s.value(0);
  const fourOn = s.value(0);
  const zeroOn = s.value(0);
  const expOn = s.value(0);
  const stage2 = s.value(0);

  const header = cinemaHeader('VERIFIER BOUNDARIES', 'What did three passing', 'tests establish?', {
    accent: ROLE.fail,
    size: 48,
  });

  const stageAura = aura(100, 40, 680, '#ff6b8b1a', '#ffd16614');

  const candEq = glowTex(String.raw`f(x) = \begin{cases} 2x & x \le 3 \\ 0 & x > 3 \end{cases}`, {
    x: 430,
    y: -330,
    size: 34,
    color: ROLE.focus,
    glow: 7,
  });

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const tt = testsT.value;
      const f4 = fourOn.value;
      const z0 = zeroOn.value;
      const ex = expOn.value;
      const s2 = stage2.value;

      const a1 = fadeOutHalf(s2);
      const a2 = fadeInHalf(s2);
      const nodes = [];

      // Stage 1: Test suite table (x=1,2,3 pass; x=4 withheld then exposed as 0 vs 8!)
      if (a1 > 0.02) {
        const colXs = [-560, -140, 280, 650];
        nodes.push(
          txt('INPUT x', colXs[0], -185, 26, COSMOS.muted, 'mono', 'center').opacity(a1),
          txt('EXPECTED (2x)', colXs[1], -185, 26, COSMOS.muted, 'mono', 'center').opacity(a1),
          txt('OBSERVED f(x)', colXs[2], -185, 26, COSMOS.muted, 'mono', 'center').opacity(a1),
          txt('VERDICT', colXs[3], -185, 26, COSMOS.muted, 'mono', 'center').opacity(a1),
          line([-760, -148], [800, -148], { stroke: '#25355a', width: 2 }).opacity(0.75 * a1),
        );

        [1, 2, 3, 4].forEach((x, i) => {
          if (x === 4 && f4 < 0.05) return;
          const y = -82 + i * 105;
          const rowAlpha = x === 4 ? f4 * a1 : a1;
          const ran = x < 4 ? tt * 3 >= x - 0.1 : z0 > 0.45;
          const obsVal = CANDIDATE_FN(x);
          const expVal = 2 * x;
          const ok = obsVal === expVal;
          const obsStr = ran ? String(obsVal) : '?';
          const expStr = x === 4 && ex < 0.45 ? '2 * 4' : String(expVal);
          const obsCol = !ran ? ROLE.focus : ok ? ROLE.ok : ROLE.fail;
          const verdStr = !ran ? 'PREDICT?' : ok ? 'PASS (IN SUITE)' : 'FAIL (GAP!)';

          nodes.push(
            txt(String(x), colXs[0], y, 36, COSMOS.ink, 'mono', 'center').opacity(rowAlpha),
            txt(
              expStr,
              colXs[1],
              y,
              36,
              x === 4 && ex > 0.45 ? ROLE.ok : COSMOS.ink,
              'mono',
              'center',
            ).opacity(rowAlpha),
            txt(obsStr, colXs[2], y, 40, obsCol, 'mono', 'center')
              .glow(x === 4 && z0 > 0.45 ? 10 : 0, obsCol)
              .opacity(rowAlpha),
            txt(verdStr, colXs[3], y, 26, obsCol, 'mono', 'center').opacity(rowAlpha),
          );
        });

        nodes.push(
          line([-760, 300], [800, 300], { stroke: '#25355a', width: 2 }).opacity(0.65 * a1),
        );
        const foot =
          ex > 0.45
            ? 'Shortcut passed 3/3 tests, returned 0 instead of 8 -> reward hacking gap!'
            : z0 > 0.45
              ? 'Observed: 0 (passed 3-test reward while failing x > 3)'
              : f4 > 0.45
                ? 'Look past x = 3. What does this candidate return for x = 4?'
                : 'Test suite covers only x in {1, 2, 3}';
        nodes.push(
          txt(
            foot,
            0,
            364,
            28,
            z0 > 0.45 ? ROLE.fail : f4 > 0.45 ? ROLE.focus : COSMOS.muted,
            f4 > 0.45 && z0 < 0.45 ? 'serif' : 'mono',
            'center',
          ).opacity(a1),
        );
      }

      // Stage 2: Three observable release-record checks
      if (a2 > 0.02) {
        const rows = [
          ['SCAN', 'Compare scan field directly with release service', ROLE.service],
          ['TOKENS', 'Compare action errors & token usage together', ROLE.focus],
          ['EMPTY', 'Mark incomplete if output budget ran out', ROLE.fail],
        ];
        nodes.push(
          txt(
            'THREE OBSERVABLE CHECKS ON THE RELEASE RECORD',
            0,
            -220,
            28,
            ROLE.ok,
            'mono',
            'center',
          ).opacity(a2),
        );
        rows.forEach(([tag, desc, col], i) => {
          const y = -100 + i * 165;
          const xL = -620;
          const rL = orbRadius(tag, 48);
          const [ptA, ptB] = trimSeg([xL, y], [-290, y], rL + 10, 12);
          nodes.push(
            orbNode(xL, y, tag, col, { radius: 48, size: 26, opacity: a2 }),
            beamWithPhotons([ptA, ptB], col, p * 1.0 + i * 0.3, { alpha: a2, width: 3.4 }),
            txt(desc, -260, y, 28, COSMOS.ink, 'sans', 'left').opacity(a2),
          );
        });
        nodes.push(
          txt(
            'Each verified observation points to a concrete engineering next step',
            0,
            395,
            26,
            ROLE.ok,
            'mono',
            'center',
          ).opacity(a2),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, candEq, view);

  c.on('verifier-tests', () => {
    s.play(testsT.to(1, { duration: clampDur(c, c.cue('verifier-tests').start, 0.7) }));
  });
  c.on('verifier-four', () => {
    s.play(fourOn.to(1, { duration: clampDur(c, c.cue('verifier-four').start, 0.35) }));
  });
  // Strict prediction withholding!
  c.after('verifier-zero', () => {
    s.play(zeroOn.to(1, { duration: clampDur(c, c.cue('verifier-zero').end, 0.3) }));
  });
  c.on('verifier-expected', () => {
    s.play(expOn.to(1, { duration: clampDur(c, c.cue('verifier-expected').start, 0.3) }));
  });
  c.on('verifier-checks', () => {
    s.play(stage2.to(1, { duration: clampDur(c, c.cue('verifier-checks').start, 0.55) }));
  });
  c.hide('verifier-checks', candEq);
}
