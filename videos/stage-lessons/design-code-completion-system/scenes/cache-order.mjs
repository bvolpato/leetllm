// Scene 19: cache-order - Change one early token and follow dependent cached states
// Parallel PSM vs Suffix-First SPM strips showing how an early prefix edit invalidates downstream
// suffix KV in PSM while SPM preserves earlier suffix KV as the prefix grows!
import { group, line, rect } from 'vizmatic/stage';
import { COSMOS, ROLE, aura, cinemaHeader, clampDur, guardedDynamic, txt } from '../parts.mjs';

export default function cacheOrder(s, c) {
  const editOn = s.value(0);

  const header = cinemaHeader(
    'CAUSAL CACHE INVALIDATION',
    'Change one early token,',
    'trace invalid states',
    {
      x: -860,
      y: -445,
      accent: ROLE.warn,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#f59e0b1a', '#6ee7b716');

  const view = guardedDynamic(
    () => 1,
    () => {
      const ed = editOn.value;
      const nodes = [];

      // Row 1: PSM (Early prefix edit invalidates ALL following prefix + suffix KV!)
      const y1 = -125;
      nodes.push(
        txt(
          'PSM: EDITING EARLY PREFIX INVALIDATES SUFFIX KV TOO!',
          -780,
          y1 - 62,
          26,
          ed > 0.4 ? ROLE.fail : ROLE.ed,
          'mono',
          'left',
        ),
        rect(280, 54, { fill: '#0b1428', stroke: ROLE.ok, width: 3, radius: 8 }).at(-640, y1),
        txt('HEAD OK', -640, y1, 26, ROLE.ok, 'mono', 'center'),
        rect(260, 54, {
          fill: '#0b1428',
          stroke: ed > 0.4 ? ROLE.fail : ROLE.ed,
          width: 3,
          radius: 8,
        }).at(-340, y1),
        txt(
          ed > 0.4 ? 'EDIT!' : 'PREFIX',
          -340,
          y1,
          26,
          ed > 0.4 ? ROLE.fail : ROLE.ed,
          'mono',
          'center',
        ),
        rect(540, 54, {
          fill: '#0b1428',
          stroke: ed > 0.4 ? ROLE.fail : ROLE.ok,
          width: 3,
          radius: 8,
        })
          .at(90, y1)
          .glow(ed > 0.4 ? 8 : 0, ROLE.fail),
        txt(
          ed > 0.4 ? 'SUFFIX KV INVALIDATED!' : 'SUFFIX KV',
          90,
          y1,
          26,
          ed > 0.4 ? ROLE.fail : ROLE.ok,
          'mono',
          'center',
        ),
        txt('96 vs 35 ms', 580, y1, 26, ROLE.focus, 'mono', 'center'),
      );

      // Row 2: Suffix-First SPM (Suffix stays cached while prefix grows at the end!)
      const y2 = 65;
      const eAlpha = 0.45 + ed * 0.55;
      nodes.push(
        txt(
          'SUFFIX-FIRST SPM: SUFFIX KV SURVIVES PREFIX GROWTH!',
          -780,
          y2 - 62,
          26,
          ROLE.ok,
          'mono',
          'left',
        ).opacity(eAlpha),
        rect(540, 54, { fill: '#0b1428', stroke: ROLE.ok, width: 3.4, radius: 8 })
          .at(-510, y2)
          .glow(8, ROLE.ok)
          .opacity(eAlpha),
        txt('SUFFIX KV REUSED!', -510, y2, 26, ROLE.ok, 'mono', 'center').opacity(eAlpha),
        rect(380, 54, { fill: '#0b1428', stroke: ROLE.ed, width: 3, radius: 8 })
          .at(-20, y2)
          .opacity(eAlpha),
        txt('GROWING PREFIX', -20, y2, 26, ROLE.ed, 'mono', 'center').opacity(eAlpha),
        rect(340, 54, { fill: '#0b1428', stroke: ROLE.focus, width: 3, radius: 8 })
          .at(370, y2)
          .opacity(eAlpha),
        txt('NEW DELTA', 370, y2, 26, ROLE.focus, 'mono', 'center').opacity(eAlpha),
      );

      nodes.push(
        txt('MISS 96 ms · HIT 35 ms', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('72+24 vs 11+24 (queue/net separate)', 480, -378, 26, COSMOS.muted, 'mono', 'center'),
        line([-840, 185], [840, 185], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'Count exact full KV blocks after real tokenization; routing to a cold replica still loses the hit!',
          0,
          268,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('cc-cache-early-edit', () => {
    s.play(editOn.to(1, { duration: clampDur(c, c.cue('cc-cache-early-edit').start, 0.4) }));
  });
}
