// Scene 4: commit-boundary - "Move the fault across the commit" (3D HERO SHOWCASE SCENE!)
// Orbiting 3D SQLite dual-database transaction manifold (cinematic3d + surface + curve3d):
// File 1 faults BEFORE the glowing z = 0 commit plane (both paired rows roll back -> None).
// File 2 crosses z = 0 into durable storage before the reply drops (reopened file returns job-1, queued).
import { curve3d, line, surface } from 'vizmatic/stage';
import { wireframeSlab3d } from '../../cinematic-kit.mjs';
import {
  COSMOS,
  OP,
  ROLE,
  ambientClock,
  cinemaAtmosphere,
  cinematic3d,
  glowCross,
  glowDot,
  glowPill,
  guardedDynamic,
  heroTitle,
  hexAlpha,
  lowerFooter,
  orbitScene,
  playCue,
  txt,
} from '../parts.mjs';

export default function commitBoundary(s, c) {
  const title = heroTitle(['Move the fault across', 'the commit'], {
    x: -855,
    y: -440,
    size: 50,
    lineHeight: 58,
    accent: ROLE.controller,
  });

  const amb = ambientClock(s, c);
  const showPaired = s.value(0);
  const fault1Prog = s.value(0); // File 1 drops toward commit plane then snaps back up
  const fault2Prog = s.value(0); // File 2 crosses commit plane into durable zone
  const noReply = s.value(0);
  const reopen = s.value(0);
  const askReads = s.value(0);
  const revealFile1 = s.value(0); // STRICTLY AFTER 'first-file'
  const revealFile2 = s.value(0); // STRICTLY AFTER 'second-file'
  const workerNote = s.value(0);

  // Orbiting 3D SQLite Commit Plane Manifold on center-left
  const scene3d = cinematic3d({
    theta: -0.62,
    phi: 1.08,
    distance: 14.2,
    unit: 120,
    focus: [0, 0, 0.1],
  }).at(-290, 25);

  scene3d.add(
    // Glowing commit boundary plane at z = 0
    surface((x, y) => 0.04 * Math.sin(x * 1.4) * Math.cos(y * 1.4), {
      x: [-2.4, 2.4],
      y: [-1.4, 1.4],
      resolution: [18, 12],
      colors: [COSMOS.blue, COSMOS.cyan],
      opacity: 0.42,
      stroke: COSMOS.cyan,
      strokeWidth: 0.9,
    }),
    // File 1 trajectory (left, x = -1.25): dips from z = +1.35 toward z = 0, aborts BEFORE commit
    curve3d(
      (t) => [
        -1.25 + 0.16 * Math.sin(t * Math.PI * 2),
        -0.3 + 0.6 * t,
        1.45 - 1.12 * Math.sin(t * Math.PI),
      ],
      [0, 1],
      {
        samples: 44,
        color: COSMOS.rose,
        width: 4.5,
        glow: 10,
      },
    ),
    // File 2 trajectory (right, x = +1.25): pierces cleanly through z = 0 into durable z = -1.2
    curve3d(
      (t) => [1.25 + 0.14 * Math.sin(t * Math.PI), -0.35 + 0.7 * t, 1.45 - 2.65 * t],
      [0, 1],
      {
        samples: 44,
        color: COSMOS.emerald,
        width: 5,
        glow: 12,
      },
    ),
    // Durable ledger baseline ring below z = 0 for File 2
    curve3d(
      (t) => [
        1.25 + 0.62 * Math.cos(t * Math.PI * 2),
        0.35 + 0.62 * Math.sin(t * Math.PI * 2),
        -1.2,
      ],
      [0, 1],
      {
        samples: 36,
        color: COSMOS.emerald,
        width: 3.2,
        glow: 8,
      },
    ),
    // Wireframe slab above z = 0 (File 1 staged -> rolled back)
    ...wireframeSlab3d([-1.25, 0.0, 0.85], 0.55, 0.36, 0.22, {
      color: COSMOS.rose,
      width: 2.6,
      glow: 8,
    }),
    // Wireframe slab below z = 0 (File 2 durable ledger + job-1)
    ...wireframeSlab3d([1.25, 0.35, -1.2], 0.58, 0.38, 0.24, {
      color: COSMOS.emerald,
      width: 3,
      glow: 10,
    }),
  );

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const pulse = 0.5 + 0.5 * Math.sin(amb.value * Math.PI * 10);
      const nodes = [];

      // 3D manifold legend labels (cleanly separated around the 3D plane, zero overlap)
      nodes.push(
        txt('STAGED (z > 0)', -745, -245, 26, ROLE.mark, 'mono', 'left').opacity(alpha),
        txt('SQLITE COMMIT PLANE (z = 0)', -290, -245, 26, ROLE.agent, 'mono', 'center').opacity(
          alpha,
        ),
        txt('DURABLE DISK (z < 0)', -745, 295, 26, ROLE.sure, 'mono', 'left').opacity(alpha),
      );

      // Right side: Two side-by-side reopened SQLite File Inspectors (x = 185 .. 855)
      nodes.push(
        line([145, -275], [145, 325], {
          stroke: hexAlpha(ROLE.controller, 0.45 * alpha),
          width: 2,
        }),
      );

      const f1X = 335;
      const f2X = 685;
      const commitY = 30;

      // Commit line across right panels
      nodes.push(
        line([185, commitY], [855, commitY], {
          stroke: ROLE.controller,
          width: 3.5,
          dash: [12, 8],
        }).glow(6, ROLE.controller),
        txt('COMMIT', 510, commitY - 26, 26, ROLE.controller, 'mono', 'center').opacity(alpha),
      );

      // Column Headers
      nodes.push(
        txt('FILE 1: pre-commit', f1X, -268, 28, ROLE.fail, 'mono', 'center').opacity(alpha),
        txt('FILE 2: post-commit', f2X, -268, 28, ROLE.sure, 'mono', 'center').opacity(alpha),
      );

      // Paired transaction rows in File 1 (hover cleanly above commitY, then roll back when fault1Prog > 0.5)
      const f1RowY = -104 + 26 * Math.sin(fault1Prog.value * Math.PI);
      const f1Alive = Math.max(0.25, 1 - Math.max(0, fault1Prog.value - 0.45) * 1.4);
      if (showPaired.value > 0.05) {
        const pa = showPaired.value * alpha;
        nodes.push(
          glowPill(
            `ledger: ${OP.key}`,
            f1X,
            f1RowY - 34,
            fault1Prog.value > 0.5 ? ROLE.fail : ROLE.op,
            {
              size: 26,
              alpha: pa * f1Alive,
            },
          ),
          glowPill(
            `job: ${OP.job}`,
            f1X,
            f1RowY + 26,
            fault1Prog.value > 0.5 ? ROLE.fail : ROLE.sure,
            {
              size: 26,
              alpha: pa * f1Alive,
            },
          ),
        );
      }
      if (fault1Prog.value > 0.45) {
        nodes.push(
          glowCross(f1X, commitY - 22, 34, ROLE.fail, fault1Prog.value * alpha),
          txt('rolled back', f1X, -214, 26, ROLE.fail, 'mono', 'center').opacity(
            fault1Prog.value * alpha,
          ),
        );
      }

      // Paired transaction rows in File 2: cleanly hand off across commitY via a crossing photon (never dragging text through COMMIT line!)
      if (showPaired.value > 0.05) {
        const pa = showPaired.value * alpha;
        if (fault2Prog.value < 0.45) {
          const topFade = Math.max(0, 1 - fault2Prog.value / 0.45);
          nodes.push(
            glowPill(`ledger: ${OP.key}`, f2X, -138, ROLE.op, { size: 26, alpha: pa * topFade }),
            glowPill(`job: ${OP.job}`, f2X, -78, ROLE.sure, { size: 26, alpha: pa * topFade }),
          );
        } else if (fault2Prog.value > 0.55) {
          const botFade = Math.min(1, (fault2Prog.value - 0.55) / 0.35);
          nodes.push(
            glowPill(`ledger: ${OP.key}`, f2X, 118, ROLE.sure, { size: 26, alpha: pa * botFade }),
            glowPill(`job: ${OP.job}`, f2X, 178, ROLE.sure, { size: 26, alpha: pa * botFade }),
          );
        } else {
          const crossY = -70 + ((fault2Prog.value - 0.45) / 0.1) * 190;
          nodes.push(glowDot(f2X, crossY, { radius: 13, color: ROLE.sure, glow: 16, opacity: pa }));
        }
      }
      if (noReply.value > 0.4) {
        nodes.push(
          glowCross(f2X, commitY - 48, 30, ROLE.fail, noReply.value * alpha),
          txt('reply dropped', f2X, -214, 26, ROLE.mark, 'mono', 'center').opacity(
            noReply.value * alpha,
          ),
        );
      }

      // Reopened lookup readouts at bottom of File 1 & File 2 (strictly withheld until first-file / second-file!)
      const readY = 278;
      if (revealFile1.value > 0.5) {
        nodes.push(
          glowPill('lookup -> None', f1X, readY, ROLE.fail, {
            size: 28,
            alpha: revealFile1.value * alpha,
          }),
        );
      } else if (reopen.value > 0.3 || askReads.value > 0.3) {
        nodes.push(
          glowPill('lookup -> ?', f1X, readY, ROLE.mark, {
            size: 28,
            alpha: Math.max(reopen.value, askReads.value) * alpha * (0.75 + 0.25 * pulse),
          }),
        );
      }

      if (revealFile2.value > 0.5) {
        nodes.push(
          glowPill(`${OP.job}, ${OP.state}`, f2X, readY, ROLE.sure, {
            size: 28,
            alpha: revealFile2.value * alpha,
          }),
        );
      } else if (reopen.value > 0.3 || askReads.value > 0.3) {
        nodes.push(
          glowPill('lookup -> ?', f2X, readY, ROLE.mark, {
            size: 28,
            alpha: Math.max(reopen.value, askReads.value) * alpha * (0.75 + 0.25 * pulse),
          }),
        );
      }

      // Prompt or takeaway caption at bottom center
      const capY = 358;
      if (workerNote.value > 0.5) {
        nodes.push(
          txt(
            'Primary read proves one queue entry; completion needs a worker result.',
            0,
            capY,
            27,
            ROLE.sure,
            'sans',
            'center',
          ).opacity(workerNote.value * alpha),
        );
      } else if (askReads.value > 0.5 && revealFile1.value < 0.5) {
        nodes.push(
          txt(
            'Reopen both files with the saved key. What will each return?',
            0,
            capY,
            30,
            ROLE.mark,
            'serif',
            'center',
          )
            .glow(6, ROLE.mark)
            .opacity(askReads.value * alpha),
        );
      } else {
        nodes.push(
          txt(
            'One SQLite transaction pairs the operation ledger row with the queued job.',
            0,
            capY,
            27,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      nodes.push(
        lowerFooter(
          'ONE ATOMIC TRANSACTION: LEDGER + JOB',
          revealFile2.value > 0.5
            ? 'FILE 1: NONE · FILE 2: JOB-1 QUEUED'
            : 'SAME SILENT TIMEOUT · DIFFERENT COMMIT SIDE',
          { accent: revealFile2.value > 0.5 ? ROLE.sure : ROLE.controller, alpha },
        ),
      );

      // Subtle glowing beacon dots on commit line
      nodes.push(
        glowDot(185 + 670 * ((amb.value * 2) % 1), commitY, {
          radius: 5,
          color: ROLE.agent,
          glow: 9,
          opacity: 0.65 * alpha,
        }),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.controller, ROLE.sure), scene3d, title, layer);

  orbitScene(s, c, scene3d, { theta: -0.08, phi: 0.96 });

  playCue(s, c, 'atomic-records', (d) => s.play(showPaired.to(0.5, { duration: d })), {
    dur: 0.45,
  });
  playCue(s, c, 'paired-writes', (d) => s.play(showPaired.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'binds', (d) => s.play(showPaired.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'before-commit-fault', (d) => s.play(fault1Prog.to(1, { duration: d })), {
    dur: 0.8,
  });
  playCue(s, c, 'after-commit-fault', (d) => s.play(fault2Prog.to(1, { duration: d })), {
    dur: 0.9,
  });
  playCue(s, c, 'no-reply', (d) => s.play(noReply.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'failure-point', (d) => s.play(noReply.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'open-files', (d) => s.play(reopen.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'predict-reads', (d) => s.play(askReads.to(1, { duration: d })), { dur: 0.45 });
  // Strict prediction withholding: reveal File 1 and File 2 ONLY AFTER spoken!
  playCue(s, c, 'first-file', (d) => s.play(revealFile1.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'second-file', (d) => s.play(revealFile2.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'worker-proof', (d) => s.play(workerNote.to(1, { duration: d })), { dur: 0.45 });
}
