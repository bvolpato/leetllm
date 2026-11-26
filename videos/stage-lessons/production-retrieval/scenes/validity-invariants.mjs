// Scene 04 (validity-invariants): "Attach validity to the exact source revision"
// Inclusive calendar boundary vs half-open logical interval [0, 20) / [20, inf) with live blue
// request photon jumping precisely at t = 20, MathJax disjointness formula, 3 invariant interlocks,
// and decoupled content-revision vs grant-revocation split.
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  callerTag,
  cinemaAtmosphere,
  glowArrow,
  glowDot,
  glowRing,
  glowTex,
  glowingTrail,
  heroTitle,
  lumBar,
  playCue,
  runPhase,
  statusPill,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function validityInvariants(s, c) {
  const phase = s.value(0);
  const datesLit = s.value(0);
  const checksFailed = s.value(0);
  const cursorJump = s.value(0); // 0 = at t=19 on v1, 1 = at t=20 on v2
  const halfOpenLit = s.value(0);
  const grantRevoked = s.value(0);

  const title = heroTitle(['Attach Validity to the', 'Exact Source Revision'], {
    x: -855,
    y: -440,
    size: 50,
    lineHeight: 60,
    accent: ROLE.policy,
    eyebrow: 'VALIDITY INVARIANTS · DISJOINT INTERVALS',
  });

  const formula = glowTex('[0, 20) \\cap [20, \\infty) = \\emptyset', {
    x: 455,
    y: -315,
    size: 40,
    color: ROLE.focus,
    glow: 7,
  });

  const live = dynamic(() => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const dl = datesLit.value;
    const cf = checksFailed.value;
    const cj = cursorJump.value;
    const ho = halfOpenLit.value;
    const gr = grantRevoked.value;

    const nodes = [callerTag(1)];

    // Left column: Inclusive calendar seam + 3 ingestion interlocks
    const leftX = -450;
    nodes.push(
      lumBar(leftX, -145, 810, 156, {
        color: dl > 0.3 ? ROLE.focus : ROLE.policy,
        fillAlpha: 0.08 + dl * 0.08,
        strokeWidth: 2.2 + dl,
        glow: 7 + dl * 5,
        radius: 14,
      }),
      txt('INCLUSIVE CALENDAR CONTRACT', -825, -192, 26, ROLE.policy, 'mono', 'left'),
      txt('v1 ends  2026-03-31', -825, -138, 28, ROLE.session, 'mono', 'left'),
      txt('v2 begins  2026-04-01', -445, -138, 28, ROLE.admitted, 'mono', 'left'),
    );

    // 3 invariant interlocks (duplicate chunk IDs, reversed dates, dual active)
    const interlocks = [
      'Duplicate chunk IDs',
      'Reversed date ranges',
      'Two active versions in 1 scope',
    ];
    nodes.push(txt('INGESTION INVARIANT GATES', -855, -18, 26, COSMOS.muted, 'mono', 'left'));
    interlocks.forEach((label, i) => {
      const iy = 42 + i * 74;
      const col = cf > 0.3 ? ROLE.danger : COSMOS.muted;
      nodes.push(
        lumBar(leftX, iy, 780, 56, {
          color: col,
          fillAlpha: 0.07 + cf * 0.1,
          strokeWidth: 2.0,
          glow: cf * 8,
          radius: 10,
        }),
        txt(label, -825, iy, 28, COSMOS.ink, 'sans', 'left'),
        txt(cf > 0.4 ? 'REJECTED' : 'CHECK', -105, iy, 26, col, 'mono', 'right').glow(
          cf > 0.4 ? 7 : 0,
          col,
        ),
      );
    });

    // Right column: Half-open logical time tracks v1 [0, 20) and v2 [20, inf)
    const axL = 40;
    const axR = 820;
    const xSplit = axL + (axR - axL) * 0.5;
    const yV1 = -90;
    const yV2 = 85;
    const onV2 = cj > 0.5;

    nodes.push(
      txt('HALF-OPEN LOGICAL TIME', axL, -185, 26, COSMOS.muted, 'mono', 'left'),
      txt(
        onV2 ? 'ACTIVE AT t = 20:  v2' : 'ACTIVE AT t = 19:  v1',
        axR,
        -185,
        26,
        onV2 ? ROLE.policy : ROLE.session,
        'mono',
        'right',
      ).glow(6, onV2 ? ROLE.policy : ROLE.session),
      // Vertical dashed seam at t = 20
      line([xSplit, yV1 - 45], [xSplit, yV2 + 55], {
        stroke: ROLE.focus,
        width: 2.2,
        dash: [8, 6],
      }).opacity(0.65),
      txt('t = 20', xSplit, yV2 + 86, 26, ROLE.focus, 'mono', 'center'),
      txt('0', axL, yV2 + 86, 26, COSMOS.muted, 'mono', 'center'),
      txt('40', axR, yV2 + 86, 26, COSMOS.muted, 'mono', 'center'),
    );

    // Track 1: v1 [0, 20) - filled start at 0, HOLLOW open circle at 20!
    const v1Op = onV2 ? 0.38 : 1;
    nodes.push(
      txt('v1  [0, 20)', axL, yV1 - 40, 28, ROLE.session, 'mono', 'left').opacity(v1Op),
      glowingTrail(
        [
          [axL, yV1],
          [xSplit - 12, yV1],
        ],
        { color: ROLE.session, width: 6.5, glow: 9, opacity: v1Op, core: true },
      ),
      glowDot(axL, yV1, { radius: 8, color: ROLE.session, glow: 9, opacity: v1Op }),
      // Open hollow ring at t = 20 showing exclusion
      glowRing(xSplit, yV1, 11, ROLE.session, {
        width: 3.4,
        glow: 8,
        fillAlpha: 0,
        opacity: v1Op,
      }),
    );

    // Track 2: v2 [20, inf) - solid filled dot at 20 + glowing ray right
    const v2Op = onV2 ? 1 : 0.45;
    nodes.push(
      txt('v2  [20, inf)', xSplit + 44, yV2 - 40, 28, ROLE.policy, 'mono', 'left').opacity(v2Op),
      glowArrow([xSplit, yV2], [axR, yV2], ho > 0.3 ? ROLE.focus : ROLE.policy, {
        width: 6.5,
        tip: 18,
        glow: 10,
        opacity: v2Op,
      }),
      glowDot(xSplit, yV2, {
        radius: 10,
        color: ho > 0.3 ? ROLE.focus : ROLE.policy,
        glow: 13 * pulse,
        opacity: v2Op,
      }),
    );

    // Blue request photon jumping smoothly from (t=19, yV1) -> (t=20, yV2)
    const curX = xSplit - 26 + 26 * cj + Math.sin(cj * Math.PI) * 48;
    const curY = yV1 - 28 + (yV2 - yV1) * cj;
    nodes.push(
      glowRing(curX, curY, 19, ROLE.request, { width: 3.2, glow: 11 * pulse }),
      glowDot(curX, curY, { radius: 8, color: ROLE.request, glow: 12 }),
    );

    // Decoupled content-hash vs grant-revocation indicator
    if (gr > 0.02) {
      nodes.push(
        statusPill('CONTENT HASH: UNCHANGED', 240, 280, {
          color: ROLE.policy,
          width: 400,
          height: 48,
          opacity: gr,
        }),
        statusPill('GRANT: REVOKED', 670, 280, {
          color: ROLE.danger,
          width: 280,
          height: 48,
          opacity: gr,
        }),
      );
    }

    // Bottom readout (non-overlapping swap between half-open verdict and grant-revoked verdict)
    const hoOp = ho * Math.max(0, 1 - gr * 2.6);
    const grOp = Math.max(0, (gr - 0.45) / 0.55);
    if (hoOp > 0.02) {
      nodes.push(
        txt(
          'At t = 20: only the replacement v2 is current',
          -855,
          415,
          34,
          ROLE.focus,
          'mono',
          'left',
        )
          .glow(7, ROLE.focus)
          .opacity(hoOp),
      );
    }
    if (grOp > 0.02) {
      nodes.push(
        txt(
          'Same bytes  ·  grant revoked  ->  keep out of serving',
          -855,
          415,
          34,
          ROLE.danger,
          'mono',
          'left',
        )
          .glow(8, ROLE.danger)
          .opacity(grOp),
      );
    }

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.policy, ROLE.request), title, formula, live);
  runPhase(s, c, phase, 14);

  tweenCue(s, c, 'pr-dates', datesLit, 1, { dur: 0.5 });
  tweenCue(s, c, 'pr-invalid', checksFailed, 1, { dur: 0.6 });
  tweenCue(s, c, 'pr-at-twenty', cursorJump, 1, { dur: 0.85 });
  tweenCue(s, c, 'pr-halfopen', halfOpenLit, 1, { after: true, dur: 0.55 });
  tweenCue(s, c, 'pr-authority-revision', grantRevoked, 1, { after: true, dur: 0.55 });
}
