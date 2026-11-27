// Scene 13: judge-calibration - Would the judge pick the same reply?
// Mode 0 (Beat 0): 4-pair A/B swap-remap calibration matrix (`JUDGE_ROWS`) with
// crossing Pair 2 slot-2 flip arc, strictly withholding 3/4 (75%) until `forward-score`,
// 2/4 (50% flips) until `flip-score`, and MISSES BOTH until `judge-screen`.
// Mode 1 (Beats 1-2): Advisory boundary + untrusted quoted-field prompt-injection firewall.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  JUDGE_FLIPS,
  JUDGE_FLIP_RATE,
  JUDGE_FORWARD_MATCHES,
  JUDGE_FORWARD_RATE,
  JUDGE_ROWS,
  ROLE,
  aura,
  autoNode,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  glowMeter,
  guardedDynamic,
  quadArcPts,
  railBar,
  segmentWithPhoton,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function judgeCalibration(s, c) {
  const pulse = s.value(0);
  const humOn = s.value(0);
  const fwdOn = s.value(0);
  const fwdScore = s.value(0);
  const swapOn = s.value(0);
  const flipScore = s.value(0);
  const screenRes = s.value(0);

  const safeMode = s.value(0); // Beats 1-2 advisory + injection firewall
  const advOn = s.value(0);
  const critOn = s.value(0);
  const injOn = s.value(0);
  const boundOn = s.value(0);

  const header = cinemaHeader('JUDGE CALIBRATION', 'Would the judge pick', 'the same reply?', {
    accent: ROLE.judge,
    size: 50,
  });

  const stageAura = aura(120, 40, 660, '#a78bfa1c', '#ffd16614');

  // Mode 0 (Beat 0): 4-pair human vs forward vs swapped-normalized matrix + dual gauges
  const mode0 = guardedDynamic(
    () => fadeOutHalf(safeMode.value),
    (a) => {
      const p = 0;
      const hm = humOn.value;
      const fw = fwdOn.value;
      const fs = fwdScore.value;
      const sw = swapOn.value;
      const fl = flipScore.value;
      const sc = screenRes.value;
      const nodes = [];

      // Left matrix (x in [-840..120])
      nodes.push(
        txt('PAIR', -830, -185, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('HUMAN', -680, -185, 26, ROLE.human, 'mono', 'center').opacity(a),
        txt('FORWARD', -470, -185, 26, ROLE.trace, 'mono', 'center').opacity(a),
        txt('SWAPPED', -220, -185, 26, ROLE.focus, 'mono', 'center').opacity(a),
        txt('STATE', 25, -185, 26, COSMOS.muted, 'mono', 'center').opacity(a),
        line([-840, -155], [140, -155], { stroke: '#29385f', width: 2 }).opacity(a),
      );

      JUDGE_ROWS.forEach((row, i) => {
        const y = -85 + i * 96;
        const matchHum = row.human === row.forward;
        const flipped = row.forward !== row.swap;
        const isPair2 = i === 1;

        nodes.push(
          txt(
            `#${i + 1}`,
            -830,
            y,
            28,
            isPair2 && sw > 0.3 ? ROLE.focus : COSMOS.muted,
            'mono',
            'left',
          ).opacity(a),
          txt(row.human, -680, y, 32, ROLE.human, 'mono', 'center').opacity(a * (0.4 + 0.6 * hm)),
          txt(
            row.forward,
            -470,
            y,
            32,
            fs > 0.35 ? (matchHum ? ROLE.pass : ROLE.fail) : ROLE.trace,
            'mono',
            'center',
          ).opacity(a * (0.35 + 0.65 * fw)),
        );

        if (sw > 0.1) {
          nodes.push(
            txt(
              row.swap,
              -220,
              y,
              32,
              flipped && fl > 0.35 ? ROLE.warn : COSMOS.ink,
              'mono',
              'center',
            )
              .glow(flipped && fl > 0.35 ? 9 : 0, ROLE.warn)
              .opacity(a * sw),
          );
          if (isPair2) {
            nodes.push(
              beamWithPhotons(quadArcPts([-425, y], [-265, y], -32, 18), ROLE.warn, p, {
                width: 3.2,
                glow: 8,
                photonCount: 1,
                alpha: a * sw,
              }),
            );
          }
        }

        if (fl > 0.35) {
          nodes.push(
            txt(
              flipped ? 'FLIP!' : 'SAME',
              25,
              y,
              26,
              flipped ? ROLE.warn : ROLE.pass,
              'mono',
              'center',
            )
              .glow(flipped ? 9 : 0, ROLE.warn)
              .opacity(a * fl),
          );
        } else if (fs > 0.35) {
          nodes.push(
            txt(
              matchHum ? 'AGREE' : 'MISS',
              25,
              y,
              26,
              matchHum ? ROLE.pass : ROLE.fail,
              'mono',
              'center',
            ).opacity(a * fs),
          );
        }
      });

      // Right calibration threshold gauges (x in [220..850])
      nodes.push(
        railBar(210, -180, 260, sc > 0.35 ? ROLE.warn : ROLE.judge, {
          width: 5,
          glow: 8,
          opacity: a,
        }),
        txt('CALIBRATION THRESHOLDS', 240, -160, 26, ROLE.judge, 'mono', 'left').opacity(a),
        txt('AGREEMENT GOAL: >= 90%', 240, -90, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      );
      if (fs > 0.1) {
        nodes.push(
          txt(
            `Forward: ${JUDGE_FORWARD_MATCHES}/4 = ${(JUDGE_FORWARD_RATE * 100).toFixed(0)}%`,
            240,
            -42,
            32,
            ROLE.pass,
            'mono',
            'left',
          ).opacity(a * fs),
          glowMeter(240, 2, 600, 24, JUDGE_FORWARD_RATE, { fill: ROLE.pass, opacity: a * fs }),
        );
      } else {
        nodes.push(glowMeter(240, 2, 600, 24, 0, { fill: ROLE.trace, opacity: a * 0.6 }));
      }

      nodes.push(
        txt('ORDER-FLIP LIMIT: <= 5%', 240, 74, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      );
      if (fl > 0.1) {
        nodes.push(
          txt(
            `Swapped flips: ${JUDGE_FLIPS}/4 = ${(JUDGE_FLIP_RATE * 100).toFixed(0)}%`,
            240,
            122,
            32,
            ROLE.warn,
            'mono',
            'left',
          )
            .glow(8, ROLE.warn)
            .opacity(a * fl),
          glowMeter(240, 166, 600, 24, JUDGE_FLIP_RATE, { fill: ROLE.warn, opacity: a * fl }),
        );
      } else {
        nodes.push(glowMeter(240, 166, 600, 24, 0, { fill: ROLE.warn, opacity: a * 0.6 }));
      }

      if (sc > 0.1) {
        nodes.push(
          txt('MISSES BOTH THRESHOLDS', 240, 232, 30, ROLE.warn, 'mono', 'left')
            .glow(10, ROLE.warn)
            .opacity(a * sc),
        );
      }

      const foot =
        sc > 0.35
          ? 'MISSES BOTH LIMITS'
          : fl > 0.35
            ? 'Pair 2 picked Slot 2 twice (B then A) · 2 of 4 pairs flipped identity'
            : fs > 0.35
              ? 'Forward choices agree with human labels on 3 of 4 pairs (75%)'
              : 'Swap A/B slots and remap winners back to reply identity';
      nodes.push(
        txt(foot, 0, 395, 28, sc > 0.35 ? ROLE.warn : COSMOS.muted, 'mono', 'center').opacity(a),
      );
      return group(...nodes);
    },
  );

  // Mode 1 (Beats 1-2): Advisory boundary + quoted untrusted chamber + zero tools
  const mode1 = guardedDynamic(
    () => fadeInHalf(safeMode.value),
    (a) => {
      const p = 0;
      const av = advOn.value;
      const cr = critOn.value;
      const ij = injOn.value;
      const bn = boundOn.value;
      const nodes = [];

      // Left: Communication vs Policy separation
      nodes.push(
        railBar(-840, -175, 245, ROLE.judge, { width: 5, glow: 8, opacity: a }),
        txt('KEEP JUDGE ADVISORY', -810, -155, 26, ROLE.judge, 'mono', 'left').opacity(a),
        txt('Wording score: 9.5 / 10', -810, -88, 32, ROLE.pass, 'mono', 'left').opacity(
          a * (0.5 + 0.5 * av),
        ),
        txt('4 pairs = wide uncertainty', -810, -34, 26, COSMOS.muted, 'sans', 'left').opacity(a),
        line([-810, 18], [-250, 18], { stroke: '#29385f', width: 2 }).opacity(a),
        txt(
          'RUNTIME POLICY TRACE',
          -810,
          72,
          26,
          cr > 0.3 ? ROLE.fail : COSMOS.dim,
          'mono',
          'left',
        ).opacity(a),
        txt(
          'Forbidden attempt still fails run!',
          -810,
          132,
          28,
          cr > 0.3 ? ROLE.fail : COSMOS.muted,
          'mono',
          'left',
        )
          .glow(cr > 0.3 ? 9 : 0, ROLE.fail)
          .opacity(a),
        txt(
          'Grade wording separately from state',
          -810,
          198,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
      );

      // Right: Prompt-injection isolation architecture (autoNode + trimSeg)
      const cCand = [120, 40];
      const cJudge = [470, 40];
      const cTools = [785, -75];
      const cHuman = [785, 175];

      const nCand = autoNode(cCand[0], cCand[1], 'TEXT', {
        radius: 58,
        color: ij > 0.3 ? ROLE.fail : ROLE.warn,
        glow: ij > 0.3 ? 11 : 6,
        opacity: a,
        sub: 'Quoted untrusted',
        subColor: ROLE.warn,
      });
      const nJudge = autoNode(cJudge[0], cJudge[1], 'JUDGE', {
        radius: 58,
        color: ROLE.judge,
        glow: 9,
        opacity: a,
        sub: '0 tools · advisory',
        subColor: ROLE.judge,
      });
      const nTools = autoNode(cTools[0], cTools[1], 'TOOLS', {
        radius: 56,
        color: bn > 0.3 ? ROLE.fail : COSMOS.dim,
        glow: bn > 0.3 ? 10 : 3,
        opacity: a,
      });
      const nHuman = autoNode(cHuman[0], cHuman[1], 'HUMAN', {
        radius: 56,
        color: bn > 0.3 ? ROLE.pass : ROLE.human,
        glow: bn > 0.3 ? 10 : 5,
        opacity: a,
      });

      const [j1a, j1b] = trimSeg(cCand, cJudge, nCand.r, nJudge.r);
      const [j2a, j2b] = trimSeg(cJudge, cTools, nJudge.r, nTools.r);
      const [j3a, j3b] = trimSeg(cJudge, cHuman, nJudge.r, nHuman.r);

      nodes.push(
        txt(
          'INJECTION DEFENSE (BERKELEY RDI AUDIT)',
          440,
          -205,
          26,
          ij > 0.3 ? ROLE.fail : ROLE.trace,
          'mono',
          'center',
        ).opacity(a),
        segmentWithPhoton(j1a, j1b, ij > 0.3 ? ROLE.warn : ROLE.trace, p, { width: 3.2, alpha: a }),
        line(j2a, j2b, { stroke: ROLE.fail, width: 3.2, dash: [8, 8] }).opacity(
          a * (0.4 + 0.6 * bn),
        ),
        segmentWithPhoton(j3a, j3b, ROLE.pass, p + 0.4, {
          width: 3.2,
          alpha: a * (0.4 + 0.6 * bn),
        }),
        nCand.node,
        nJudge.node,
        nTools.node,
        nHuman.node,
        txt('BLOCKED', 615, -88, 26, ROLE.fail, 'mono', 'center').opacity(a * (0.4 + 0.6 * bn)),
        txt('SENSITIVE', 615, 198, 26, ROLE.pass, 'mono', 'center').opacity(a * (0.4 + 0.6 * bn)),
      );

      nodes.push(
        txt(
          bn > 0.3
            ? 'QUOTE CANDIDATE TEXT · STRIP JUDGE TOOLS · ROUTE SENSITIVE CALLS TO HUMANS'
            : 'Candidate output is untrusted text: quotes mark source, not safety',
          0,
          395,
          28,
          bn > 0.3 ? ROLE.pass : ROLE.warn,
          'mono',
          'center',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  s.add(stageAura, header, mode0, mode1);

  c.on('human-labels', () => {
    s.play(humOn.to(1, { duration: clampDur(c, c.cue('human-labels').start, 0.35) }));
  });
  c.on('forward-input', () => {
    s.play(fwdOn.to(1, { duration: clampDur(c, c.cue('forward-input').start, 0.35) }));
  });
  c.after('forward-score', () => {
    s.play(fwdScore.to(1, { duration: clampDur(c, c.cue('forward-score').end, 0.3) }));
  });
  c.on('swap-remap', () => {
    s.play(swapOn.to(1, { duration: clampDur(c, c.cue('swap-remap').start, 0.4) }));
  });
  c.after('flip-score', () => {
    s.play(flipScore.to(1, { duration: clampDur(c, c.cue('flip-score').end, 0.3) }));
  });
  c.after('judge-screen', () => {
    s.play(screenRes.to(1, { duration: clampDur(c, c.cue('judge-screen').end, 0.3) }));
  });

  // Beat 1: Advisory & Injection defense
  c.onBeat(1, () => {
    s.play(safeMode.to(1, { duration: clampDur(c, c.beats[1].start, 0.6) }));
  });
  c.on('judge-advisory', () => {
    s.play(advOn.to(1, { duration: clampDur(c, c.cue('judge-advisory').start, 0.35) }));
  });
  c.on('critical-override', () => {
    s.play(critOn.to(1, { duration: clampDur(c, c.cue('critical-override').start, 0.35) }));
  });
  c.on('judge-injection', () => {
    s.play(injOn.to(1, { duration: clampDur(c, c.cue('judge-injection').start, 0.35) }));
  });
  c.on('judge-boundary', () => {
    s.play(boundOn.to(1, { duration: clampDur(c, c.cue('judge-boundary').start, 0.4) }));
  });
}
