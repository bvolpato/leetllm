// Scene 04: What does the judge predict for the ticket? (Bradley-Terry sigmoid + reward swap + NLL jump)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainAfterDuration,
  remainDuration,
  runPhase,
  sampleCurve,
  sigmoid,
  txt,
} from '../parts.mjs';

export default function btJudge(s, c) {
  const phase = s.value(0);
  const showScores = s.value(0);
  const showPred = s.value(0);
  const showLoss1 = s.value(0);
  const flipProg = s.value(0);
  const showLoss2 = s.value(0);

  const bgAura = aura(320, 10, 560, '#14385c28', '#3c1b4a16');
  const title = heroTitle(['What Does the Judge', 'Predict for the Ticket?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'BRADLEY-TERRY REWARD MODEL · SIGMOID ODDS & NEGATIVE LOG LOSS',
  });

  // Sigmoid plot box on right half
  const px0 = 40;
  const px1 = 830;
  const pyBot = 220;
  const pyTop = -230;
  const mapX = (g) => px0 + ((g + 3) / 6) * (px1 - px0);
  const mapY = (p) => pyBot - p * (pyBot - pyTop);
  const sigPts = sampleCurve((g) => sigmoid(g), [-3, 3], [0, 1], px0, px1, pyBot, pyTop, 80);

  const live = guardedDynamic(s.value(1), () => {
    const ph = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(ph * 3.8);
    const sc = Math.max(0.75, showScores.value);
    const pr = showPred.value;
    const l1 = showLoss1.value;
    const fl = flipProg.value;
    const l2 = showLoss2.value;

    const rTicket = 1.8 - 1.1 * fl;
    const rGrant = 0.7 + 1.1 * fl;
    const gap = rTicket - rGrant;
    const prob = sigmoid(gap);
    const loss = -Math.log(prob);
    const lossKnown = fl < 0.5 ? l1 > 0.3 : l2 > 0.3;

    const nodes = [
      // Left score gauges
      glassCell(-465, -135, 740, 118, COSMOS.emerald, { fill: '#0e2624', glow: 5, opacity: sc }),
      txt('TICKET REWARD  r(A)', -800, -135, 28, COSMOS.emerald, 'mono', 'left'),
      txt(rTicket.toFixed(1), -130, -135, 42, COSMOS.emerald, 'mono', 'right'),

      glassCell(-465, 8, 740, 118, COSMOS.cyan, { fill: '#102138', glow: 5, opacity: sc }),
      txt('DIRECT GRANT  r(B)', -800, 8, 28, COSMOS.cyan, 'mono', 'left'),
      txt(rGrant.toFixed(1), -130, 8, 42, COSMOS.cyan, 'mono', 'right'),

      glassCell(-465, 162, 740, 134, gap >= 0 ? COSMOS.gold : COSMOS.rose, {
        fill: gap >= 0 ? '#221c0e' : '#29101a',
        glow: 8 * pulse,
      }),
      txt(
        `REWARD GAP:  ${gap >= 0 ? '+' : ''}${gap.toFixed(1)}`,
        -800,
        134,
        32,
        gap >= 0 ? COSMOS.gold : COSMOS.rose,
        'mono',
        'left',
      ),
      txt(
        pr < 0.3
          ? 'Which side of 50% even odds?  [ ? ]'
          : lossKnown
            ? `P(A > B) = ${(prob * 100).toFixed(1)}%   ·   LOSS = ${loss.toFixed(3)}`
            : `P(A > B) = ${(prob * 100).toFixed(1)}%   ·   LOSS = ?`,
        -800,
        192,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ),

      // Right Bradley-Terry sigmoid plot
      txt('BRADLEY-TERRY SIGMOID  P(TICKET WINS)', 435, -310, 26, COSMOS.cyan, 'mono'),
      line([px0, pyBot], [px1, pyBot], { stroke: COSMOS.rule, width: 2.2 }),
      line([mapX(0), pyBot], [mapX(0), pyTop], { stroke: COSMOS.rule, width: 2, dash: [6, 6] }),
      line([px0, mapY(0.5)], [px1, mapY(0.5)], { stroke: COSMOS.dim, width: 2, dash: [8, 6] }),
      txt('50% EVEN', px0 + 10, mapY(0.5) - 24, 26, COSMOS.muted, 'mono', 'left'),
      txt('-3', mapX(-3), pyBot + 40, 26, COSMOS.muted, 'mono'),
      txt('0', mapX(0), pyBot + 40, 26, COSMOS.muted, 'mono'),
      txt('+3', mapX(3), pyBot + 40, 26, COSMOS.muted, 'mono'),
      txt('REWARD GAP  r(A) - r(B)', 435, pyBot + 94, 26, COSMOS.muted, 'mono'),

      glowingTrail(sigPts, { color: COSMOS.cyan, width: 4.8, opacity: 0.94, glow: 10 }),
    ];

    if (pr > 0.2) {
      const gx = mapX(gap);
      const gy = mapY(prob);
      const col = gap >= 0 ? COSMOS.gold : COSMOS.rose;
      nodes.push(
        line([gx, pyBot], [gx, gy], { stroke: col, width: 2.4, dash: [6, 5] }).opacity(pr),
        glowDot(gx, gy, { radius: 10, color: col, glow: 15, opacity: pr }),
        txt(
          `${(prob * 100).toFixed(1)}%`,
          gap >= 0 ? gx - 26 : gx + 28,
          gap >= 0 ? gy - 42 : gy + 44,
          32,
          col,
          'mono',
          gap >= 0 ? 'right' : 'left',
        )
          .glow(6, col)
          .opacity(pr),
      );
    }

    nodes.push(
      txt(
        fl > 0.6
          ? 'Observed vote stays A; swapping scores raises NLL 0.287 -> 1.387'
          : 'Observed reviewer vote: Ticket A over Grant B',
        435,
        396,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  const eqBt = glowTex(
    'P(A > B) = \\sigma(r_A - r_B) = \\frac{1}{1 + e^{-(r_A - r_B)}}, \\quad \\mathcal{L} = -\\ln P',
    {
      x: -380,
      y: 356,
      size: 32,
      color: COSMOS.gold,
      glow: 6,
    },
  );

  s.add(bgAura, title, live, eqBt);
  runPhase(s, c, phase, 14);

  c.on('judge-scores', () =>
    s.play(showScores.to(1, { duration: remainDuration(c, 'judge-scores', 0.5) })),
  );
  c.after('judge-prediction', () =>
    s.play(showPred.to(1, { duration: remainAfterDuration(c, 'judge-prediction', 0.45) })),
  );
  c.on('judge-first-loss', () =>
    s.play(showLoss1.to(1, { duration: remainDuration(c, 'judge-first-loss', 0.45) })),
  );
  c.on('judge-flip', () =>
    s.play(flipProg.to(1, { duration: remainDuration(c, 'judge-flip', 1.35) })),
  );
  c.on('judge-second-loss', () =>
    s.play(showLoss2.to(1, { duration: remainDuration(c, 'judge-second-loss', 0.45) })),
  );
}
