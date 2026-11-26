// Scene 12: inductive-bias: ConvNet local receptive field growth vs ViT 1-hop global attention + recipe eval.
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  line,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function inductiveBias(s, c) {
  const convDepth = s.value(1); // 1 -> 2 (3x3 -> 5x5)
  const showVit = s.value(0);
  const showEval = s.value(0);

  const bgAura = aura(0, 0, 740, '#14325c28', '#24184022');
  const title = heroTitle(['Inductive Bias &', 'Training Recipe Both Matter'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.patch,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const cd = convDepth.value;
    const vit = showVit.value;
    const ev = showEval.value;
    const nodes = [
      txt('CONVNET: LOCAL 3x3 -> 5x5 STACK', -500, -210, 26, ROLE.patch, 'mono', 'center').opacity(
        alpha,
      ),
      txt('ViT: 1-STEP GLOBAL ATTENTION', 420, -210, 26, ROLE.pos, 'mono', 'center').opacity(
        alpha * (0.4 + 0.6 * vit),
      ),
    ];

    const cell = 66;
    const leftCx = -500;
    const rightCx = 420;
    const gridCy = 5;

    // Left 5x5 grid: local receptive field expands from 3x3 to 5x5
    for (let r = 0; r < 5; r++) {
      for (let col = 0; col < 5; col++) {
        const dist = Math.max(Math.abs(r - 2), Math.abs(col - 2));
        const x = leftCx + (col - 2) * cell;
        const y = gridCy + (r - 2) * cell;
        const in3x3 = dist <= 1;
        const in5x5 = dist <= 2;
        const fill =
          dist === 0 ? '#164d68' : in3x3 ? '#11334d' : in5x5 && cd > 1.4 ? '#142744' : '#0d1426';
        const stroke =
          dist === 0 ? ROLE.patch : in3x3 ? ROLE.patch : cd > 1.4 ? ROLE.attn : COSMOS.rule;
        nodes.push(
          rect(cell - 8, cell - 8, { fill, stroke, width: dist === 0 ? 3 : 2, radius: 8 })
            .at(x, y)
            .opacity(alpha),
        );
      }
    }

    // Right 5x5 grid: center patch connects directly to all distant corners in one hop
    const corners = [
      [0, 0],
      [0, 4],
      [4, 0],
      [4, 4],
      [0, 2],
      [4, 2],
    ];
    for (let r = 0; r < 5; r++) {
      for (let col = 0; col < 5; col++) {
        const x = rightCx + (col - 2) * cell;
        const y = gridCy + (r - 2) * cell;
        const isCenter = r === 2 && col === 2;
        nodes.push(
          rect(cell - 8, cell - 8, {
            fill: isCenter ? '#3a2b12' : '#0f172b',
            stroke: isCenter ? ROLE.pos : vit > 0.3 ? '#3b4f7c' : COSMOS.rule,
            width: isCenter ? 3 : 1.8,
            radius: 8,
          })
            .at(x, y)
            .opacity(alpha * (0.45 + 0.55 * vit)),
        );
      }
    }
    if (vit > 0.1) {
      corners.forEach(([r, col]) => {
        const tx = rightCx + (col - 2) * cell;
        const ty = gridCy + (r - 2) * cell;
        nodes.push(
          line([rightCx, gridCy], [tx, ty], { stroke: ROLE.pos, width: 2.6 })
            .glow(6, ROLE.pos)
            .opacity(alpha * vit * 0.85),
        );
      });
    }

    // Bottom held-out evaluation split
    nodes.push(
      txt(
        'HELD-OUT EVALUATION: SCORE BANNER & EXACT ID SEPARATELY',
        -855,
        245,
        26,
        ev > 0.3 ? ROLE.ok : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (0.4 + 0.6 * ev)),
      chipPill('Error Banner: 100%', -540, 325, {
        w: 420,
        h: 68,
        color: ev > 0.3 ? ROLE.ok : COSMOS.rule,
        size: 28,
        glow: ev > 0.3 ? 8 : 0,
        opacity: alpha * (0.35 + 0.65 * ev),
      }),
      chipPill('Exact ID beside Retry: test separately', 180, 325, {
        w: 690,
        h: 68,
        color: ev > 0.3 ? ROLE.warn : COSMOS.rule,
        size: 28,
        glow: ev > 0.3 ? 10 : 0,
        opacity: alpha * (0.35 + 0.65 * ev),
      }),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'inductive-bias-beat-0', (d) => s.play(convDepth.to(2, { duration: d })));
  playCue(s, c, 'inductive-bias-beat-1', (d) => s.play(showVit.to(1, { duration: d })));
  playCue(s, c, 'inductive-bias-beat-2', (d) => s.play(showEval.to(1, { duration: d })));
}
