// Scene 08 (teardown-lifecycle): "Who owns slot A now?"
// Ephemeral Slot A timeline + orphan child process constellation + generation-fenced reaper.
import {
  COSMOS,
  NEXT_WORKER_ID,
  ROLE,
  WORKER_ID,
  cinemaAtmosphere,
  cleanupFixture,
  crossSwap,
  glowArrow,
  glowDot,
  glowRing,
  guardedDynamic,
  heroTitle,
  line,
  lumBar,
  rule,
  tweenCue,
  txt,
  verifyInvariant,
} from '../parts.mjs';

export default function teardownLifecycle(s, c) {
  const cleanup = cleanupFixture();
  verifyInvariant(cleanup.lateOld.status === 'running', 'stale g7 leaves g8 running');
  verifyInvariant(cleanup.reusable.status === 'reusable', 'reset completes to reusable');

  // Process tree states
  const mountVis = s.value(0);
  const childHot = s.value(0);
  const parentAlive = s.value(1);
  const childrenAlive = s.value(1);
  const mountAlive = s.value(1);

  // Lease & status states (0=running, 1=cancel-req, 2=quarantined, 3=terminated, 4=reusable, 5=g8 running)
  const slotState = s.value(0);
  const showLeaseId = s.value(0);
  const showLeaseGen = s.value(0);
  const showLifetime = s.value(0);
  const supAlive = s.value(1);
  const showReaper = s.value(0);
  const termVerified = s.value(0);
  const resetVerified = s.value(0);
  const g8Grow = s.value(0);
  const showLate = s.value(0);
  const lateAimOld = s.value(0);

  // Lower-right non-overlapping readout vs prediction/verdict modes
  const modeStatus = s.value(1);
  const modeAsk = s.value(0);
  const modeWrong = s.value(0);
  const modeGuard = s.value(0);
  const modeNoop = s.value(0);

  const bgAtmo = cinemaAtmosphere(ROLE.host, ROLE.candidate);
  const title = heroTitle(['Who Owns', 'Slot A Now?'], {
    x: -860,
    y: -445,
    size: 48,
    lineHeight: 56,
    accent: ROLE.host,
    eyebrow: 'TEARDOWN & GENERATION FENCING',
  });

  const live = guardedDynamic(s.value(1), () => {
    const nodes = [];

    // === TOP RIBBON: Slot A Timeline (g7 -> checks -> g8) ===
    const tLeft = -320;
    const tW = 1170;
    const tY = -362;
    const tx = (f) => tLeft + f * tW;

    nodes.push(
      txt('SLOT A TIMELINE', tLeft, tY - 58, 26, ROLE.host, 'mono', 'left'),
      lumBar(tLeft + tW * 0.5, tY, tW, 64, {
        color: COSMOS.rule,
        fillOpacity: 0.2,
        strokeWidth: 2,
        glow: 0,
      }),
      // Generation 7 span [0.02..0.48]
      lumBar((tx(0.02) + tx(0.48)) * 0.5, tY, tx(0.48) - tx(0.02), 50, {
        color: ROLE.candidate,
        fillOpacity: resetVerified.value > 0.5 ? 0.14 : 0.34,
        strokeWidth: 2.2,
        glow: resetVerified.value > 0.5 ? 3 : 9,
      }),
      txt(WORKER_ID, (tx(0.02) + tx(0.48)) * 0.5, tY, 28, ROLE.candidate, 'mono').opacity(
        resetVerified.value > 0.5 ? 0.5 : 1,
      ),
    );

    if (showLifetime.value > 0.02) {
      nodes.push(
        line([tx(0.48), tY - 42], [tx(0.48), tY + 42], { stroke: ROLE.host, width: 4 })
          .glow(8, ROLE.host)
          .opacity(showLifetime.value),
        txt('max lifetime', tx(0.48), tY + 62, 26, ROLE.host, 'mono').opacity(
          showLifetime.value * (1 - showLate.value),
        ),
      );
    }

    if (termVerified.value > 0.02) {
      nodes.push(
        glowDot(tx(0.525), tY, {
          radius: 9,
          color: ROLE.pass,
          glow: 12,
          opacity: termVerified.value,
        }),
      );
    }
    if (resetVerified.value > 0.02) {
      nodes.push(
        glowDot(tx(0.565), tY, {
          radius: 9,
          color: ROLE.pass,
          glow: 12,
          opacity: resetVerified.value,
        }),
      );
    }

    if (g8Grow.value > 0.02) {
      const w8 = Math.max(8, (tx(0.98) - tx(0.6)) * g8Grow.value);
      nodes.push(
        lumBar(tx(0.6) + w8 * 0.5, tY, w8, 50, {
          color: ROLE.pass,
          fillOpacity: 0.32,
          strokeWidth: 2.4,
          glow: 10,
        }),
      );
      if (g8Grow.value > 0.75) {
        nodes.push(
          txt(NEXT_WORKER_ID, (tx(0.6) + tx(0.98)) * 0.5, tY, 28, ROLE.pass, 'mono').opacity(
            (g8Grow.value - 0.75) * 4,
          ),
        );
      }
    }

    if (showLate.value > 0.02) {
      const aimX = tx(0.79) + (tx(0.25) - tx(0.79)) * lateAimOld.value;
      nodes.push(
        glowArrow([aimX, tY + 86], [aimX, tY + 34], ROLE.mark, {
          width: 4,
          tip: 12,
          opacity: showLate.value,
        }),
        txt(
          `late cleanup (${cleanup.old.runtimeId})`,
          aimX,
          tY + 112,
          26,
          ROLE.mark,
          'mono',
        ).opacity(showLate.value),
      );
    }

    // === MIDDLE LEASE BAR ===
    const leaseY = -182;
    const stateIdx = Math.round(slotState.value);
    const stateMeta = [
      ['running', ROLE.candidate],
      ['cancellation-requested', ROLE.warn],
      ['quarantined', ROLE.mark],
      ['terminated', ROLE.host],
      ['reusable', ROLE.pass],
      ['g8 running', ROLE.pass],
    ][stateIdx] ?? ['running', ROLE.candidate];

    nodes.push(
      txt('EXTERNAL LEASE RECORD:', -860, leaseY, 26, COSMOS.muted, 'mono', 'left'),
      txt('SLOT STATE:', 140, leaseY, 26, COSMOS.muted, 'mono', 'left'),
      lumBar(540, leaseY, 440, 50, {
        color: stateMeta[1],
        fillOpacity: 0.18,
        strokeWidth: 2.2,
        glow: 9,
      }),
      txt(stateMeta[0], 540, leaseY, 26, stateMeta[1], 'mono'),
    );
    if (showLeaseId.value > 0.02) {
      nodes.push(
        txt(cleanup.old.runtimeId, -470, leaseY, 28, ROLE.host, 'mono', 'left')
          .glow(6, ROLE.host)
          .opacity(showLeaseId.value),
      );
    }
    if (showLeaseGen.value > 0.02) {
      nodes.push(
        txt(`gen ${cleanup.old.generation}`, -175, leaseY, 28, ROLE.mark, 'mono', 'left')
          .glow(6, ROLE.mark)
          .opacity(showLeaseGen.value),
      );
    }

    // === LOWER LEFT: Job Process Tree Constellation ===
    const jx = -860;
    const jy = -82;
    nodes.push(
      txt(`JOB PROCESS TREE  /  ${WORKER_ID}`, jx, jy, 26, ROLE.candidate, 'mono', 'left'),
      rule(jx, jy + 24, -40, jy + 24, ROLE.candidate, 2),
    );
    const pPos = [-745, 145];
    const cYs = [25, 145, 265];
    const cX = -530;
    const pOp = 0.22 + 0.78 * parentAlive.value;
    const cOp = 0.22 + 0.78 * childrenAlive.value;

    cYs.forEach((cy, idx) => {
      nodes.push(
        line(pPos, [cX, cy], { stroke: COSMOS.dim, width: 2.5 }).opacity(cOp * 0.8),
        glowRing(cX, cy, 24, childHot.value > 0.4 ? ROLE.mark : ROLE.candidate, {
          fillOpacity: 0.22,
          opacity: cOp,
        }),
        txt(`child ${idx + 1}`, cX + 40, cy, 26, ROLE.candidate, 'mono', 'left').opacity(cOp),
      );
    });
    nodes.push(
      glowRing(pPos[0], pPos[1], 32, ROLE.candidate, { fillOpacity: 0.28, opacity: pOp }),
      txt('parse.py', pPos[0], pPos[1] + 58, 26, ROLE.candidate, 'mono').opacity(pOp),
    );
    if (mountVis.value > 0.02) {
      const mOp = mountVis.value * (0.25 + 0.75 * mountAlive.value);
      nodes.push(
        lumBar(-165, 312, 245, 52, {
          color: ROLE.warn,
          fillOpacity: 0.16,
          strokeWidth: 2,
          opacity: mOp,
        }),
        txt('scratch files', -165, 312, 26, ROLE.warn, 'mono').opacity(mOp),
      );
    }

    // === LOWER RIGHT: Status Readout -> Prediction -> Immutable ID Guard ===
    const rx = 50;
    nodes.push(
      txt('REAPER & SLOT VERIFICATION', rx, jy, 26, ROLE.host, 'mono', 'left'),
      rule(rx, jy + 24, 855, jy + 24, ROLE.host, 2),
    );

    if (modeStatus.value > 0.02) {
      const m = modeStatus.value;
      const aliveCount = (parentAlive.value > 0.5 ? 1 : 0) + (childrenAlive.value > 0.5 ? 3 : 0);
      nodes.push(
        txt('supervisor', rx, jy + 78, 28, ROLE.host, 'mono', 'left').opacity(
          m * (0.3 + 0.7 * supAlive.value),
        ),
        txt('processes left in job:', rx, jy + 150, 28, COSMOS.muted, 'sans', 'left').opacity(m),
        txt(
          String(aliveCount),
          rx + 360,
          jy + 150,
          44,
          aliveCount === 0 ? ROLE.pass : ROLE.candidate,
          'mono',
          'left',
        )
          .glow(10, aliveCount === 0 ? ROLE.pass : ROLE.candidate)
          .opacity(m),
      );
      if (showReaper.value > 0.02) {
        nodes.push(
          txt('independent reaper active', rx + 250, jy + 78, 28, ROLE.mark, 'mono', 'left')
            .glow(6, ROLE.mark)
            .opacity(m * showReaper.value),
        );
      }
      if (termVerified.value > 0.02) {
        nodes.push(
          glowDot(rx + 12, jy + 230, {
            radius: 8,
            color: ROLE.pass,
            opacity: m * termVerified.value,
          }),
          txt(
            'process tree empty (0 remaining)',
            rx + 38,
            jy + 230,
            28,
            ROLE.pass,
            'sans',
            'left',
          ).opacity(m * termVerified.value),
        );
      } else if (stateIdx === 2) {
        nodes.push(
          txt(
            'outcome unknown -> quarantine slot A',
            rx,
            jy + 230,
            28,
            ROLE.mark,
            'sans',
            'left',
          ).opacity(m),
        );
      }
      if (resetVerified.value > 0.02) {
        nodes.push(
          glowDot(rx + 12, jy + 296, {
            radius: 8,
            color: ROLE.pass,
            opacity: m * resetVerified.value,
          }),
          txt(
            'baseline files, mounts & handles reset',
            rx + 38,
            jy + 296,
            28,
            ROLE.pass,
            'sans',
            'left',
          ).opacity(m * resetVerified.value),
        );
      }
    }

    if (modeAsk.value > 0.02) {
      nodes.push(
        txt(
          'If reaper looks up slot A by name,',
          rx,
          jy + 115,
          34,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(modeAsk.value),
        txt('which worker would it select?', rx, jy + 175, 42, ROLE.mark, 'serif', 'left')
          .glow(8, ROLE.mark)
          .opacity(modeAsk.value),
      );
    }
    if (modeWrong.value > 0.02) {
      nodes.push(
        lumBar(rx + 360, jy + 150, 720, 82, {
          color: ROLE.candidate,
          fillOpacity: 0.18,
          strokeWidth: 2.5,
          glow: 10,
          opacity: modeWrong.value,
        }),
        txt(
          `slot A -> ${cleanup.newer.runtimeId}  (wrong worker!)`,
          rx + 360,
          jy + 150,
          30,
          ROLE.candidate,
          'mono',
        ).opacity(modeWrong.value),
      );
    }
    if (modeGuard.value > 0.02) {
      nodes.push(
        txt('IMMUTABLE ID + GENERATION GUARD', rx, jy + 100, 26, ROLE.host, 'mono', 'left').opacity(
          modeGuard.value,
        ),
        txt(
          `recorded gen ${cleanup.old.generation}  ==  current gen ${cleanup.newer.generation} ?`,
          rx,
          jy + 168,
          34,
          ROLE.mark,
          'mono',
          'left',
        )
          .glow(8, ROLE.mark)
          .opacity(modeGuard.value),
      );
    }
    if (modeNoop.value > 0.02) {
      nodes.push(
        lumBar(rx + 360, jy + 155, 720, 84, {
          color: ROLE.pass,
          fillOpacity: 0.18,
          strokeWidth: 2.5,
          glow: 10,
          opacity: modeNoop.value,
        }),
        txt(
          '7 != 8  ->  0 slot records changed',
          rx + 360,
          jy + 155,
          32,
          ROLE.pass,
          'mono',
        ).opacity(modeNoop.value),
      );
    }

    return nodes;
  });

  s.add(bgAtmo, title, live);

  // Beat 0: parent stops, 3 children remain
  c.on('td-children', () => {
    s.play(mountVis.to(1, { duration: 0.35 }), childHot.to(1, { duration: 0.45 }));
  });
  tweenCue(s, c, 'td-cancel', slotState, 1, { duration: 0.3, after: true });
  tweenCue(s, c, 'td-stop', parentAlive, 0, { duration: 0.45 });
  tweenCue(s, c, 'td-gone', childHot, 1, { duration: 0.35 });

  // Beat 1: external lease, reaper, quarantine, termination confirmed
  tweenCue(s, c, 'td-identity', showLeaseId, 1, { duration: 0.35 });
  tweenCue(s, c, 'td-generation', showLeaseGen, 1, { duration: 0.35 });
  tweenCue(s, c, 'td-lifetime', showLifetime, 1, { duration: 0.35 });
  tweenCue(s, c, 'td-contact', supAlive, 0, { duration: 0.4 });
  tweenCue(s, c, 'td-reaper', showReaper, 1, { duration: 0.35 });
  tweenCue(s, c, 'td-quarantine', slotState, 2, { duration: 0.3 });
  c.after('td-terminated', () => {
    s.play(
      childrenAlive.to(0, { duration: 0.4 }),
      termVerified.to(1, { duration: 0.35 }),
      slotState.to(3, { duration: 0.3 }),
    );
  });

  // Beat 2: reset verified -> g8 admitted -> late g7 arrives -> prediction
  c.on('td-reset', () => {
    s.play(mountAlive.to(0, { duration: 0.4 }));
  });
  c.after('td-reset', () => {
    s.play(resetVerified.to(1, { duration: 0.35 }), slotState.to(4, { duration: 0.3 }));
  });
  tweenCue(s, c, 'td-eight', g8Grow, 1, { duration: 0.85 });
  tweenCue(s, c, 'td-eight', slotState, 5, { duration: 0.3, after: true });
  tweenCue(s, c, 'td-old', showLate, 1, { duration: 0.35 });
  crossSwap(s, c, 'td-ask', modeStatus, modeAsk, { duration: 0.4 });

  // Beat 3: wrong target -> immutable ID + generation guard -> 0 rows changed
  crossSwap(s, c, 'td-wrong', modeAsk, modeWrong, { duration: 0.4, after: true });
  tweenCue(s, c, 'td-seven', lateAimOld, 1, { duration: 0.9 });
  crossSwap(s, c, 'td-guard', modeWrong, modeGuard, { duration: 0.4 });
  crossSwap(s, c, 'td-noop', modeGuard, modeNoop, { duration: 0.4, after: true });
}
