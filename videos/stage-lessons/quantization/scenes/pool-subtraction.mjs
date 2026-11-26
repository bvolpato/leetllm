// Scene 22: pool-subtraction: 80 GB card - 8 GB reserved: BF16 54 GB -> 18 GB pool (53 users) vs 4-bit 13.92 GB -> 58.08 GB pool (173 users; 119 with recurrent state!).
import {
  COSMOS,
  POOL_BF16,
  POOL_Q4,
  POOL_Q4_HYB,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function poolSubtraction(s, c) {
  const showUsers = s.value(0);
  const showWork = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#14383222');
  const title = heroTitle(['VRAM Pool Subtraction:', 'Weight Savings Expand the KV Pool'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.ok,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const us = showUsers.value;
    const wk = showWork.value;

    const barX = -480;
    const maxW = 740;
    const px = maxW / 80;

    const nodes = [
      txt(
        '80 GB CARD  |  8 GB RESERVED  |  PER-USER KV CACHE = ~336 MB (FIXED)',
        -855,
        -220,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),

      // BF16 row
      txt('BF16 (54.0 GB W)', -855, -100, 28, ROLE.err, 'mono', 'left').opacity(alpha),
      lumBar(barX, -100, 54 * px, 44, ROLE.weight, { opacity: alpha, maxTrackW: maxW }),
      lumBar(barX + 54 * px + 4, -100, 18 * px, 44, ROLE.grid, { opacity: alpha, glow: 8 }),
      txt(
        us > 0.35 ? `18.0 GB pool -> ${POOL_BF16.users} users` : '18.0 GB KV pool',
        barX + maxW + 24,
        -100,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),

      // 4-bit row
      txt('4-bit (13.92 GB W)', -855, 10, 28, ROLE.ok, 'mono', 'left').opacity(alpha),
      lumBar(barX, 10, 13.92 * px, 44, ROLE.ok, { opacity: alpha, maxTrackW: maxW }),
      lumBar(barX + 13.92 * px + 4, 10, 58.08 * px, 44, ROLE.gold, { opacity: alpha, glow: 10 }),
      txt(
        us > 0.35 ? `58.08 GB pool -> ${POOL_Q4.users} users!` : '58.08 GB KV pool (3.2x!)',
        barX + maxW + 24,
        10,
        26,
        ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha),

      // Hybrid with recurrent state
      txt('4-bit + Recurrent', -855, 120, 28, ROLE.code, 'mono', 'left').opacity(
        alpha * (0.48 + 0.52 * wk),
      ),
      lumBar(barX, 120, 13.92 * px, 44, ROLE.ok, {
        opacity: alpha * (0.48 + 0.52 * wk),
        maxTrackW: maxW,
      }),
      lumBar(barX + 13.92 * px + 4, 120, 58.08 * px, 44, ROLE.code, {
        opacity: alpha * (0.48 + 0.52 * wk),
        glow: 8,
      }),
      txt(
        `58.08 GB -> ${POOL_Q4_HYB.users} users (hybrid)`,
        barX + maxW + 24,
        120,
        26,
        ROLE.code,
        'mono',
        'left',
      ).opacity(alpha * (0.48 + 0.52 * wk)),

      chipPill(
        wk > 0.35
          ? 'No user cache shrank, and serving 173 full KV caches still adds real HBM read bandwidth per token!'
          : 'Shrinking 54 GB weights to 13.92 GB triples the leftover KV pool (18.0 -> 58.08 GB: 53 -> 173 users)',
        0,
        265,
        {
          w: 1620,
          h: 78,
          color: wk > 0.35 ? ROLE.code : ROLE.ok,
          size: 26,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'pool-subtraction-build-0', (d) => s.play(showUsers.to(0, { duration: d })));
  playCue(s, c, 'pool-subtraction-build-1', (d) => s.play(showUsers.to(1, { duration: d })));
  playCue(s, c, 'pool-subtraction-build-2', (d) => s.play(showWork.to(1, { duration: d })));
}
