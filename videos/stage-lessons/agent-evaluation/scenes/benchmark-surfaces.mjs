// Scene 14: benchmark-surfaces - Choose a verifier for the job
// Mode 0 (Beats 0-1): Optical Benchmark-to-Observable routing matrix across all 6 named
// public benchmarks (SWE-bench, WebArena, OSWorld -> GAIA, Terminal-Bench, Tau-Bench)
// plus the Tau-Bench confirmation-gap spotlight.
// Mode 1 (Beat 2): Reproducibility Configuration Constellation + Terminal-Bench v2.1 vs v4.0
// version drift break requiring a full rerun under pinned tasks, verifier, and limits.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  autoNode,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  guardedDynamic,
  railBar,
  segmentWithPhoton,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function benchmarkSurfaces(s, c) {
  const pulse = s.value(0);
  // Beat 0
  const sweOn = s.value(0);
  const webOn = s.value(0);
  const osOn = s.value(0);
  // Beat 1 switch + cues
  const page2T = s.value(0);
  const gaiaOn = s.value(0);
  const termOn = s.value(0);
  const tauOn = s.value(0);
  const gapOn = s.value(0);
  // Beat 2 switch + cues
  const cfgMode = s.value(0);
  const pinOn = s.value(0);
  const v4On = s.value(0);
  const rerunOn = s.value(0);

  const header = cinemaHeader('PUBLIC BENCHMARKS', 'Choose a verifier', 'for the job', {
    accent: ROLE.trace,
    size: 50,
  });

  const stageAura = aura(0, 40, 680, '#5ce1e61a', '#60a5fa14');

  // Mode 0A (Beat 0): SWE-bench, WebArena, OSWorld
  const mode0A = guardedDynamic(
    () => fadeOutHalf(page2T.value),
    (a) => {
      const p = 0;
      const rows = [
        {
          name: 'SWE-bench',
          surface: 'Git repository patch',
          verifier: 'Repo unit tests (FAIL_TO_PASS / PASS_TO_PASS)',
          col: ROLE.pass,
          on: sweOn.value,
        },
        {
          name: 'WebArena',
          surface: 'Self-hosted web apps',
          verifier: 'Answers, URLs, HTML page state + model judges',
          col: ROLE.host,
          on: webOn.value,
        },
        {
          name: 'OSWorld',
          surface: 'Desktop (Ubuntu)',
          verifier: 'Files, OS settings & application state checks',
          col: ROLE.trace,
          on: osOn.value,
        },
      ];
      const nodes = [
        txt('BENCHMARK', -830, -175, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('SURFACE', -430, -175, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('VERIFIER OBSERVABLE', 70, -175, 26, ROLE.trace, 'mono', 'left').opacity(a),
        line([-840, -145], [855, -145], { stroke: '#29385f', width: 2 }).opacity(a),
      ];

      rows.forEach((r, i) => {
        const y = -52 + i * 142;
        const active = r.on > 0.3;
        const col = active ? r.col : COSMOS.dim;
        nodes.push(
          railBar(-840, y - 42, y + 42, col, { width: 5, glow: active ? 10 : 3, opacity: a }),
          txt(r.name, -810, y, 36, active ? r.col : COSMOS.ink, 'serif', 'left')
            .glow(active ? 7 : 0, r.col)
            .opacity(a),
          txt(r.surface, -430, y, 28, active ? COSMOS.ink : COSMOS.muted, 'sans', 'left').opacity(
            a,
          ),
          segmentWithPhoton([-70, y], [40, y], col, p + i * 0.25, {
            width: 3,
            glow: active ? 8 : 2,
            photon: active,
            alpha: a,
          }),
          txt(r.verifier, 70, y, 28, active ? COSMOS.ink : COSMOS.dim, 'mono', 'left').opacity(
            a * (0.35 + 0.65 * r.on),
          ),
        );
      });

      nodes.push(
        txt(
          'Even across these surfaces, the library still needs its own private permission suite',
          0,
          395,
          28,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  // Mode 0B (Beat 1): GAIA, Terminal-Bench, Tau-Bench + confirmation gap
  const mode0B = guardedDynamic(
    () => fadeInHalf(page2T.value) * fadeOutHalf(cfgMode.value),
    (a) => {
      const p = 0;
      const gp = gapOn.value;
      const rows = [
        {
          name: 'GAIA',
          surface: 'Assistant Q&A',
          verifier: 'Normalized numbers, strings or ordered lists',
          col: ROLE.judge,
          on: gaiaOn.value,
        },
        {
          name: 'Terminal-Bench',
          surface: 'CLI & shell tasks',
          verifier: 'Task-specific verifiers + strict resource limits',
          col: ROLE.focus,
          on: termOn.value,
        },
        {
          name: 'Tau-Bench',
          surface: 'Simulated user + DB',
          verifier: 'Final database changes vs annotated goal',
          col: ROLE.trace,
          on: tauOn.value,
        },
      ];
      const nodes = [
        txt('BENCHMARK', -830, -175, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('SURFACE', -430, -175, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('VERIFIER OBSERVABLE', 50, -175, 26, ROLE.trace, 'mono', 'left').opacity(a),
        line([-840, -145], [855, -145], { stroke: '#29385f', width: 2 }).opacity(a),
      ];

      rows.forEach((r, i) => {
        const y = -58 + i * 130;
        const active = r.on > 0.3;
        const col = active ? r.col : COSMOS.dim;
        nodes.push(
          railBar(-840, y - 38, y + 38, col, { width: 5, glow: active ? 10 : 3, opacity: a }),
          txt(r.name, -810, y, 36, active ? r.col : COSMOS.ink, 'serif', 'left')
            .glow(active ? 7 : 0, r.col)
            .opacity(a),
          txt(r.surface, -430, y, 28, active ? COSMOS.ink : COSMOS.muted, 'sans', 'left').opacity(
            a,
          ),
          segmentWithPhoton([-90, y], [20, y], col, p + i * 0.25, {
            width: 3,
            glow: active ? 8 : 2,
            photon: active,
            alpha: a,
          }),
          txt(r.verifier, 50, y, 28, active ? COSMOS.ink : COSMOS.dim, 'mono', 'left').opacity(
            a * (0.35 + 0.65 * r.on),
          ),
        );
      });

      if (gp > 0.1) {
        nodes.push(
          txt(
            'TAU-BENCH GAP: Final DB matches, yet agent skipped required user confirmation!',
            0,
            302,
            28,
            ROLE.fail,
            'mono',
            'center',
          )
            .glow(9, ROLE.fail)
            .opacity(a * gp),
        );
      }

      nodes.push(
        txt(
          'AgentBench spans multiple environments · pick a verifier that sees YOUR failure modes',
          0,
          395,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  // Mode 1 (Beat 2): Reproducibility Configuration Tuple + Version Drift Rerun Rule
  const mode1 = guardedDynamic(
    () => fadeInHalf(cfgMode.value),
    (a) => {
      const p = 0;
      const pn = pinOn.value;
      const v4 = v4On.value;
      const rr = rerunOn.value;
      const nodes = [];

      // Left rail: Pinned Reproducibility Tuple (Model + Scaffold + Suite)
      nodes.push(
        railBar(-840, -180, 260, ROLE.host, { width: 5, glow: 9, opacity: a }),
        txt('PINNED SCORE CONFIGURATION', -810, -160, 26, ROLE.host, 'mono', 'left').opacity(a),
        txt(
          'Suite: task split · image · harness · scorer',
          -810,
          -90,
          28,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(a * (0.5 + 0.5 * pn)),
        txt(
          'Model: snapshot · permissions · budget',
          -810,
          -24,
          28,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(a * (0.5 + 0.5 * pn)),
        txt(
          'Scaffold: prompt · tools · loop · stop rule',
          -810,
          42,
          28,
          ROLE.trace,
          'mono',
          'left',
        ).opacity(a * (0.5 + 0.5 * pn)),
        txt(
          'Protocol: trial count · simulator · date',
          -810,
          108,
          28,
          ROLE.focus,
          'mono',
          'left',
        ).opacity(a * (0.5 + 0.5 * pn)),
        line([-810, 162], [-75, 162], { stroke: '#29385f', width: 2 }).opacity(a),
        txt(
          'Hold fixed to compare models cleanly',
          -810,
          214,
          26,
          ROLE.pass,
          'sans',
          'left',
        ).opacity(a),
      );

      // Right: Version Drift Comparison (Terminal-Bench v2.1 vs v4.0 + OSWorld-Verified)
      const cOld = [260, -20];
      const cNew = [690, -20];
      const nOld = autoNode(cOld[0], cOld[1], 'v2.1', {
        radius: 62,
        color: COSMOS.muted,
        glow: 6,
        opacity: a,
        sub: 'Old tasks & limits',
        subColor: COSMOS.muted,
      });
      const nNew = autoNode(cNew[0], cNew[1], 'v4.0', {
        radius: 66,
        color: rr > 0.35 ? ROLE.pass : v4 > 0.3 ? ROLE.focus : ROLE.trace,
        glow: 11,
        opacity: a,
        sub: 'New tasks + verifier',
        subColor: ROLE.focus,
      });
      const [va, vb] = trimSeg(cOld, cNew, nOld.r, nNew.r);

      nodes.push(
        txt('TERMINAL-BENCH CATALOG DRIFT', 475, -160, 26, ROLE.focus, 'mono', 'center').opacity(a),
        rr > 0.35
          ? segmentWithPhoton(va, vb, ROLE.pass, p, { width: 3.6, glow: 10, alpha: a })
          : line(va, vb, { stroke: ROLE.fail, width: 3.4, dash: [8, 8] }).opacity(a),
        txt(
          rr > 0.35 ? 'RERUN!' : 'DO NOT COMPARE',
          475,
          -62,
          26,
          rr > 0.35 ? ROLE.pass : ROLE.fail,
          'mono',
          'center',
        )
          .glow(8, rr > 0.35 ? ROLE.pass : ROLE.fail)
          .opacity(a),
        nOld.node,
        nNew.node,
        txt(
          'OSWorld-Verified is also a distinct suite',
          475,
          214,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(a),
      );

      nodes.push(
        txt(
          rr > 0.35
            ? 'RERUN FROZEN CANDIDATE ON NEW TASKS, VERIFIER & LIMITS BEFORE COMPARING'
            : 'A score belongs to its full pinned version, scaffold, and resource limits',
          0,
          395,
          28,
          rr > 0.35 ? ROLE.pass : ROLE.focus,
          'mono',
          'center',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  s.add(stageAura, header, mode0A, mode0B, mode1);

  c.on('bench-swe', () => {
    s.play(sweOn.to(1, { duration: clampDur(c, c.cue('bench-swe').start, 0.35) }));
  });
  c.on('bench-web', () => {
    s.play(webOn.to(1, { duration: clampDur(c, c.cue('bench-web').start, 0.35) }));
  });
  c.on('bench-os', () => {
    s.play(osOn.to(1, { duration: clampDur(c, c.cue('bench-os').start, 0.35) }));
  });

  c.onBeat(1, () => {
    s.play(page2T.to(1, { duration: clampDur(c, c.beats[1].start, 0.6) }));
  });
  c.on('bench-gaia', () => {
    s.play(gaiaOn.to(1, { duration: clampDur(c, c.cue('bench-gaia').start, 0.35) }));
  });
  c.on('bench-terminal', () => {
    s.play(termOn.to(1, { duration: clampDur(c, c.cue('bench-terminal').start, 0.35) }));
  });
  c.on('bench-tau', () => {
    s.play(tauOn.to(1, { duration: clampDur(c, c.cue('bench-tau').start, 0.35) }));
  });
  c.on('confirmation-gap', () => {
    s.play(gapOn.to(1, { duration: clampDur(c, c.cue('confirmation-gap').start, 0.4) }));
  });

  c.onBeat(2, () => {
    s.play(cfgMode.to(1, { duration: clampDur(c, c.beats[2].start, 0.6) }));
  });
  c.on('pin-config', () => {
    s.play(pinOn.to(1, { duration: clampDur(c, c.cue('pin-config').start, 0.35) }));
  });
  c.on('version-four', () => {
    s.play(v4On.to(1, { duration: clampDur(c, c.cue('version-four').start, 0.35) }));
  });
  c.on('rerun-version', () => {
    s.play(rerunOn.to(1, { duration: clampDur(c, c.cue('rerun-version').start, 0.4) }));
  });
}
