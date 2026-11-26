// Scene 11 (preference-ratings): "A modeled preference is a different axis from factual accuracy"
// Orbiting 3D Bradley-Terry surface + 2D logistic curve (0 -> +400) -> 4-ballot tie & both-bad vote credit tally.
import { par, to } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  buildBradleyTerrySurface3d,
  fadeIn,
  fadeOut,
  glowDot,
  glowRing,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lumBar,
  makePlot,
  orbitScene,
  preferenceProbability,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

const BALLOTS = [
  { label: 'A wins', credit: '+1.0', isWin: true, col: ROLE.pass },
  { label: 'A wins', credit: '+1.0', isWin: true, col: ROLE.pass },
  { label: 'Tie', credit: '+0.5', isWin: false, col: ROLE.focus },
  { label: 'Both bad', credit: '+0.5', isWin: false, col: ROLE.accent },
];

export default function preference(s, c) {
  const phase = s.value(0);
  const gap = s.value(0);
  const showEqual = s.value(0);
  const showAdvantage = s.value(0);
  const modeVotes = s.value(0);
  const showWins = s.value(0);
  const showTies = s.value(0);
  const showStrict = s.value(0);
  const showShare = s.value(0);
  const showVariants = s.value(0);
  const cuePulse = s.value(0);

  const bgAura = aura(320, 20, 620, '#14304c38', '#331d4720');
  const { view: bt3d } = buildBradleyTerrySurface3d(() => gap.value, {
    x: 455,
    y: 25,
    theta: -0.74,
    phi: 1.04,
    distance: 15.0,
    unit: 102,
  });

  const title = heroTitle(['Modeled Preference Is Not', 'Factual Accuracy'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.B,
    eyebrow: 'ARENA & MT-BENCH · BRADLEY-TERRY RATINGS',
  });

  const btEq = glowTex('s(A,B) = \\frac{1}{1 + 10^{(R_B - R_A)/400}}', {
    x: -445,
    y: -190,
    size: 42,
    color: ROLE.focus,
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);
    const vMode = modeVotes.value;
    const curveOp = fadeOut(vMode);
    const voteOp = fadeIn(vMode);
    const nodes = [];

    // ACT 1: 2D logistic curve on left + 3D Bradley-Terry surface captions on right
    if (curveOp > 0.02) {
      const plot = makePlot(-815, -90, 740, 355, { x: [-400, 800], y: [0, 1] });
      const pts = [];
      for (let i = 0; i <= 64; i++) {
        const x = -400 + (1200 * i) / 64;
        pts.push(plot.pt([x, preferenceProbability(x)]));
      }

      nodes.push(
        ...plot.axesNodes(curveOp * 0.9),
        glowingTrail(pts, {
          gradientColors: [ROLE.exposed, ROLE.A, ROLE.focus],
          width: 4.5,
          glow: 10,
          opacity: curveOp,
        }),
      );

      [-400, 0, 400, 800].forEach((tk) => {
        nodes.push(
          txt(
            tk > 0 ? `+${tk}` : String(tk),
            plot.px(tk),
            plot.bottom + 36,
            26,
            COSMOS.muted,
            'mono',
          ).opacity(curveOp),
        );
      });
      [0.5, 1.0].forEach((lv) => {
        nodes.push(
          txt(
            lv.toFixed(1),
            plot.left - 18,
            plot.py(lv),
            26,
            COSMOS.muted,
            'mono',
            'right',
          ).opacity(curveOp),
        );
      });
      nodes.push(
        txt(
          'Rating gap  R_A - R_B',
          plot.left + plot.w * 0.5,
          plot.bottom + 78,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(curveOp),
      );

      const eqOp = showEqual.value * fadeOut(showAdvantage.value);
      const advOp = fadeIn(showAdvantage.value);
      if (showEqual.value > 0.02) {
        const gNow = gap.value;
        const [mx, my] = plot.pt([gNow, preferenceProbability(gNow)]);
        nodes.push(
          glowDot(mx, my, {
            radius: 9.5,
            color: ROLE.focus,
            glow: 14,
            opacity: curveOp * showEqual.value,
          }),
          glowRing(mx, my, 20 + 4 * pulse, ROLE.focus, {
            width: 2.6,
            glow: 9,
            opacity: curveOp * showEqual.value * 0.75,
          }),
        );
      }
      if (eqOp > 0.02) {
        nodes.push(
          txt('Equal ratings (ΔR = 0) -> 1/2 = 50.0%', -445, 385, 34, ROLE.focus, 'mono')
            .glow(7, ROLE.focus)
            .opacity(curveOp * eqOp),
        );
      }
      if (advOp > 0.02) {
        nodes.push(
          txt('+400 -> 10/11 (91%)', -445, 385, 36, ROLE.focus, 'mono')
            .glow(8, ROLE.focus)
            .opacity(curveOp * advOp),
        );
      }

      nodes.push(
        txt('3D BRADLEY-TERRY LOGISTIC SURFACE', 455, -345, 26, ROLE.A, 'mono')
          .glow(5, ROLE.A)
          .opacity(curveOp),
        txt(
          'Moves right as Model A gains rating points over B',
          455,
          365,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(curveOp),
      );
    }

    // ACT 2: Four anonymous Arena ballots (strictly gated credit reveals!)
    if (voteOp > 0.02) {
      const xs = [-615, -205, 205, 615];
      nodes.push(
        txt(
          'HOW MUCH VOTE CREDIT DOES A RECEIVE FROM FOUR BALLOTS?',
          0,
          -230,
          28,
          ROLE.focus,
          'mono',
        )
          .glow(6, ROLE.focus)
          .opacity(voteOp),
      );

      BALLOTS.forEach((b, i) => {
        const credVis = b.isWin ? showWins.value : showTies.value;
        nodes.push(
          lumBar(xs[i], -65, 355, 225, {
            color: credVis > 0.3 ? b.col : COSMOS.muted,
            fillOpacity: credVis > 0.3 ? 0.2 : 0.1,
            strokeWidth: credVis > 0.3 ? 2.8 : 2.0,
            glow: credVis > 0.3 ? 10 : 4,
            radius: 14,
            opacity: voteOp,
          }),
          txt(`VOTE ${i + 1}`, xs[i], -140, 26, COSMOS.muted, 'mono').opacity(voteOp),
          txt(b.label, xs[i], -82, 42, COSMOS.ink, 'serif').opacity(voteOp),
        );
        if (credVis > 0.02) {
          nodes.push(
            txt(b.credit, xs[i], 2, 48, b.col, 'mono')
              .glow(10 * pulse, b.col)
              .opacity(voteOp * credVis),
          );
        } else {
          nodes.push(txt('? pts', xs[i], 2, 34, COSMOS.dim, 'mono').opacity(voteOp * 0.65));
        }
      });

      // Two glowing tally chambers present from Act 2 start (strictly withholding numbers until cues)
      nodes.push(
        lumBar(-410, 175, 680, 168, {
          color: showStrict.value > 0.3 ? ROLE.A : COSMOS.muted,
          fillOpacity: showStrict.value > 0.3 ? 0.16 : 0.08,
          strokeWidth: 2.2,
          glow: showStrict.value > 0.3 ? 9 : 4,
          radius: 14,
          opacity: voteOp,
        }),
        txt('OUTRIGHT WINS ONLY', -410, 128, 26, COSMOS.muted, 'mono').opacity(voteOp),
        lumBar(410, 175, 680, 168, {
          color: showShare.value > 0.3 ? ROLE.focus : COSMOS.muted,
          fillOpacity: showShare.value > 0.3 ? 0.16 : 0.08,
          strokeWidth: 2.2,
          glow: showShare.value > 0.3 ? 9 : 4,
          radius: 14,
          opacity: voteOp,
        }),
        txt('ARENA MEAN VOTE CREDIT', 410, 128, 26, COSMOS.muted, 'mono').opacity(voteOp),
      );

      const waitStrict = fadeOut(showStrict.value);
      const revStrict = fadeIn(showStrict.value);
      if (waitStrict > 0.02) {
        nodes.push(
          txt('? / 4', -410, 196, 46, COSMOS.dim, 'mono').opacity(voteOp * waitStrict * 0.75),
        );
      }
      if (revStrict > 0.02) {
        nodes.push(
          txt('2 / 4 = 50.0%', -410, 196, 50, ROLE.A, 'mono')
            .glow(9, ROLE.A)
            .opacity(voteOp * revStrict),
        );
      }

      const waitShare = fadeOut(showShare.value);
      const revShare = fadeIn(showShare.value);
      if (waitShare > 0.02) {
        nodes.push(
          txt('? / 4', 410, 196, 46, COSMOS.dim, 'mono').opacity(voteOp * waitShare * 0.75),
        );
      }
      if (revShare > 0.02) {
        nodes.push(
          txt('3 / 4 = 75.0%', 410, 196, 50, ROLE.focus, 'mono')
            .glow(10, ROLE.focus)
            .opacity(voteOp * revShare),
        );
      }

      if (showVariants.value > 0.02) {
        nodes.push(
          txt(
            'Beware private variant selection & voter prompt mix · verify factual accuracy against sources',
            0,
            340,
            30,
            ROLE.accent,
            'sans',
          )
            .glow(6, ROLE.accent)
            .opacity(voteOp * showVariants.value),
        );
      }
    }

    return nodes;
  });

  s.add(bgAura, bt3d, btEq, title, live);
  runAmbientPhase(s, c, phase, 2.2);
  orbitScene(s, c, bt3d, { theta: 0.35, phi: 0.96 });

  tweenCue(s, c, 'preference-ratings-phase-0', showEqual, 0, { duration: 0.1 });
  tweenCue(s, c, 'ba-preference-ratings-logistic', showEqual, 0, { duration: 0.1 });
  tweenCue(s, c, 'ba-preference-ratings-exponent', showEqual, 0, { duration: 0.1 });
  tweenCue(s, c, 'preference-ratings-phase-1', showEqual, 0, { duration: 0.1 });
  tweenCue(s, c, 'rating-equal', showEqual, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'ba-preference-ratings-equal', cuePulse, 1, { duration: 0.25 });
  c.after('ba-preference-ratings-advantage', () => {
    s.play(gap.to(400, { duration: 1.0 }));
  });
  tweenCue(s, c, 'rating-gap', showAdvantage, 1, { duration: 0.4 });

  c.on('four-votes', () => {
    s.play(
      par(
        to(bt3d, (n) => n.opacity(0), { duration: 0.22 }),
        to(btEq, (n) => n.opacity(0), { duration: 0.22 }),
        modeVotes.to(1, { duration: 0.55 }),
      ),
    );
  });
  tweenCue(s, c, 'win-credit', showWins, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'ties-half', showTies, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'strict-share', showStrict, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'vote-share', showShare, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'ba-preference-ratings-variants', showVariants, 1, { duration: 0.5 });
}
