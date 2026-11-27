// Scene 12: uncertainty - How much evidence clears the floor?
// Precision glowing [0.0..1.0] Wilson interval ruler with a vertical gold 0.85 release
// floor laser, growing the 2/3 pilot interval [0.208, 0.939], comparing 27/30 [0.744, 0.965]
// (short of floor), and strictly withholding 25/25 = 0.867 > 0.85 until `c.after('bound-result')`.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  WILSON_ALL25,
  WILSON_FLOOR,
  WILSON_LARGE,
  WILSON_PILOT,
  aura,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  glowDot,
  glowTex,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function uncertainty(s, c) {
  const pulse = s.value(0);
  const centerOn = s.value(0);
  const radiusExt = s.value(0);
  const pilotCaps = s.value(0);
  const pilotLbls = s.value(0);
  const largeOn = s.value(0);
  const largeLbls = s.value(0);
  const floorFail = s.value(0);
  const allPassOn = s.value(0);
  const askClear = s.value(0);
  const boundRes = s.value(0);

  const clusterMode = s.value(0); // Beat 4 sampling/grouping/denominator/veto
  const groupsHi = s.value(0);
  const denomHi = s.value(0);
  const vetoHi = s.value(0);

  const header = cinemaHeader('STATISTICAL UNCERTAINTY', 'How much evidence', 'clears the floor?', {
    accent: ROLE.trace,
    size: 50,
  });

  const stageAura = aura(120, 40, 680, '#5ce1e61c', '#ffd16614');

  const allPassEq = glowTex(String.raw`L_{\text{all-pass}} = \frac{n}{n + z^2}`, {
    x: 520,
    y: -340,
    size: 42,
    color: ROLE.pass,
    glow: 8,
  });

  // Mode 0 (Beats 0-3): Precision Wilson Score Interval Ruler against 0.85 Floor
  const mode0 = guardedDynamic(
    () => fadeOutHalf(clusterMode.value),
    (a) => {
      const ce = centerOn.value;
      const re = radiusExt.value;
      const pc = pilotCaps.value;
      const pl = pilotLbls.value;
      const lo = largeOn.value;
      const ll = largeLbls.value;
      const ff = floorFail.value;
      const ap = allPassOn.value;
      const aq = askClear.value;
      const br = boundRes.value;
      const nodes = [];

      const rx0 = -760;
      const rx1 = 760;
      const xAt = (v) => rx0 + v * (rx1 - rx0);
      const rulerY = 265;
      const floorX = xAt(WILSON_FLOOR);

      // Fixed 0.0 -> 1.0 ruler
      nodes.push(line([rx0, rulerY], [rx1, rulerY], { stroke: '#3a4e7d', width: 3 }).opacity(a));
      for (let i = 0; i <= 10; i++) {
        const vx = xAt(i / 10);
        nodes.push(
          line([vx, rulerY - 10], [vx, rulerY + 10], { stroke: '#4d659c', width: 2 }).opacity(a),
          txt((i / 10).toFixed(1), vx, rulerY + 38, 26, COSMOS.muted, 'mono', 'center').opacity(a),
        );
      }

      // Vertical gold 0.85 predeclared floor line
      nodes.push(
        line([floorX, -195], [floorX, rulerY], { stroke: ROLE.threshold, width: 4, dash: [10, 8] })
          .glow(10, ROLE.threshold)
          .opacity(a),
        txt('FLOOR 0.85', floorX, -225, 28, ROLE.threshold, 'mono', 'center')
          .glow(8, ROLE.threshold)
          .opacity(a),
      );

      // Row 1: Pilot 2/3 (y = -115)
      const y1 = -115;
      const pLo = xAt(WILSON_PILOT.center - re * WILSON_PILOT.radius);
      const pHi = xAt(WILSON_PILOT.center + re * WILSON_PILOT.radius);
      const pC = xAt(WILSON_PILOT.center);
      nodes.push(txt('PILOT 2/3 (66.7%)', rx0, y1 - 74, 26, ROLE.trace, 'mono', 'left').opacity(a));
      if (ce > 0.1) {
        nodes.push(
          line([pLo, y1], [pHi, y1], { stroke: ROLE.trace, width: 7 })
            .glow(9, ROLE.trace)
            .opacity(a * ce),
          glowDot(pC, y1, { radius: 8.5, color: '#ffffff', glow: 10, opacity: a * ce }),
        );
      }
      if (pc > 0.2) {
        nodes.push(
          line([pLo, y1 - 18], [pLo, y1 + 18], { stroke: ROLE.trace, width: 4 }).opacity(a * pc),
          line([pHi, y1 - 18], [pHi, y1 + 18], { stroke: ROLE.trace, width: 4 }).opacity(a * pc),
        );
      }
      if (pl > 0.2) {
        nodes.push(
          txt('0.208', pLo, y1 - 46, 28, ROLE.trace, 'mono', 'center').opacity(a * pl),
          txt('0.939', pHi, y1 - 46, 28, ROLE.trace, 'mono', 'center').opacity(a * pl),
        );
      }

      // Row 2: Expanded 27/30 (y = 25)
      const y2 = 25;
      if (lo > 0.05) {
        const lLo = xAt(WILSON_LARGE.lower);
        const lHi = xAt(WILSON_LARGE.upper);
        const lC = xAt(WILSON_LARGE.center);
        const rowCol = ff > 0.35 ? ROLE.fail : ROLE.trace;
        nodes.push(
          txt('SAMPLE 27/30 (90.0%)', rx0, y2 - 44, 26, rowCol, 'mono', 'left').opacity(a * lo),
          line([lLo, y2], [lHi, y2], { stroke: rowCol, width: 7 })
            .glow(9, rowCol)
            .opacity(a * lo),
          line([lLo, y2 - 18], [lLo, y2 + 18], { stroke: rowCol, width: 4 }).opacity(a * lo),
          line([lHi, y2 - 18], [lHi, y2 + 18], { stroke: rowCol, width: 4 }).opacity(a * lo),
          glowDot(lC, y2, { radius: 8, color: '#ffffff', glow: 9, opacity: a * lo }),
        );
        if (ll > 0.2) {
          nodes.push(
            txt('0.744', lLo, y2 - 46, 28, rowCol, 'mono', 'center').opacity(a * ll),
            txt('0.965', lHi, y2 - 46, 28, ROLE.trace, 'mono', 'center').opacity(a * ll),
          );
        }
        if (ff > 0.35) {
          nodes.push(
            txt('0.744 < 0.85  SHORT', lLo - 22, y2 + 38, 26, ROLE.fail, 'mono', 'right')
              .glow(9, ROLE.fail)
              .opacity(a * ff),
          );
        }
      }

      // Row 3: Fresh 25/25 all-pass (y = 165) - strictly withholds 0.867 until `bound-result`!
      const y3 = 165;
      if (ap > 0.05) {
        nodes.push(
          txt(
            'FRESH 25/25 (100%)',
            rx0,
            y3 - 44,
            26,
            br > 0.35 ? ROLE.pass : ROLE.focus,
            'mono',
            'left',
          ).opacity(a * ap),
        );
        if (br < 0.35) {
          nodes.push(
            txt(
              aq > 0.25 ? '25 / (25 + 1.96²)  ->  clears 0.85?' : 'Substitute n = 25, z = 1.96',
              0,
              y3,
              30,
              ROLE.focus,
              'mono',
              'center',
            ).opacity(a * ap * (1 - br * 2.5)),
          );
        } else {
          const aLo = xAt(WILSON_ALL25.lower);
          const aHi = xAt(1.0);
          nodes.push(
            line([aLo, y3], [aHi, y3], { stroke: ROLE.pass, width: 8 })
              .glow(12, ROLE.pass)
              .opacity(a * br),
            line([aLo, y3 - 20], [aLo, y3 + 20], { stroke: ROLE.pass, width: 4.5 }).opacity(a * br),
            line([aHi, y3 - 20], [aHi, y3 + 20], { stroke: ROLE.pass, width: 4.5 }).opacity(a * br),
            txt('0.867', aLo + 12, y3 - 48, 30, ROLE.pass, 'mono', 'left')
              .glow(10, ROLE.pass)
              .opacity(a * br),
            txt('CLEARS 0.85 FLOOR!', floorX - 28, y3, 28, ROLE.pass, 'mono', 'right')
              .glow(9, ROLE.pass)
              .opacity(a * br),
          );
        }
      }

      // Dynamic footer
      const foot =
        br > 0.35
          ? '25/25 LOWER BOUND = 0.867 > 0.85  (CLEARS PREDECLARED FLOOR)'
          : aq > 0.25
            ? 'Put n = 25 into n / (n + z²): does the lower endpoint clear 0.85?'
            : ff > 0.35
              ? '90% observed on 30 cases still falls short: lower bound 0.744 < 0.85'
              : '95% Wilson score interval (z = 1.96) around observed pass rate';
      nodes.push(
        txt(
          foot,
          0,
          395,
          28,
          br > 0.35 ? ROLE.pass : ff > 0.35 ? ROLE.fail : COSMOS.muted,
          'mono',
          'center',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  // Mode 1 (Beat 4): Sampling structure, denominator integrity, and hard safety veto
  const mode1 = guardedDynamic(
    () => fadeInHalf(clusterMode.value),
    (a) => {
      const gh = groupsHi.value;
      const dh = denomHi.value;
      const vh = vetoHi.value;
      const nodes = [];

      // Left: 3 task clusters x 4 repeats = 12 runs (not 12 independent cases!)
      nodes.push(
        txt('12 RUNS = 3 TASKS × 4 REPEATS', -830, -175, 26, ROLE.trace, 'mono', 'left').opacity(a),
      );
      ['Task A', 'Task B', 'Task C'].forEach((label, row) => {
        const y = -82 + row * 105;
        nodes.push(txt(label, -830, y, 28, COSMOS.ink, 'mono', 'left').opacity(a));
        for (let k = 0; k < 4; k++) {
          const cx = -635 + k * 66;
          nodes.push(
            glowDot(cx, y, {
              radius: 12,
              color: row === 0 ? ROLE.pass : row === 1 ? ROLE.trace : ROLE.focus,
              glow: 8 + gh * 4,
              opacity: a,
            }),
          );
        }
        nodes.push(txt('grouped cluster', -340, y, 26, COSMOS.muted, 'mono', 'left').opacity(a));
      });
      nodes.push(
        txt(
          'Account for task grouping (not 12 i.i.d. draws)',
          -830,
          220,
          26,
          ROLE.focus,
          'sans',
          'left',
        ).opacity(a),
      );

      // Right: Two strict evaluation integrity pillars (zero prose boxes)
      const dCol = dh > 0.3 ? ROLE.warn : COSMOS.muted;
      const vCol = vh > 0.3 ? ROLE.fail : COSMOS.muted;
      nodes.push(
        line([70, -175], [70, 275], { stroke: '#29385f', width: 2 }).opacity(a),
        txt('DENOMINATOR RULE', 115, -145, 26, dCol, 'mono', 'left').opacity(a),
        txt(
          'Keep crashes & exhausted runs in n',
          115,
          -88,
          30,
          dh > 0.3 ? COSMOS.ink : COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
        txt(
          'Hand-picked regressions != workload sample',
          115,
          -32,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
        line([115, 30], [840, 30], { stroke: '#29385f', width: 2 }).opacity(a),
        txt('HARD SAFETY VETO', 115, 92, 26, vCol, 'mono', 'left')
          .glow(vh > 0.3 ? 9 : 0, ROLE.fail)
          .opacity(a),
        txt(
          'A forbidden action fails its own gate',
          115,
          152,
          30,
          vh > 0.3 ? ROLE.fail : COSMOS.muted,
          'sans',
          'left',
        )
          .glow(vh > 0.3 ? 8 : 0, ROLE.fail)
          .opacity(a),
        txt(
          'High confidence never waives a policy breach',
          115,
          210,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
      );

      nodes.push(
        txt(
          'VALID UNCERTAINTY REQUIRES HONEST SAMPLING, FULL DENOMINATORS & HARD GATES',
          0,
          395,
          28,
          vh > 0.3 ? ROLE.fail : ROLE.trace,
          'mono',
          'center',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  s.add(stageAura, header, mode0, mode1);

  c.on('wilson-center', () => {
    s.play(centerOn.to(1, { duration: clampDur(c, c.cue('wilson-center').start, 0.35) }));
  });
  c.on('wilson-radius', () => {
    s.play(radiusExt.to(1, { duration: clampDur(c, c.cue('wilson-radius').start, 0.5) }));
  });
  c.on('wilson-endpoints', () => {
    s.play(pilotCaps.to(1, { duration: clampDur(c, c.cue('wilson-endpoints').start, 0.35) }));
  });
  c.after('small-interval', () => {
    s.play(pilotLbls.to(1, { duration: clampDur(c, c.cue('small-interval').end, 0.3) }));
  });
  c.on('large-case', () => {
    s.play(largeOn.to(1, { duration: clampDur(c, c.cue('large-case').start, 0.45) }));
  });
  c.after('large-interval', () => {
    s.play(largeLbls.to(1, { duration: clampDur(c, c.cue('large-interval').end, 0.3) }));
  });
  c.after('lower-gate', () => {
    s.play(floorFail.to(1, { duration: clampDur(c, c.cue('lower-gate').end, 0.3) }));
  });
  c.show('all-pass-bound', allPassEq);
  c.on('all-pass-bound', () => {
    s.play(allPassOn.to(1, { duration: clampDur(c, c.cue('all-pass-bound').start, 0.4) }));
  });
  c.on('bound-question', () => {
    s.play(askClear.to(1, { duration: clampDur(c, c.cue('bound-question').start, 0.35) }));
  });
  c.after('bound-result', () => {
    s.play(boundRes.to(1, { duration: clampDur(c, c.cue('bound-result').end, 0.35) }));
  });

  // Beat 4: Sampling clusters & denominator integrity
  c.hide(4, allPassEq);
  c.onBeat(4, () => {
    s.play(clusterMode.to(1, { duration: clampDur(c, c.beats[4].start, 0.6) }));
  });
  c.on('regression-groups', () => {
    s.play(groupsHi.to(1, { duration: clampDur(c, c.cue('regression-groups').start, 0.35) }));
  });
  c.on('denominator', () => {
    s.play(denomHi.to(1, { duration: clampDur(c, c.cue('denominator').start, 0.35) }));
  });
  c.on('hard-veto', () => {
    s.play(vetoHi.to(1, { duration: clampDur(c, c.cue('hard-veto').start, 0.35) }));
  });
}
