// Scene 15: harness-integrity - Where does the next run start?
// Mode 0 (Beats 0-1): Orbiting 3D Sandbox Isolation Boundary (`cinematic3d` + `addBox3D`
// + `wireframeSlab3d` + `orbitScene`) separating the disposable candidate sandbox
// (Firecracker / gVisor) from the remote DB, agent cache, gold answers & verifier deps.
// Mode 1 (Beat 2): Lexical mount-containment probe (`/sandbox/agent` vs `/harness/gold`)
// showing inside-mount FAIL, outside-mount PASS, `..` rejection, and symlink limit warning.
import { group, line, line3d, parametricSurface } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  glowDot,
  guardedDynamic,
  orbitScene,
  railBar,
  txt,
  wireframeSlab3d,
} from '../parts.mjs';

export default function harnessIntegrity(s, c) {
  const pulse = s.value(0);
  const remoteReset = s.value(0);
  const approvalReset = s.value(0);
  const goldMoved = s.value(0);
  const depsMoved = s.value(0);

  const pathMode = s.value(0); // Beat 2 lexical mount check
  const insideOn = s.value(0);
  const outsideOn = s.value(0);
  const symOn = s.value(0);

  const header = cinemaHeader('HARNESS INTEGRITY', 'Where does the', 'next run start?', {
    accent: ROLE.host,
    size: 50,
  });

  const stageAura = aura(240, 40, 660, '#60a5fa1a', '#6ee7b716');

  // 3D Isolation Boundary Scene (Beats 0-1, positioned right-center)
  const view3d = cinematic3d({
    theta: -0.74,
    phi: 1.02,
    distance: 14.5,
    unit: 106,
    focus: [0, 0, 0.5],
  }).at(350, -30);

  // Candidate disposable sandbox slab (left in 3D space: x in [-2.8..-0.6])
  addBox3D(view3d, -2.8, -1.2, 0, 2.0, 2.4, 1.35, ROLE.host, ROLE.host, {
    faceOpacity: 0.45,
    edgeWidth: 2.2,
    edgeGlow: 8,
  });
  // Trusted Harness & Gold Vault slab (right in 3D space: x in [0.8..3.0])
  addBox3D(view3d, 0.8, -1.2, 0, 2.0, 2.4, 1.85, ROLE.pass, ROLE.pass, {
    faceOpacity: 0.45,
    edgeWidth: 2.2,
    edgeGlow: 9,
  });
  // Glowing translucent Trust Boundary Wall at x = 0.0
  view3d.add(
    parametricSurface((u, v) => [0.0, -2.0 + u * 4.0, v * 2.6], [0, 1], [0, 1], {
      resolution: [1, 1],
      color: ROLE.trace,
      opacity: 0.28,
      mesh: false,
      shaded: false,
    }),
    line3d([0, -2.0, 0], [0, 2.0, 0], { color: ROLE.trace, width: 3.2, glow: 10, blend: 'screen' }),
    line3d([0, -2.0, 2.6], [0, 2.0, 2.6], {
      color: ROLE.trace,
      width: 3.2,
      glow: 10,
      blend: 'screen',
    }),
    line3d([0, -2.0, 0], [0, -2.0, 2.6], {
      color: ROLE.trace,
      width: 3.2,
      glow: 10,
      blend: 'screen',
    }),
    line3d([0, 2.0, 0], [0, 2.0, 2.6], {
      color: ROLE.trace,
      width: 3.2,
      glow: 10,
      blend: 'screen',
    }),
  );
  // Reactive floating wireframe slab representing Gold + Verifier Deps crossing into Trusted Vault!
  view3d.add(
    ...wireframeSlab3d(() => [-1.8 + goldMoved.value * 3.6, 0, 1.85], 0.55, 0.55, 0.38, {
      color: ROLE.focus,
      width: 3.0,
      glow: 10,
    }),
  );

  // Mode 0 overlay (left checklist synced with 3D boundary on Beats 0-1)
  const mode0 = guardedDynamic(
    () => fadeOutHalf(pathMode.value),
    (a) => {
      const rr = remoteReset.value;
      const ar = approvalReset.value;
      const gm = goldMoved.value;
      const dm = depsMoved.value;
      const nodes = [];

      const items = [
        {
          title: '1. REMOTE LIBRARY DB',
          detail: rr > 0.35 ? 'Restored clean (old hold gone)' : 'Lena’s old hold still persists!',
          col: rr > 0.35 ? ROLE.pass : ROLE.warn,
        },
        {
          title: '2. AGENT CACHE & APPROVALS',
          detail: ar > 0.35 ? 'Memory & prior permits cleared' : 'Cached lookup + approval linger',
          col: ar > 0.35 ? ROLE.pass : ROLE.retry,
        },
        {
          title: '3. REFERENCE GOLD ANSWERS',
          detail: gm > 0.35 ? 'Moved across trust boundary' : 'Audit risk: WebArena file:// leak',
          col: gm > 0.35 ? ROLE.pass : ROLE.fail,
        },
        {
          title: '4. VERIFIER DEPS & COLLECTOR',
          detail:
            dm > 0.35 ? 'Isolated outside candidate reach' : 'Audit risk: Terminal-Bench tampering',
          col: dm > 0.35 ? ROLE.pass : ROLE.fail,
        },
      ];

      items.forEach((it, idx) => {
        const y = -165 + idx * 124;
        nodes.push(
          railBar(-840, y - 22, y + 54, it.col, { width: 5, glow: 9, opacity: a }),
          txt(it.title, -810, y, 26, it.col, 'mono', 'left').opacity(a),
          txt(it.detail, -810, y + 40, 28, COSMOS.ink, 'sans', 'left').opacity(a),
        );
      });

      // 3D caption labels beneath right 3D scene
      nodes.push(
        txt('CANDIDATE SANDBOX', 140, 336, 26, ROLE.host, 'mono', 'center').opacity(a),
        txt('TRUST WALL', 370, 336, 26, ROLE.trace, 'mono', 'center').opacity(a),
        txt('HARNESS VAULT', 610, 336, 26, ROLE.pass, 'mono', 'center').opacity(a),
        txt(
          'Firecracker / gVisor supply only the filesystem, network & identity isolation you configure',
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

  // Mode 1 (Beat 2): Lexical mount containment + symlink limitation probe
  const mode1 = guardedDynamic(
    () => fadeInHalf(pathMode.value),
    (a) => {
      const ins = insideOn.value;
      const out = outsideOn.value;
      const sym = symOn.value;
      const nodes = [];

      // Left: Agent mount tree
      nodes.push(
        railBar(-840, -175, 245, ROLE.host, { width: 5, glow: 9, opacity: a }),
        txt('AGENT MOUNT ROOT', -810, -155, 26, ROLE.host, 'mono', 'left').opacity(a),
        txt('/sandbox/agent', -810, -88, 38, COSMOS.ink, 'mono', 'left').opacity(a),
        line([-810, -34], [-140, -34], { stroke: '#29385f', width: 2 }).opacity(a),
        txt(
          'TEST 1: /sandbox/agent/expected.json',
          -810,
          28,
          28,
          ins > 0.3 ? ROLE.fail : COSMOS.muted,
          'mono',
          'left',
        )
          .glow(ins > 0.3 ? 9 : 0, ROLE.fail)
          .opacity(a),
        txt(
          ins > 0.3 ? 'FAIL: inside candidate mount!' : 'Inside agent filesystem',
          -810,
          76,
          26,
          ins > 0.3 ? ROLE.fail : COSMOS.dim,
          'mono',
          'left',
        ).opacity(a),
        txt(
          'TEST 2: /sandbox/agent/../gold.json',
          -810,
          152,
          28,
          ROLE.warn,
          'mono',
          'left',
        ).opacity(a),
        txt(
          'REJECTED: parent traversal ("..") blocked',
          -810,
          200,
          26,
          ROLE.warn,
          'mono',
          'left',
        ).opacity(a),
      );

      // Right: Harness isolated vault + symlink gap warning
      nodes.push(
        railBar(65, -175, 245, out > 0.3 ? ROLE.pass : ROLE.trace, {
          width: 5,
          glow: 9,
          opacity: a,
        }),
        txt('HARNESS GOLD VAULT', 95, -155, 26, ROLE.pass, 'mono', 'left').opacity(a),
        txt(
          '/harness/gold/expected.json',
          95,
          -88,
          34,
          out > 0.3 ? ROLE.pass : COSMOS.ink,
          'mono',
          'left',
        )
          .glow(out > 0.3 ? 9 : 0, ROLE.pass)
          .opacity(a),
        line([95, -34], [855, -34], { stroke: '#214c45', width: 2 }).opacity(a),
        txt(
          out > 0.3 ? 'PASS: lexical path outside mount' : 'Absolute harness path',
          95,
          28,
          28,
          out > 0.3 ? ROLE.pass : COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
      );

      if (sym > 0.1) {
        nodes.push(
          glowDot(112, 118, { radius: 9, color: ROLE.warn, glow: 11, opacity: a * sym }),
          txt('LIMITATION: SYMLINKS UNRESOLVED!', 140, 118, 28, ROLE.warn, 'mono', 'left')
            .glow(9, ROLE.warn)
            .opacity(a * sym),
          txt(
            'Path check inspects strings only · test live open() & network access',
            95,
            188,
            26,
            COSMOS.ink,
            'sans',
            'left',
          ).opacity(a * sym),
        );
      }

      nodes.push(
        txt(
          sym > 0.3
            ? 'VERIFY ISOLATION AT RUNTIME: TEST WHAT THE CANDIDATE IDENTITY CAN ACTUALLY OPEN'
            : 'Keep reference answers, verifier dependencies & collectors outside candidate reach',
          0,
          395,
          28,
          sym > 0.3 ? ROLE.warn : ROLE.pass,
          'mono',
          'center',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  s.add(stageAura, header, view3d, mode0, mode1);
  orbitScene(s, c, view3d, { theta: -0.25, phi: 0.94 });

  c.on('reset-remote', () => {
    s.play(remoteReset.to(1, { duration: clampDur(c, c.cue('reset-remote').start, 0.4) }));
  });
  c.on('reset-approval', () => {
    s.play(approvalReset.to(1, { duration: clampDur(c, c.cue('reset-approval').start, 0.4) }));
  });
  c.on('protect-gold', () => {
    s.play(goldMoved.to(1, { duration: clampDur(c, c.cue('protect-gold').start, 0.55) }));
  });
  c.on('protect-deps', () => {
    s.play(depsMoved.to(1, { duration: clampDur(c, c.cue('protect-deps').start, 0.4) }));
  });

  // Beat 2: Hide 3D boundary cleanly and reveal lexical path containment probe
  c.hide(2, view3d);
  c.onBeat(2, () => {
    s.play(pathMode.to(1, { duration: clampDur(c, c.beats[2].start, 0.6) }));
  });
  c.on('path-inside', () => {
    s.play(insideOn.to(1, { duration: clampDur(c, c.cue('path-inside').start, 0.35) }));
  });
  c.on('path-outside', () => {
    s.play(outsideOn.to(1, { duration: clampDur(c, c.cue('path-outside').start, 0.35) }));
  });
  c.on('symlink-limit', () => {
    s.play(symOn.to(1, { duration: clampDur(c, c.cue('symlink-limit').start, 0.4) }));
  });
}
