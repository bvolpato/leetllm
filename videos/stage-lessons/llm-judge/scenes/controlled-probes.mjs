// Scene 10: controlled-probes - What changes a judge's vote?
// 3-act single-factor laboratory:
//   Act 0: Padding vs useful checklist + Length-Controlled AlpacaEval curve sliding delta_L -> 0
//   Act 1: Brand-label swap dial + anonymized multi-family self-preference ring
//   Act 2: 3-judge panel voting unanimously "supported" vs opened policy "REQUIRED"
import { circle, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  fadeInHalf,
  fadeOutHalf,
  glowDot,
  glowMeter,
  glowingTrail,
  guardedDynamic,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function controlledProbes(s, c) {
  const pulse = s.value(0);
  const act = s.value(0); // 0 = length, 1 = brand/self, 2 = correlated panel
  const padOn = s.value(0);
  const checkOn = s.value(0);
  const lenZero = s.value(0);
  const brandSwap = s.value(0);
  const selfRing = s.value(0);
  const styleScope = s.value(0);
  const policyOpen = s.value(0);
  const proxyWarn = s.value(0);
  const humanAnchor = s.value(0);

  const header = cinemaHeader(
    'CONTROLLED BIAS PROBES',
    'What actually changes',
    'a judge’s vote?',
    {
      accent: ROLE.verdict,
      size: 48,
    },
  );

  const stageAura = aura(240, 40, 620, '#ffd1661d', '#ff6b8b1a');

  // Act 0: Padding vs Checklist + Length-Controlled Logistic Curve (Delta L -> 0)
  const act0 = guardedDynamic(
    () => fadeOutHalf(Math.min(1, act.value)),
    (a) => {
      const pd = padOn.value;
      const ck = checkOn.value;
      const lz = lenZero.value;
      const nodes = [];

      // Left: Padding vs Useful Elaboration gauges
      nodes.push(
        txt(
          'SINGLE-FACTOR LENGTH PERTURBATION',
          -840,
          -165,
          26,
          ROLE.stepwise,
          'mono',
          'left',
        ).opacity(a),
        txt('Redundant sentence (0 new facts)', -840, -100, 28, COSMOS.ink, 'sans', 'left').opacity(
          a * (0.45 + pd * 0.55),
        ),
        glowMeter(-840, -52, 540, 26, 0.35 + pd * 0.45, { fill: ROLE.conflict, opacity: a }),
        txt(
          'Numbered checklist (real structure)',
          -840,
          50,
          28,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(a * (0.35 + ck * 0.65)),
        glowMeter(-840, 98, 540, 26, 0.25 + ck * 0.6, { fill: ROLE.ok, opacity: a }),
        txt(
          ck > 0.4
            ? 'Credit organization, never bare word count'
            : 'Keep facts fixed across both orders',
          -840,
          178,
          26,
          ROLE.ok,
          'sans',
          'left',
        ).opacity(a),
      );

      // Right: Length-Controlled AlpacaEval logistic curve (x = delta_length, y = win rate)
      const ox = 110;
      const oy = 180;
      const w = 680;
      const h = 340;
      const zeroX = ox + w * 0.5;
      const curvePts = [];
      for (let i = 0; i <= 36; i++) {
        const u = i / 36;
        const dL = (u - 0.5) * 6;
        const win = 1 / (1 + Math.exp(-(0.15 + 0.65 * dL)));
        curvePts.push([ox + u * w, oy - win * h]);
      }
      // Marker slides from dL = +1.8 back to dL = 0 when `length-model` fires!
      const curDL = 1.8 * (1 - lz);
      const curWin = 1 / (1 + Math.exp(-(0.15 + 0.65 * curDL)));
      const mx = ox + ((curDL + 3) / 6) * w;
      const my = oy - curWin * h;

      nodes.push(
        txt('LENGTH-CONTROLLED ALPACAEVAL', ox, -205, 26, ROLE.verdict, 'mono', 'left').opacity(a),
        line([ox, oy], [ox + w, oy], { stroke: '#344770', width: 2.2 }).opacity(a),
        line([zeroX, oy], [zeroX, oy - h], {
          stroke: ROLE.verdict,
          width: 2.2,
          dash: [7, 7],
        }).opacity(a),
        glowingTrail(curvePts, { color: ROLE.stepwise, width: 4, opacity: a }),
        glowDot(mx, my, { radius: 8.5, color: ROLE.verdict, glow: 14, opacity: a }),
        txt('Δ length = 0', zeroX, oy + 42, 26, ROLE.verdict, 'mono', 'center').opacity(a),
        txt(
          lz > 0.5 ? 'Equal-length win rate isolated' : 'Raw win rate inflated by length',
          zeroX,
          oy + 96,
          26,
          lz > 0.5 ? ROLE.ok : COSMOS.muted,
          'sans',
          'center',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  // Act 1: Brand Swap & Multi-Family Self-Preference Ring
  const act1 = guardedDynamic(
    () => fadeInHalf(Math.min(1, act.value)) * fadeOutHalf(Math.max(0, act.value - 1)),
    (a) => {
      const p = pulse.value;
      const bs = brandSwap.value;
      const sr = selfRing.value;
      const sc = styleScope.value;
      const nodes = [];

      // Left: Identical text, swapped author badge A <-> B
      nodes.push(
        txt(
          'BRAND-LABEL PROBE (TEXT FIXED)',
          -840,
          -155,
          26,
          ROLE.stepwise,
          'mono',
          'left',
        ).opacity(a),
        txt(
          'Fixed reply text: “Stop rollout, run rollback.”',
          -840,
          -90,
          28,
          COSMOS.ink,
          'serif',
          'left',
        ).opacity(a),
        txt(
          bs > 0.5 ? 'Author Tag: [Brand A]  <-->  [Brand B]' : 'Author Tag: [Brand A]',
          -840,
          -20,
          30,
          ROLE.verdict,
          'mono',
          'left',
        )
          .glow(6, ROLE.verdict)
          .opacity(a),
        txt(
          'Do votes move with the label across cases?',
          -840,
          56,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
      );

      if (sc > 0.05) {
        nodes.push(
          txt('STYLE SIGNAL CAN STILL REVEAL AUTHOR', -840, 175, 28, ROLE.verdict, 'mono', 'left')
            .glow(6, ROLE.verdict)
            .opacity(a * sc),
          txt(
            'Panickssery et al.: models recognize own phrasing',
            -840,
            232,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(a * sc),
        );
      }

      // Right: Multi-family anonymous judge ring around quality-matched replies
      const cx = 420;
      const cy = 40;
      const r = 215;
      const fams = ['F1', 'F2', 'F3', 'F4'];
      nodes.push(
        circle(80, { fill: '#0b1224', stroke: ROLE.ok, width: 3.4 })
          .at(cx, cy)
          .glow(9, ROLE.ok)
          .opacity(a),
        txt('ANON', cx, cy - 18, 26, ROLE.ok, 'mono', 'center').opacity(a),
        txt('MATCHED', cx, cy + 18, 26, COSMOS.muted, 'mono', 'center').opacity(a),
      );
      fams.forEach((fm, i) => {
        const ang = -Math.PI / 4 + (i * Math.PI) / 2;
        const ca = Math.cos(ang);
        const sa = Math.sin(ang);
        const fx = cx + ca * r;
        const fy = cy + sa * r;
        nodes.push(
          beamWithPhotons(
            [
              [cx + ca * 88, cy + sa * 88],
              [fx - ca * 52, fy - sa * 52],
            ],
            ROLE.stepwise,
            p * 1.1 + i * 0.25,
            { alpha: a * (0.35 + sr * 0.65), width: 3 },
          ),
          circle(44, { fill: '#0b1224', stroke: ROLE.stepwise, width: 3 })
            .at(fx, fy)
            .opacity(a * (0.4 + sr * 0.6)),
          txt(fm, fx, fy, 28, COSMOS.ink, 'mono', 'center').opacity(a * (0.4 + sr * 0.6)),
        );
      });

      return group(...nodes);
    },
  );

  // Act 2: Correlated 3-Judge Panel vs Opened Policy
  const act2 = guardedDynamic(
    () => fadeInHalf(Math.max(0, act.value - 1)),
    (a) => {
      const p = pulse.value;
      const po = policyOpen.value;
      const pw = proxyWarn.value;
      const ha = humanAnchor.value;
      const nodes = [];

      const jYs = [-145, 20, 185];
      const targetPt = [40, 20];
      const polPt = [560, 20];

      nodes.push(
        txt(
          'CLAIM: “Commander approval is optional”',
          -840,
          -230,
          28,
          COSMOS.ink,
          'serif',
          'left',
        ).opacity(a),
      );

      jYs.forEach((jy, i) => {
        const jPt = [-540, jy];
        nodes.push(
          circle(42, { fill: '#0b1224', stroke: ROLE.stepwise, width: 3.4 })
            .at(...jPt)
            .glow(8, ROLE.stepwise)
            .opacity(a),
          txt(`J${i + 1}`, jPt[0], jPt[1], 28, ROLE.stepwise, 'mono', 'center').opacity(a),
          txt('SUPPORTED', jPt[0] - 180, jPt[1], 26, ROLE.stepwise, 'mono', 'center').opacity(a),
          beamWithPhotons(
            quadArcPts([jPt[0] + 44, jy], [targetPt[0] - 88, targetPt[1]], (i - 1) * 20),
            ROLE.stepwise,
            p * 1.2 + i * 0.3,
            {
              alpha: a,
              width: 3.2,
            },
          ),
        );
      });

      nodes.push(
        circle(84, { fill: '#0b1224', stroke: ROLE.verdict, width: 3.8 })
          .at(...targetPt)
          .glow(10, ROLE.verdict)
          .opacity(a),
        txt('3 / 3', targetPt[0], targetPt[1] - 16, 32, ROLE.verdict, 'mono', 'center').opacity(a),
        txt('AGREE', targetPt[0], targetPt[1] + 24, 26, COSMOS.muted, 'mono', 'center').opacity(a),
      );

      if (po > 0.05) {
        nodes.push(
          line([targetPt[0] + 92, 20], [polPt[0] - 102, 20], {
            stroke: ROLE.conflict,
            width: 4.5,
            dash: [10, 8],
          })
            .glow(10, ROLE.conflict)
            .opacity(a * po),
          circle(98, { fill: '#0b1224', stroke: ROLE.policy, width: 4 })
            .at(...polPt)
            .glow(10, ROLE.policy)
            .opacity(a * po),
          txt('POLICY', polPt[0], polPt[1] - 20, 26, ROLE.policy, 'mono', 'center').opacity(a * po),
          txt('REQUIRED', polPt[0], polPt[1] + 20, 28, ROLE.conflict, 'mono', 'center').opacity(
            a * po,
          ),
        );
      }

      if (pw > 0.05) {
        nodes.push(
          txt(
            'Majority proxy counts ALL 3 false approvals as “correct”',
            -840,
            310,
            28,
            ROLE.verdict,
            'sans',
            'left',
          )
            .glow(5, ROLE.verdict)
            .opacity(a * pw),
        );
      }
      if (ha > 0.05) {
        nodes.push(
          txt(
            'FIND SHARED MISTAKES: COMPARE PANEL TO INDEPENDENT HUMAN LABELS',
            -840,
            375,
            26,
            ROLE.conflict,
            'mono',
            'left',
          )
            .glow(6, ROLE.conflict)
            .opacity(a * ha),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, act0, act1, act2);
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('padding-only', () => {
    s.play(padOn.to(1, { duration: clampDur(c, c.cue('padding-only').start, 0.4) }));
  });
  c.on('useful-elaboration', () => {
    s.play(checkOn.to(1, { duration: clampDur(c, c.cue('useful-elaboration').start, 0.4) }));
  });
  c.on('length-model', () => {
    s.play(lenZero.to(1, { duration: clampDur(c, c.cue('length-model').start, 0.55) }));
  });
  c.on('brand-probe', () => {
    const t = c.cue('brand-probe').start;
    s.play(act.to(1, { duration: clampDur(c, t, 0.35) }));
    s.play(brandSwap.to(1, { duration: clampDur(c, t, 0.45) }));
  });
  c.on('self-probe', () => {
    s.play(selfRing.to(1, { duration: clampDur(c, c.cue('self-probe').start, 0.4) }));
  });
  c.on('identity-scope', () => {
    s.play(styleScope.to(1, { duration: clampDur(c, c.cue('identity-scope').start, 0.35) }));
  });
  c.on('correlated-panel', () => {
    s.play(act.to(2, { duration: clampDur(c, c.cue('correlated-panel').start, 0.35) }));
  });
  c.on('open-policy', () => {
    s.play(policyOpen.to(1, { duration: clampDur(c, c.cue('open-policy').start, 0.4) }));
  });
  c.on('ensemble-proxy', () => {
    s.play(proxyWarn.to(1, { duration: clampDur(c, c.cue('ensemble-proxy').start, 0.35) }));
  });
  c.on('independent-label', () => {
    s.play(humanAnchor.to(1, { duration: clampDur(c, c.cue('independent-label').start, 0.35) }));
  });
}
