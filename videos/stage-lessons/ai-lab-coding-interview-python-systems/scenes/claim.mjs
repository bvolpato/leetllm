// Scene 3: claim - "Where can a second worker enter?"
// Signature 3D orbiting atomic lock chamber (`buildLockChamber3d`, `wireframeSlab3d`, `curve3d`)
// paired with live Python claim spotlight and strict Barrier(2) prediction withholding!
import { line, rect } from 'vizmatic/stage';
import {
  CLAIM_LINES,
  COSMOS,
  ROLE,
  buildLockChamber3d,
  cinemaAtmosphere,
  codeSpotlight,
  glowDot,
  glowPill,
  guardedDynamic,
  hexAlpha,
  lowerFooter,
  orbitScene,
  playCue,
  sceneHeading,
  txt,
} from '../parts.mjs';

export default function claim(s, c) {
  const title = sceneHeading(['Where can a second', 'worker enter?'], { accent: ROLE.focus });

  const lockActive = s.value(0);
  const activeLines = s.value(0); // 0=none, 1=enter(1,2), 2=insert(4), 3=fetch(6), 4=skip(2,3), 5=verdict(1..4)
  const seenClaimed = s.value(0);
  const fetchProg = s.value(0);
  const bSkipped = s.value(0);
  const barrierMode = s.value(0);
  const verdictShown = s.value(0); // STRICTLY AFTER 'claim-verdict'!

  const view3d = buildLockChamber3d(lockActive, { x: 430, y: -115 });

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const mode = Math.round(activeLines.value);
      const lineSet =
        mode === 1
          ? [1, 2]
          : mode === 2
            ? [4]
            : mode === 3
              ? [6]
              : mode === 4
                ? [2, 3]
                : mode === 5
                  ? [1, 2, 3, 4]
                  : [];
      const lineCol =
        mode === 3 ? ROLE.workerA : mode === 4 ? ROLE.workerB : mode === 5 ? ROLE.ok : ROLE.focus;

      const nodes = [
        // Left: Python atomic claim code spotlight
        codeSpotlight(CLAIM_LINES, -825, -215, {
          lineH: 50,
          size: 27,
          activeLines: lineSet,
          activeColor: lineCol,
          beamW: 660,
          alpha,
        }),
      ];

      if (barrierMode.value < 0.5) {
        // Right bottom: Clean timeline bars below the orbiting 3D lock chamber
        const tx0 = 20;
        const tx1 = 835;
        const xOf = (u) => tx0 + (tx1 - tx0) * u;
        const yA = 135;
        const yB = 225;

        nodes.push(
          txt('3D ATOMIC LOCK CHAMBER', 430, -325, 26, ROLE.focus, 'mono', 'center').opacity(alpha),
          txt('A', -28, yA, 28, ROLE.workerA, 'mono', 'center').opacity(alpha),
          txt('B', -28, yB, 28, ROLE.workerB, 'mono', 'center').opacity(alpha),
          line([tx0, yA], [tx1, yA], { stroke: '#263455', width: 3 }).opacity(alpha),
          line([tx0, yB], [bSkipped.value > 0.05 ? xOf(0.64) : tx1, yB], {
            stroke: '#263455',
            width: 3,
          }).opacity(alpha),
        );

        // A lock bar [0..0.28]
        if (lockActive.value > 0.1) {
          const w = Math.max(210, (xOf(0.3) - xOf(0)) * Math.min(1, lockActive.value));
          nodes.push(
            rect(w, 44, { radius: 8, fill: COSMOS.bg, stroke: null }).at(tx0 + w / 2, yA),
            rect(w, 44, {
              radius: 8,
              fill: hexAlpha(ROLE.focus, 0.28 * alpha),
              stroke: ROLE.focus,
              width: 2.5,
            })
              .at(tx0 + w / 2, yA)
              .glow(8, ROLE.focus),
            txt('lock + claim', tx0 + w / 2, yA, 26, ROLE.focus, 'mono', 'center').opacity(
              Math.min(1, lockActive.value) * alpha,
            ),
          );
        }

        // A fetch outside lock [0.34..0.98]
        if (fetchProg.value > 0.05) {
          const fx0 = xOf(0.34);
          const fw = (xOf(0.98) - fx0) * fetchProg.value;
          nodes.push(
            rect(fw, 44, { radius: 8, fill: COSMOS.bg, stroke: null }).at(fx0 + fw / 2, yA),
            rect(fw, 44, {
              radius: 8,
              fill: hexAlpha(ROLE.workerA, 0.26 * alpha),
              stroke: ROLE.workerA,
              width: 2.5,
            })
              .at(fx0 + fw / 2, yA)
              .glow(7, ROLE.workerA),
          );
          if (fw > 340) {
            nodes.push(
              txt('fetch outside lock', fx0 + fw / 2, yA, 26, COSMOS.ink, 'mono', 'center').opacity(
                alpha,
              ),
            );
          }
        }

        // B lock & skip [0.36..0.60]
        if (bSkipped.value > 0.1) {
          const bx0 = xOf(0.36);
          const bw = Math.max(120, (xOf(0.6) - bx0) * bSkipped.value);
          nodes.push(
            rect(bw, 44, { radius: 8, fill: COSMOS.bg, stroke: null }).at(bx0 + bw / 2, yB),
            rect(bw, 44, {
              radius: 8,
              fill: hexAlpha(ROLE.workerB, 0.24 * alpha),
              stroke: ROLE.workerB,
              width: 2.4,
            }).at(bx0 + bw / 2, yB),
            txt('lock', bx0 + bw / 2, yB, 26, ROLE.workerB, 'mono', 'center').opacity(
              bSkipped.value * alpha,
            ),
            glowPill('skip fetch', xOf(0.82), yB, ROLE.workerB, {
              size: 26,
              fixedW: 225,
              alpha: bSkipped.value * alpha,
              glow: 8,
            }),
          );
        }

        // Shared set & call log pills on lower-left
        const seenStr = seenClaimed.value > 0.5 ? 'seen = {"/guide"}' : 'seen = set()';
        const callStr = fetchProg.value > 0.2 ? 'calls = ["/guide"]' : 'calls = []';
        nodes.push(
          glowPill(seenStr, -660, 225, seenClaimed.value > 0.5 ? ROLE.ok : ROLE.focus, {
            size: 27,
            fixedW: 365,
            alpha,
          }),
          glowPill(callStr, -270, 225, fetchProg.value > 0.2 ? ROLE.workerA : COSMOS.muted, {
            size: 27,
            fixedW: 365,
            alpha,
          }),
          txt(
            bSkipped.value > 0.5
              ? 'Lock only guards the set check-and-insert, never the slow network fetch.'
              : 'Check and insert happen together inside one short lock turn.',
            0,
            345,
            27,
            bSkipped.value > 0.5 ? ROLE.ok : COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else {
        // Barrier(2) concurrency test on fresh URL /docs (strict verdict withholding!)
        const ba = barrierMode.value * alpha;
        const showV = verdictShown.value > 0.5;
        nodes.push(
          txt('CONCURRENT BARRIER TEST', 430, -325, 26, ROLE.focus, 'mono', 'center').opacity(ba),
          glowPill('fresh URL:  /docs', 430, 120, ROLE.workerB, {
            size: 28,
            fixedW: 390,
            alpha: ba,
          }),
          glowPill('threading.Barrier(2)', 430, 210, ROLE.focus, {
            size: 28,
            fixedW: 430,
            alpha: ba,
            glow: 11,
          }),
          glowDot(245, 210, {
            radius: 8,
            color: ROLE.workerA,
            glow: 10,
            opacity: ba,
          }),
          glowDot(615, 210, {
            radius: 8,
            color: ROLE.workerB,
            glow: 10,
            opacity: ba,
          }),
          glowPill(
            showV ? 'sorted(results) == [False, True]' : 'sorted(results) == ?',
            0,
            340,
            showV ? ROLE.ok : ROLE.focus,
            {
              size: 30,
              fixedW: 680,
              alpha: ba,
              glow: showV ? 14 : 8,
            },
          ),
        );
      }

      nodes.push(
        lowerFooter(
          'ATOMIC CLAIM UNDER SHORT LOCK',
          verdictShown.value > 0.5
            ? 'EXACTLY ONE WINNER: [False, True]'
            : barrierMode.value > 0.5
              ? 'EITHER THREAD MAY WIN'
              : 'FETCH RUNS OUTSIDE LOCK',
          { accent: verdictShown.value > 0.5 ? ROLE.ok : ROLE.focus, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.focus, ROLE.workerA), title, view3d, layer);
  orbitScene(s, c, view3d, { theta: -0.32, phi: 0.96 });

  playCue(
    s,
    c,
    'claim-enter',
    (d) => s.play(lockActive.to(0.6, { duration: d }), activeLines.to(1, { duration: 0.1 })),
    { dur: 0.45 },
  );
  playCue(
    s,
    c,
    'claim-insert',
    (d) => s.play(seenClaimed.to(1, { duration: d }), activeLines.to(2, { duration: 0.1 })),
    { after: true, dur: 0.35 },
  );
  playCue(s, c, 'claim-release', (d) => s.play(lockActive.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(
    s,
    c,
    'claim-slow',
    (d) => s.play(fetchProg.to(1, { duration: d }), activeLines.to(3, { duration: 0.1 })),
    { after: true, dur: 0.7 },
  );
  playCue(
    s,
    c,
    'claim-skip',
    (d) => s.play(bSkipped.to(1, { duration: d }), activeLines.to(4, { duration: 0.1 })),
    { after: true, dur: 0.55 },
  );
  playCue(s, c, 'claim-barrier', (d) => s.play(barrierMode.to(1, { duration: d })), { dur: 0.4 });
  // Strict withholding: reveal [False, True] ONLY AFTER 'claim-verdict'!
  playCue(
    s,
    c,
    'claim-verdict',
    (d) => s.play(verdictShown.to(1, { duration: d }), activeLines.to(5, { duration: 0.1 })),
    { after: true, dur: 0.35 },
  );
}
