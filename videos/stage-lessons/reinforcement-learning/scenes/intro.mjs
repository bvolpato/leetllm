// Scene 1: intro - "Where should this access request go?"
// View 1: Glowing access request orb glides along a cyan conduit into a 2-way trajectory fork.
// View 2: Parallel luminous decision timelines with costs, delayed rewards, gamma lens, and veiled totals (?).
import { circle, line } from 'vizmatic/stage';
import {
  COSMOS,
  REWARD,
  ROLE,
  cinemaAtmosphere,
  gamma,
  glowArcArrow,
  glowDot,
  glowRing,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  playCue,
  rule,
  runPhase,
  swapVis,
  txt,
} from '../parts.mjs';
import { sign } from '../desk.mjs';

export default function intro(s, c) {
  const title = heroTitle(['Where should this', 'access request go?'], {
    x: -855,
    y: -440,
    size: 52,
    lineHeight: 60,
    accent: ROLE.state,
  });

  const vFork = s.value(1);
  const vHoriz = s.value(0);

  // View 1 state
  const arriveT = s.value(0);
  const litAsk = s.value(0.25);
  const litRev = s.value(0.25);
  const ambient = s.value(0);

  // View 2 state (all delayed values withheld until after their spoken cues; totals stay '?')
  const showAskCost = s.value(0);
  const showAskLater = s.value(0);
  const showRevCost = s.value(0);
  const showRevLater = s.value(0);
  const showDiscount = s.value(0);
  const showDecide = s.value(0);

  const forkLayer = guardedDynamic(vFork, (alpha) => {
    const nodes = [];
    const reqX = -710 + arriveT.value * 280;
    const reqY = 65;
    const jx = -120;
    const jy = 65;

    // Inlet photon conduit
    nodes.push(
      glowingTrail(
        [
          [-780, reqY],
          [jx, jy],
        ],
        { color: ROLE.state, width: 5, glow: 10, opacity: 0.8 * alpha },
      ),
    );

    // Glowing request orb gliding up to the fork
    nodes.push(
      circle(102, { fill: null, stroke: ROLE.state, width: 2.2, dash: [8, 8] })
        .at(reqX, reqY)
        .opacity(0.55 * alpha),
      glowRing(reqX, reqY, 84, ROLE.state, { width: 4, glow: 14 }).opacity(alpha),
      txt('REQ-10234', reqX, reqY - 14, 28, ROLE.state, 'mono', 'center').opacity(alpha),
      txt('09:00', reqX, reqY + 24, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('Access request', reqX, reqY - 134, 34, COSMOS.ink, 'serif', 'center').opacity(alpha),
      txt('Proof missing', reqX, reqY + 132, 30, ROLE.gold, 'sans', 'center')
        .glow(5, ROLE.gold)
        .opacity(alpha),
    );

    // Junction nexus
    nodes.push(glowDot(jx, jy, { radius: 11, color: ROLE.state, glow: 14, opacity: alpha }));

    // Upper route: Ask for proof (emerald)
    const askP = [355, -135];
    const askOp = (0.42 + 0.58 * litAsk.value) * alpha;
    const pAsk = (ambient.value * 0.35) % 1;
    nodes.push(
      glowArcArrow([jx + 12, jy - 8], [askP[0] - 86, askP[1]], -75, {
        color: ROLE.evidence,
        width: litAsk.value > 0.7 ? 5.2 : 3.4,
        glow: litAsk.value > 0.7 ? 14 : 7,
        opacity: askOp,
        photonT: pAsk,
      }),
      glowRing(askP[0], askP[1], 72, ROLE.evidence, {
        width: litAsk.value > 0.7 ? 4.4 : 2.8,
        glow: litAsk.value > 0.7 ? 14 : 7,
      }).opacity(askOp),
      txt('Ask', askP[0], askP[1], 32, ROLE.evidence, 'sans', 'center').opacity(askOp),
      txt('Ask for proof', askP[0] + 110, askP[1] - 18, 38, ROLE.evidence, 'serif', 'left')
        .glow(litAsk.value > 0.7 ? 7 : 0, ROLE.evidence)
        .opacity(askOp),
      txt(
        'Wait for a reply',
        askP[0] + 110,
        askP[1] + 28,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(askOp),
    );

    // Lower route: Human review (blue)
    const revP = [355, 255];
    const revOp = (0.42 + 0.58 * litRev.value) * alpha;
    const pRev = (ambient.value * 0.35 + 0.5) % 1;
    nodes.push(
      glowArcArrow([jx + 12, jy + 8], [revP[0] - 86, revP[1]], 75, {
        color: ROLE.review,
        width: litRev.value > 0.7 ? 5.2 : 3.4,
        glow: litRev.value > 0.7 ? 14 : 7,
        opacity: revOp,
        photonT: pRev,
      }),
      glowRing(revP[0], revP[1], 72, ROLE.review, {
        width: litRev.value > 0.7 ? 4.4 : 2.8,
        glow: litRev.value > 0.7 ? 14 : 7,
      }).opacity(revOp),
      txt('Review', revP[0], revP[1], 30, ROLE.review, 'sans', 'center').opacity(revOp),
      txt('Human review', revP[0] + 110, revP[1] - 18, 38, ROLE.review, 'serif', 'left')
        .glow(litRev.value > 0.7 ? 7 : 0, ROLE.review)
        .opacity(revOp),
      txt(
        'Join the review queue',
        revP[0] + 110,
        revP[1] + 28,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(revOp),
    );

    return nodes;
  });

  const horizLayer = guardedDynamic(vHoriz, (alpha) => {
    const nodes = [];

    // Status assumption line (anchored right, clear of left hero title!)
    nodes.push(
      txt(
        'REQ-10234 · 09:00 · Assumption: valid proof on ask',
        845,
        -380,
        28,
        ROLE.evidence,
        'mono',
        'right',
      ).opacity(alpha),
    );

    // Column anchor headers (floating above timelines)
    const colNow = -215;
    const colLater = 245;
    const colTotal = 665;
    nodes.push(
      txt('First move', -665, -245, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('Cost now', colNow, -245, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('One step later', colLater, -245, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('Return at 09:00', colTotal, -245, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
      rule(-840, -205, 840, -205, COSMOS.rule, 1.8).opacity(0.65 * alpha),
    );

    // Two parallel glowing timeline conduits
    const tracks = [
      {
        y: -75,
        name: 'Ask for proof',
        sub: 'Verified proof',
        cost: REWARD.ask,
        later: REWARD.evidence,
        col: ROLE.evidence,
        cVis: showAskCost.value,
        lVis: showAskLater.value,
      },
      {
        y: 155,
        name: 'Human review',
        sub: 'Reviewer verifies',
        cost: REWARD.reviewCost,
        later: REWARD.review,
        col: ROLE.review,
        cVis: showRevCost.value,
        lVis: showRevLater.value,
      },
    ];

    // Discount lens vertical beam between Now and Later
    const discOp = showDiscount.value * alpha;
    if (discOp > 0.02) {
      nodes.push(
        line([15, -185], [15, 265], { stroke: ROLE.violet, width: 3.2, dash: [10, 8] })
          .glow(9, ROLE.violet)
          .opacity(discOp),
        txt(`× γ (${gamma})`, 15, 305, 30, ROLE.violet, 'mono', 'center')
          .glow(6, ROLE.violet)
          .opacity(discOp),
      );
    }

    tracks.forEach((tr) => {
      // Glowing horizontal conduit segments strictly BETWEEN orb rims (zero stroke-crossing!)
      nodes.push(
        glowingTrail(
          [
            [-495, tr.y],
            [colNow - 66, tr.y],
          ],
          { color: tr.col, width: 3.4, glow: 7, opacity: 0.6 * alpha, core: false },
        ),
        glowingTrail(
          [
            [colNow + 66, tr.y],
            [colLater - 72, tr.y],
          ],
          { color: tr.col, width: 3.4, glow: 7, opacity: 0.6 * alpha, core: false },
        ),
        glowingTrail(
          [
            [colLater + 72, tr.y],
            [colTotal - 72, tr.y],
          ],
          { color: tr.col, width: 3.4, glow: 7, opacity: 0.6 * alpha, core: false },
        ),
        txt(tr.name, -675, tr.y, 38, tr.col, 'serif', 'center').glow(6, tr.col).opacity(alpha),
      );

      // Cost now orb
      const cOp = tr.cVis * alpha;
      nodes.push(
        glowRing(colNow, tr.y, 62, tr.col, { width: 3.2, glow: 9 }).opacity(
          (0.25 + 0.75 * tr.cVis) * alpha,
        ),
      );
      if (cOp > 0.02) {
        nodes.push(
          txt(sign(tr.cost), colNow, tr.y, 40, tr.col, 'mono', 'center')
            .glow(7, tr.col)
            .opacity(cOp),
        );
      }

      // One step later orb
      const lOp = tr.lVis * alpha;
      nodes.push(
        glowRing(colLater, tr.y, 66, tr.col, { width: 3.2, glow: 9 }).opacity(
          (0.25 + 0.75 * tr.lVis) * alpha,
        ),
      );
      if (lOp > 0.02) {
        nodes.push(
          txt(sign(tr.later), colLater, tr.y, 40, tr.col, 'mono', 'center')
            .glow(7, tr.col)
            .opacity(lOp),
          txt(tr.sub, colLater, tr.y + 98, 26, COSMOS.muted, 'sans', 'center').opacity(lOp),
        );
      }

      // Veiled return ring (?) strictly withheld!
      const qGlow = showDecide.value > 0.5 ? 14 : 6;
      const qCol = showDecide.value > 0.5 ? ROLE.gold : COSMOS.dim;
      nodes.push(
        glowRing(colTotal, tr.y, 64, qCol, {
          width: showDecide.value > 0.5 ? 4 : 2.6,
          glow: qGlow,
          dash: [9, 7],
        }).opacity(alpha),
        txt('?', colTotal, tr.y, 52, qCol, 'mono', 'center')
          .glow(showDecide.value > 0.5 ? 8 : 0, ROLE.gold)
          .opacity(alpha),
      );
    });

    // Prediction prompt at bottom
    const decOp = showDecide.value * alpha;
    if (decOp > 0.02) {
      nodes.push(
        txt('Which first move earns the larger return?', 0, 410, 40, ROLE.gold, 'serif', 'center')
          .glow(8, ROLE.gold)
          .opacity(decOp),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.state, ROLE.evidence), title, forkLayer, horizLayer);

  runPhase(s, c, ambient, 12);
  c.at(0.1, () => s.play(arriveT.to(1, { duration: 1.1 })));

  playCue(s, c, 'ask-route', (d) => s.play(litAsk.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'review-route', (d) => s.play(litRev.to(1, { duration: d })), { dur: 0.45 });

  playCue(s, c, 'certain', (d) => s.play(swapVis(vFork, vHoriz, d)), { dur: 0.7 });
  playCue(s, c, 'ask-cost', (d) => s.play(showAskCost.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'ask-later', (d) => s.play(showAskLater.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'review-cost', (d) => s.play(showRevCost.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'review-later', (d) => s.play(showRevLater.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'discount', (d) => s.play(showDiscount.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'decide', (d) => s.play(showDecide.to(1, { duration: d })), { dur: 0.45 });
}
