// Scene 18: lock-order - "Who releases A when the next lookup fails?"
// Signature 3D Lock Chamber (`buildLockChamber3d`, `wireframeSlab3d`, `orbitScene`) + live Python ExitStack
// code spotlight tracing sort -> dedup -> acquire A -> KeyError on unknown -> automatic ExitStack unwind!
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  EXITSTACK_LINES,
  ROLE,
  ambientClock,
  buildLockChamber3d,
  cinemaAtmosphere,
  codeSpotlight,
  glowCross,
  glowDot,
  glowPill,
  guardedDynamic,
  lowerFooter,
  orbitScene,
  playCue,
  sceneHeading,
  txt,
} from '../parts.mjs';

export default function lockOrder(s, c) {
  const title = sceneHeading(['Who releases A when the', 'next lookup fails?'], {
    accent: ROLE.ok,
  });

  const amb = ambientClock(s, c);
  const lockActive = s.value(0);
  // Step 0=raw [B, A, A], 1=sorted [A, A, B], 2=deduped [A, B],
  // 3=try [A, unknown], 4=A locked & registered in ExitStack, 5=KeyError on unknown!,
  // 6=ExitStack unwinds & unlocks A, 7=spotlight A unlocked for next transfer
  const step = s.value(0);

  const view3d = buildLockChamber3d(lockActive, { x: 470, y: -120 });

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const pulse = 0.5 + 0.5 * Math.sin(amb.value * Math.PI * 10);
      const st = Math.round(step.value);
      const activeCode =
        st === 1 || st === 2 ? [1] : st === 4 ? [0, 3] : st === 5 ? [2] : st >= 6 ? [0] : [];
      const codeCol = st === 5 ? ROLE.fail : st >= 6 ? ROLE.ok : ROLE.focus;

      const nodes = [
        txt('3D ACCOUNT LOCK ORDER', 470, -322, 26, ROLE.focus, 'mono', 'center').opacity(alpha),

        // Left: Live Python ExitStack spotlight
        codeSpotlight(EXITSTACK_LINES, -830, -215, {
          lineH: 58,
          size: 27,
          activeLines: activeCode,
          activeColor: codeCol,
          beamW: 795,
          alpha,
        }),
      ];

      // Right-lower & Left-lower: Live Lock Table / Stack State
      const rows =
        st === 0
          ? [
              { id: 'B', state: 'unlocked', col: ROLE.workerB },
              { id: 'A', state: 'unlocked', col: ROLE.workerA },
              { id: 'A (dup)', state: 'duplicate!', col: ROLE.warn },
            ]
          : st === 1
            ? [
                { id: 'A', state: 'sorted 1st', col: ROLE.ok },
                { id: 'A (dup)', state: 'duplicate!', col: ROLE.warn },
                { id: 'B', state: 'sorted 2nd', col: ROLE.workerB },
              ]
            : st === 2
              ? [
                  { id: 'A', state: 'unlocked', col: ROLE.ok },
                  { id: 'B', state: 'unlocked', col: ROLE.workerB },
                ]
              : [
                  {
                    id: 'A',
                    state:
                      st === 4 || st === 5
                        ? 'LOCKED (in stack)'
                        : st >= 6
                          ? 'UNLOCKED (released!)'
                          : 'unlocked',
                    col: st === 4 || st === 5 ? ROLE.focus : ROLE.ok,
                  },
                  {
                    id: 'unknown',
                    state: st >= 5 ? 'KeyError!' : 'pending lookup',
                    col: st >= 5 ? ROLE.fail : COSMOS.dim,
                  },
                ];

      // Draw rows cleanly across lower-right (x = 470)
      nodes.push(
        line([20, 68], [845, 68], { stroke: '#29375a', width: 2 }).opacity(alpha),
        txt('ACQUISITION ORDER', 175, 96, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt('LOCK STATE', 605, 96, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      );

      rows.forEach((r, idx) => {
        const ry = 152 + idx * 68;
        nodes.push(
          glowPill(r.id, 175, ry, r.col, { size: 26, fixedW: 260, alpha, glow: 6 }),
          glowPill(r.state, 605, ry, r.col, {
            size: 26,
            fixedW: 440,
            alpha,
            glow: (st === 7 && idx === 0) || st === 5 ? 13 : 6,
          }),
        );
      });

      if (st === 5) {
        nodes.push(glowCross(845, 220, 28, ROLE.fail, alpha));
      }

      // Left-lower ExitStack badge
      const stackText =
        st === 4 || st === 5
          ? 'ExitStack:  [ lock(A) ]'
          : st >= 6
            ? 'ExitStack:  []  (A cleanly released!)'
            : 'ExitStack:  empty';
      const stackCol = st === 4 || st === 5 ? ROLE.focus : st >= 6 ? ROLE.ok : COSMOS.muted;
      nodes.push(
        glowPill(stackText, -430, 195, stackCol, {
          size: 28,
          fixedW: 690,
          alpha,
          glow: st >= 6 ? 12 : 6,
        }),
      );

      // Bottom explanation
      const capText =
        st >= 7
          ? 'A is unlocked and ready for the next transfer because ExitStack registered it on acquire.'
          : st === 6
            ? 'ExitStack releases A on KeyError.'
            : st === 5
              ? 'Lookup of unknown raises KeyError while A is already locked!'
              : 'Sort and deduplicate account IDs globally so no two transfers deadlock or self-lock.';

      nodes.push(
        txt(
          capText,
          0,
          365,
          27,
          st >= 6 ? ROLE.ok : st === 5 ? ROLE.fail : COSMOS.ink,
          'sans',
          'center',
        ).opacity(alpha),
        glowDot(-855 + ((amb.value * 400) % 240), 422, {
          radius: 4.5 + 1.5 * pulse,
          color: st >= 6 ? ROLE.ok : ROLE.focus,
          glow: 8,
          opacity: 0.65 * alpha,
        }),
        lowerFooter(
          'GLOBAL LOCK ORDER + DEDUP + EXITSTACK CLEANUP',
          st >= 6 ? 'KEYERROR -> EXITSTACK RELEASES A' : 'sorted(set(ids)) PREVENTS DEADLOCK',
          { accent: st >= 6 ? ROLE.ok : ROLE.focus, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.ok, ROLE.focus), title, view3d, layer);
  orbitScene(s, c, view3d, { theta: -0.24, phi: 0.96 });

  playCue(s, c, 'ci-lock-order-0-build', () => s.play(step.to(0, { duration: 0.05 })), {
    dur: 0.1,
  });
  playCue(s, c, 'locks-order', () => s.play(step.to(1, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'locks-unique', () => s.play(step.to(2, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'ci-lock-order-1-build', () => s.play(step.to(3, { duration: 0.05 })), {
    dur: 0.1,
  });
  playCue(
    s,
    c,
    'locks-enter',
    (d) => s.play(step.to(4, { duration: 0.05 }), lockActive.to(1, { duration: d })),
    { dur: 0.4 },
  );
  playCue(s, c, 'locks-unknown', () => s.play(step.to(5, { duration: 0.05 })), { dur: 0.1 });
  playCue(
    s,
    c,
    'ci-lock-order-unwind',
    (d) => s.play(step.to(6, { duration: 0.05 }), lockActive.to(0, { duration: d })),
    { dur: 0.45 },
  );
  playCue(s, c, 'ci-lock-order-2-build', () => s.play(step.to(7, { duration: 0.05 })), {
    dur: 0.1,
  });
}
