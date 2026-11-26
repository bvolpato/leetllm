// Scene 2: context-and-memory - What travels with the receipt?
// Act 0: Live dense attention grid doubling 4x4 (16 pairs) -> 8x8 (64 pairs) alongside
// linear K/V cache strips doubling 4 -> 8 (KV cache accelerates prefixes, not search!).
// Act 1: CoALA 4-tier constellation (Working, Episodic PR, Semantic rule, Procedural playbook)
// showing a PR retains its episodic role even when copied into a prompt.
import { group, line, rect } from 'vizmatic/stage';
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
  guardedDynamic,
  memNode,
  txt,
} from '../parts.mjs';

export default function contextAndMemory(s, c) {
  const pulse = s.value(0);
  const kvOn = s.value(0);
  const doubleGrid = s.value(0); // 0 = 4x4 (16), 1 = 8x8 (64)
  const kvDouble = s.value(0);
  const coalaMode = s.value(0); // 0 = KV/attention geometry, 1 = CoALA tiers
  const epOn = s.value(0);
  const semOn = s.value(0);
  const procOn = s.value(0);
  const copyOn = s.value(0);

  const header = cinemaHeader(
    'CONTEXT, KV CACHE & COALA TIERS',
    'What travels with',
    'the receipt?',
    { accent: ROLE.prompt, size: 48 },
  );

  const stageAura = aura(180, 40, 620, '#5ce1e61e', '#a78bfa18');

  // Act 0: Dense Attention Pairs (16 -> 64) vs Linear KV Cache Strips (4 -> 8)
  const act0 = guardedDynamic(
    () => fadeOutHalf(coalaMode.value),
    (a) => {
      const kv = kvOn.value;
      const dg = doubleGrid.value;
      const kd = kvDouble.value;
      const nodes = [];

      const n = dg > 0.45 ? 8 : 4;
      const cell = dg > 0.45 ? 42 : 74;
      const gap = dg > 0.45 ? 6 : 10;
      const step = cell + gap;
      const gx0 = -640;
      const gy0 = -160;

      nodes.push(
        txt(
          dg > 0.45 ? 'DENSE PAIRS: 8 × 8 = 64  (QUADRATIC)' : 'DENSE PAIRS: 4 × 4 = 16',
          gx0 + n * step * 0.5 - 20,
          gy0 - 44,
          26,
          dg > 0.45 ? ROLE.fail : ROLE.prompt,
          'mono',
          'center',
        ).opacity(a),
      );

      for (let r = 0; r < n; r++) {
        for (let col = 0; col < n; col++) {
          const isNew = r >= 4 || col >= 4;
          const fill = isNew ? ROLE.fail : ROLE.prompt;
          nodes.push(
            rect(cell, cell, { fill, stroke: '#ffffff', width: 1, radius: 4 })
              .at(gx0 + col * step + cell * 0.5, gy0 + r * step + cell * 0.5)
              .opacity(a * (isNew ? 0.72 : 0.88)),
          );
        }
      }

      // Right: Linear K & V cache strips (4 -> 8)
      const rx = 55;
      const slots = kd > 0.45 ? 8 : 4;
      const sw = 72;
      const sGap = 12;

      nodes.push(
        txt('KV PREFIX CACHE STRIPS (LINEAR 2×)', rx, -165, 26, ROLE.ok, 'mono', 'left').opacity(
          a * (0.45 + kv * 0.55),
        ),
        txt('K', rx - 42, -75, 28, ROLE.prompt, 'mono', 'center').opacity(a * (0.45 + kv * 0.55)),
        txt('V', rx - 42, 25, 28, ROLE.policy, 'mono', 'center').opacity(a * (0.45 + kv * 0.55)),
      );

      for (let i = 0; i < slots; i++) {
        const sx = rx + i * (sw + sGap) + sw * 0.5;
        const isNew = i >= 4;
        nodes.push(
          rect(sw, 56, { fill: ROLE.prompt, stroke: '#ffffff', width: 1.2, radius: 6 })
            .at(sx, -75)
            .opacity(a * (0.4 + kv * 0.6) * (isNew ? 0.95 : 0.75)),
          rect(sw, 56, { fill: ROLE.policy, stroke: '#ffffff', width: 1.2, radius: 6 })
            .at(sx, 25)
            .opacity(a * (0.4 + kv * 0.6) * (isNew ? 0.95 : 0.75)),
        );
      }

      nodes.push(
        txt(
          'FlashAttention trims memory traffic · Pairs still grow O(N²)',
          rx,
          145,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
        txt(
          'KV cache reuses prefixes; searchable store still needed',
          rx,
          205,
          26,
          ROLE.focus,
          'mono',
          'left',
        )
          .glow(6, ROLE.focus)
          .opacity(a),
      );

      return group(...nodes);
    },
  );

  // Act 1: CoALA 4 Memory Types + Placement Independence
  const act1 = guardedDynamic(
    () => fadeInHalf(coalaMode.value),
    (a) => {
      const p = pulse.value;
      const ep = epOn.value;
      const sm = semOn.value;
      const pr = procOn.value;
      const cp = copyOn.value;
      const nodes = [];

      const tiers = [
        { x: -620, y: 10, label: 'WORKING', sub: 'Fresh replay + owner', col: ROLE.working, on: 1 },
        {
          x: -200,
          y: 10,
          label: 'EPISODIC',
          sub: 'Last week’s PR (event)',
          col: ROLE.episodic,
          on: 0.4 + ep * 0.6,
        },
        {
          x: 220,
          y: 10,
          label: 'SEMANTIC',
          sub: 'Verified retry rule',
          col: ROLE.semantic,
          on: 0.35 + sm * 0.65,
        },
        {
          x: 640,
          y: 10,
          label: 'PROCEDURAL',
          sub: 'Reviewed playbook',
          col: ROLE.procedural,
          on: 0.35 + pr * 0.65,
        },
      ];

      tiers.forEach((t) => {
        const m = memNode(t.x, t.y, t.label, t.col, { radius: 60, sub: t.sub, opacity: a * t.on });
        nodes.push(m.node);
      });

      if (cp > 0.05) {
        nodes.push(
          beamWithPhotons(
            [
              [-200, -90],
              [-620, -90],
            ],
            ROLE.episodic,
            p * 1.2,
            { alpha: a * cp, width: 3.8 },
          ),
          txt(
            'COPYING A PR INTO THE PROMPT KEEPS ITS EPISODIC ROLE (CONTENT != PLACEMENT)',
            0,
            275,
            26,
            ROLE.focus,
            'mono',
            'center',
          )
            .glow(7, ROLE.focus)
            .opacity(a * cp),
        );
      } else {
        nodes.push(
          line([-840, 220], [840, 220], { stroke: '#25355a', width: 2 }).opacity(a * 0.6),
          txt(
            'CoALA separates memory content type from where it is stored',
            0,
            275,
            28,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(a),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, act0, act1);
  driftValue(s, c, pulse, 5.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('context-and-memory-b1-1', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('context-and-memory-b1-1').start, 0.25) }));
  });
  c.on('context-and-memory-b2-1', () => {
    s.play(kvOn.to(1, { duration: clampDur(c, c.cue('context-and-memory-b2-1').start, 0.35) }));
  });
  c.on('dense-pairs', () => {
    s.play(doubleGrid.to(1, { duration: clampDur(c, c.cue('dense-pairs').start, 0.45) }));
  });
  c.on('linear-kv', () => {
    s.play(kvDouble.to(1, { duration: clampDur(c, c.cue('linear-kv').start, 0.45) }));
  });
  c.on('coala-episodic', () => {
    const t = c.cue('coala-episodic').start;
    s.play(coalaMode.to(1, { duration: clampDur(c, t, 0.35) }));
    s.play(epOn.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('coala-semantic', () => {
    s.play(semOn.to(1, { duration: clampDur(c, c.cue('coala-semantic').start, 0.35) }));
  });
  c.on('coala-procedural', () => {
    s.play(procOn.to(1, { duration: clampDur(c, c.cue('coala-procedural').start, 0.35) }));
  });
  c.on('episode-placement', () => {
    s.play(copyOn.to(1, { duration: clampDur(c, c.cue('episode-placement').start, 0.35) }));
  });
}
