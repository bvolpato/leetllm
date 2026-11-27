// Scene 20: The normal call path owns gather and reshard hooks (bottom-up fully_shard, model(x) vs model.forward(x), reshard_after_forward True/False/None/int).
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function fsdpHooks(s, c) {
  const stage = s.value(0); // 0=bottom-up fully_shard, 1=model(x) vs model.forward(x), 2=reshard policies + TP compose

  const bgAura = aura(0, 20, 620, '#5ce1e61e', '#60a5fa1c');
  const title = heroTitle(['Normal __call__ Owns', 'Gather & Reshard Hooks'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.copy,
    eyebrow: 'FULLY_SHARD BOTTOM-UP · HOOK LIFECYCLE',
  });

  const live = guardedDynamic(1, () => {
    const st = stage.value;

    const nodes = [
      // Top path: model(x) -> pre-hook all_gather -> forward -> post-hook reshard
      txt('CALL PATH COMPARISON', 0, -225, 28, COSMOS.gold, 'mono'),

      glassCell(-580, -110, 360, 134, ROLE.good, { fill: '#0d2924', glow: 9 }),
      txt('model(x)  (__call__)', -580, -140, 28, ROLE.good, 'mono'),
      txt('Normal Python entry', -580, -84, 26, COSMOS.ink, 'sans'),

      line([-394, -110], [-294, -110], { stroke: ROLE.good, width: 3.4 }),

      glassCell(-80, -110, 410, 134, ROLE.copy, { fill: '#0e222e', glow: 9 }),
      txt('Pre-Fwd Hook', -80, -140, 28, ROLE.copy, 'mono'),
      txt('All-Gather full weights', -80, -84, 26, COSMOS.ink, 'mono'),

      line([131, -110], [231, -110], { stroke: ROLE.good, width: 3.4 }),

      glassCell(490, -110, 500, 134, ROLE.orig, { fill: '#0f1d36', glow: 9 }),
      txt('Compute -> Post-Hook', 490, -140, 28, ROLE.orig, 'mono'),
      txt('Reshard per policy', 490, -84, 26, COSMOS.ink, 'mono'),
    ];

    if (st >= 1.5) {
      // Beat 2: reshard_after_forward policy table
      const pols = [
        { k: 'True', d: 'Free after fwd · re-gather bwd', col: ROLE.good, x: -570 },
        { k: 'False / None', d: 'Retain till bwd (None=root False)', col: ROLE.trans, x: 0 },
        { k: 'int / +TP', d: 'Smaller group · keep TP sharded', col: ROLE.copy, x: 570 },
      ];
      pols.forEach((pl) => {
        nodes.push(
          glassCell(pl.x, 140, 510, 178, pl.col, { fill: '#111b31', glow: 9 }),
          txt(`reshard = ${pl.k}`, pl.x, 96, 28, pl.col, 'mono'),
          txt(pl.d, pl.x, 162, 26, COSMOS.ink, 'sans'),
        );
      });
    } else {
      // Beat 0 & 1: Bottom-up vs direct forward() bypass
      nodes.push(
        glassCell(-430, 140, 760, 178, st < 0.5 ? ROLE.orig : COSMOS.dim, {
          fill: st < 0.5 ? '#0f1d36' : '#0b101d',
          glow: st < 0.5 ? 9 : 2,
        }),
        txt('APPLY fully_shard BOTTOM-UP', -430, 88, 28, ROLE.orig, 'mono'),
        txt('Wrap transformer blocks first, then root module', -430, 144, 26, COSMOS.ink, 'sans'),
        txt(
          'Default: Shard(0) on 1D or (Rep, Shard(0)) on 2D',
          -430,
          194,
          26,
          COSMOS.muted,
          'mono',
        ),

        glassCell(430, 140, 760, 178, st >= 0.5 ? ROLE.bad : COSMOS.dim, {
          fill: st >= 0.5 ? '#2d1222' : '#0b101d',
          glow: st >= 0.5 ? 10 : 2,
        }),
        txt(
          'model.forward(x) BYPASSES HOOKS!',
          430,
          88,
          28,
          st >= 0.5 ? ROLE.bad : COSMOS.dim,
          'mono',
        ),
        txt(
          'Leaves parameters sharded -> shape mismatch!',
          430,
          144,
          26,
          st >= 0.5 ? COSMOS.ink : COSMOS.dim,
          'sans',
        ),
        txt(
          'Use register_fsdp_forward_method() for encode()',
          430,
          194,
          26,
          st >= 0.5 ? COSMOS.gold : COSMOS.dim,
          'mono',
        ),
      );
    }

    nodes.push(
      txt(
        'Manual unshard() is NOT recursive and does not reproduce the full pre/post hook lifecycle',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('pt-fsdp-hooks-0', () => s.play(stage.to(0, { duration: 0.25 })));
  c.on('pt-fsdp-hooks-1', () =>
    s.play(stage.to(1, { duration: remainDuration(c, 'pt-fsdp-hooks-1', 0.45) })),
  );
  c.on('pt-fsdp-hooks-2', () =>
    s.play(stage.to(2, { duration: remainDuration(c, 'pt-fsdp-hooks-2', 0.45) })),
  );
}
