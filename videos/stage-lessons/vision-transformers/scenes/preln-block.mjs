// Scene 11: preln-block: Pre-LN ViT residual highway ([2,4] -> [2.5,3.5] -> LN -> 4-dim GELU -> [2.341,4.341]).
import {
  COSMOS,
  PRELN,
  ROLE,
  arrow,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  line,
  playCue,
  txt,
} from '../parts.mjs';

export default function prelnBlock(s, c) {
  const step = s.value(0); // 0..7
  const showSpecs = s.value(0);

  const bgAura = aura(0, 0, 760, '#14335c28', '#20184422');
  const title = heroTitle(['Pre-LN ViT Block:', 'Each Sublayer Adds to the Skip Path'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.patch,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const st = step.value;
    const sp = showSpecs.value;

    // Top residual highway (y = -155): [2, 4] -> (+Attn) -> [2.5, 3.5] -> (+MLP) -> [2.341, 4.341]
    const nodes = [
      txt(
        'RETAINED RESIDUAL STREAM (UNNORMALIZED SKIP PATH)',
        -855,
        -245,
        26,
        ROLE.ok,
        'mono',
        'left',
      ).opacity(alpha),

      chipPill('[2.0, 4.0]', -715, -155, {
        w: 240,
        h: 72,
        color: ROLE.patch,
        size: 30,
        opacity: alpha,
      }),
      arrow([-585, -155], [-495, -155], { stroke: ROLE.ok, width: 3.5, head: 11 }).opacity(alpha),
      chipPill('+ [0.5, -0.5]', -345, -155, {
        w: 270,
        h: 68,
        color: st >= 1 ? ROLE.attn : COSMOS.rule,
        size: 28,
        glow: st >= 1 ? 8 : 0,
        opacity: alpha * (st >= 1 ? 1 : 0.35),
      }),
      arrow([-200, -155], [-115, -155], { stroke: ROLE.ok, width: 3.5, head: 11 }).opacity(alpha),
      chipPill('[2.5, 3.5]', 20, -155, {
        w: 240,
        h: 72,
        color: st >= 2 ? ROLE.ok : COSMOS.rule,
        size: 30,
        glow: st >= 2 ? 10 : 0,
        opacity: alpha * (st >= 2 ? 1 : 0.35),
      }),
      arrow([150, -155], [435, -155], { stroke: ROLE.ok, width: 3.5, head: 12 }).opacity(alpha),
      chipPill(`[${PRELN.output[0].toFixed(3)}, ${PRELN.output[1].toFixed(3)}]`, 625, -155, {
        w: 350,
        h: 76,
        color: st >= 6 ? ROLE.ok : COSMOS.rule,
        fill: st >= 6 ? '#0f2d24' : '#10182d',
        size: 30,
        glow: st >= 6 ? 14 : 0,
        opacity: alpha * (st >= 6 ? 1 : 0.32),
      }),

      // Lower MLP side-branch (y = +95): clean orthogonal drop at x = 20 -> down to y = 20 -> left to LN
      txt(
        'NORMALIZED MLP BRANCH (SHARED ACROSS POSITIONS)',
        -855,
        -15,
        26,
        ROLE.pos,
        'mono',
        'left',
      ).opacity(alpha),
      line([20, -112], [20, 28], { stroke: ROLE.pos, width: 2.8 }).opacity(
        alpha * (st >= 3 ? 0.9 : 0.28),
      ),
      line([20, 28], [-640, 28], { stroke: ROLE.pos, width: 2.8 }).opacity(
        alpha * (st >= 3 ? 0.9 : 0.28),
      ),
      arrow([-640, 28], [-640, 52], { stroke: ROLE.pos, width: 2.8, head: 10 }).opacity(
        alpha * (st >= 3 ? 0.9 : 0.28),
      ),

      chipPill('LN: [-1.0, +1.0]', -640, 100, {
        w: 330,
        h: 72,
        color: st >= 3 ? ROLE.pos : COSMOS.rule,
        size: 28,
        glow: st >= 3 ? 8 : 0,
        opacity: alpha * (st >= 3 ? 1 : 0.32),
      }),
      arrow([-465, 100], [-365, 100], { stroke: ROLE.pos, width: 3, head: 10 }).opacity(
        alpha * (st >= 4 ? 0.9 : 0.25),
      ),
      chipPill('Expand (2 -> 4)', -175, 100, {
        w: 350,
        h: 72,
        color: st >= 4 ? ROLE.bridge : COSMOS.rule,
        size: 28,
        glow: st >= 4 ? 8 : 0,
        opacity: alpha * (st >= 4 ? 1 : 0.32),
      }),
      arrow([10, 100], [115, 100], { stroke: ROLE.bridge, width: 3, head: 10 }).opacity(
        alpha * (st >= 5 ? 0.9 : 0.25),
      ),
      chipPill('GELU + Contract', 310, 100, {
        w: 350,
        h: 72,
        color: st >= 5 ? ROLE.warn : COSMOS.rule,
        size: 28,
        glow: st >= 5 ? 8 : 0,
        opacity: alpha * (st >= 5 ? 1 : 0.32),
      }),
      line([495, 100], [625, 100], { stroke: ROLE.ok, width: 3.2 }).opacity(
        alpha * (st >= 6 ? 1 : 0.25),
      ),
      arrow([625, 100], [625, -108], { stroke: ROLE.ok, width: 3.2, head: 12 }).opacity(
        alpha * (st >= 6 ? 1 : 0.25),
      ),

      // Footer ViT-Base specs
      txt(
        'ViT-Base: D = 768  |  12 blocks  |  12 heads x 64  |  MLP 768 -> 3072 -> 768  |  Final LN',
        0,
        295,
        28,
        sp > 0.3 ? ROLE.patch : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha * (0.35 + 0.65 * sp)),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'preln-block-beat-0', (d) => s.play(step.to(0.5, { duration: d })));
  playCue(s, c, 'preln-block-beat-1', (d) => s.play(step.to(1, { duration: d })));
  playCue(s, c, 'preln-first-residual', (d) => s.play(step.to(2, { duration: d })));
  playCue(s, c, 'preln-normalize', (d) => s.play(step.to(3, { duration: d })));
  playCue(s, c, 'preln-expand', (d) => s.play(step.to(4, { duration: d })));
  playCue(s, c, 'preln-gelu', (d) => s.play(step.to(5, { duration: d })));
  playCue(s, c, 'preln-final', (d) => s.play(step.to(6, { duration: d })));
  playCue(s, c, 'preln-block-beat-2', (d) => s.play(showSpecs.to(1, { duration: d })));
}
