// Scene 10: A repeated suffix does not erase its earlier context (Shared prefix -> diverge on tickets -> repeated Label/Explanation not shared; early token break & schema in prompt).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function contextPosition(s, c) {
  const phase = s.value(0);
  // step: 0=shared prefix -> ticket divergence, 1=repeated Label/Explanation separate hidden states,
  // 2=early timestamp/template token breaks hit, 3=output-only grammar vs prompt-rendered schema
  const step = s.value(0);

  const bgAura = aura(0, 20, 640, '#5ce1e61a', '#a78bfa18');
  const title = heroTitle(['Repeated Suffixes Inherit', 'Earlier Context'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.grammar,
    eyebrow: 'CAUSAL ATTENTION · PREFIX DIVERGENCE & SCHEMA PLACEMENT',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const nodes = [];

    if (st < 2) {
      // Shared leading context block on the left
      nodes.push(
        txt('SHARED LEADING PREFIX', -560, -175, 26, ROLE.radix, 'mono'),
        glassCell(-560, -45, 560, 128, ROLE.radix, { fill: '#0e2436', glow: 9 }),
        txt('system + user opening', -560, -45, 30, ROLE.radix, 'mono'),
        line([-270, -45], [-160, -130], { color: ROLE.prefill, width: 3 }),
        line([-270, -45], [-160, 95], { color: ROLE.fail, width: 3 }),
      );

      // Diverged ticket R42
      nodes.push(
        glassCell(110, -130, 500, 118, ROLE.prefill, { fill: '#10213d', glow: 8 }),
        txt('R42 · Add dark mode', 110, -130, 28, ROLE.prefill, 'mono'),
        line([370, -130], [430, -130], { color: ROLE.prefill, width: 3 }),
        glassCell(640, -130, 400, 118, st >= 1 ? COSMOS.gold : ROLE.prefill, {
          fill: '#161b30',
          glow: 7,
        }),
        txt('Label / Explanation', 640, -152, 26, COSMOS.ink, 'mono'),
        txt('KV depends on R42', 640, -104, 26, COSMOS.gold, 'mono'),
      );

      // Diverged ticket R43
      nodes.push(
        glassCell(110, 95, 500, 118, ROLE.fail, { fill: '#2a1222', glow: 8 }),
        txt('R43 · Login throws 500', 110, 95, 28, ROLE.fail, 'mono'),
        line([370, 95], [430, 95], { color: ROLE.fail, width: 3 }),
        glassCell(640, 95, 400, 118, st >= 1 ? COSMOS.gold : ROLE.fail, {
          fill: '#1e1628',
          glow: 7,
        }),
        txt('Label / Explanation', 640, 73, 26, COSMOS.ink, 'mono'),
        txt('KV depends on R43', 640, 121, 26, ROLE.fail, 'mono'),
      );

      nodes.push(
        glassCell(0, 240, 1380, 74, ROLE.decode, { fill: '#0d2620', glow: 7 }),
        txt(
          'Same suffix strings after divergence have DIFFERENT hidden states (not shared across requests)',
          0,
          240,
          26,
          ROLE.decode,
          'sans',
        ),
      );
    } else {
      // Early token shift + schema placement comparison
      nodes.push(
        txt('STORED TEMPLATE PREFIX', -560, -180, 26, ROLE.radix, 'mono'),
        glassCell(-100, -180, 240, 76, ROLE.radix, { fill: '#0f2336', glow: 7 }),
        txt('system', -100, -180, 28, ROLE.radix, 'mono'),
        glassCell(170, -180, 240, 76, ROLE.radix, { fill: '#0f2336', glow: 7 }),
        txt('rules', 170, -180, 28, ROLE.radix, 'mono'),
        glassCell(440, -180, 240, 76, ROLE.radix, { fill: '#0f2336', glow: 7 }),
        txt('user', 440, -180, 28, ROLE.radix, 'mono'),

        txt('NEW REQUEST (EARLY SHIFT)', -560, -65, 26, ROLE.fail, 'mono'),
        glassCell(-100, -65, 240, 76, ROLE.fail, { fill: '#2c1120', glow: 10 }),
        txt('timestamp', -100, -65, 28, ROLE.fail, 'mono'),
        glassCell(170, -65, 240, 76, COSMOS.dim, { fill: '#0b101d', glow: 2 }),
        txt('rules', 170, -65, 28, COSMOS.dim, 'mono'),
        glassCell(440, -65, 240, 76, COSMOS.dim, { fill: '#0b101d', glow: 2 }),
        txt('user', 440, -65, 28, COSMOS.dim, 'mono'),

        txt(
          'First token differs -> longest cached hit drops to 0 immediately',
          0,
          32,
          28,
          ROLE.fail,
          'mono',
        ),
      );

      // Grammar placement comparison
      const schemaInPrompt = st >= 3;
      nodes.push(
        glassCell(-420, 185, 760, 150, ROLE.decode, { fill: '#0d2620', glow: 8 }),
        txt('OUTPUT-ONLY GRAMMAR MASK', -420, 148, 26, ROLE.decode, 'mono'),
        txt('Prompt KV stays reusable · per-request state', -420, 206, 26, COSMOS.ink, 'sans'),

        glassCell(420, 185, 760, 150, schemaInPrompt ? COSMOS.gold : COSMOS.dim, {
          fill: schemaInPrompt ? '#221c10' : '#0b101d',
          glow: schemaInPrompt ? 11 : 3,
        }),
        txt(
          'SCHEMA RENDERED IN PROMPT',
          420,
          148,
          26,
          schemaInPrompt ? COSMOS.gold : COSMOS.muted,
          'mono',
        ),
        txt(
          'Changes token IDs -> changes KV context',
          420,
          206,
          26,
          schemaInPrompt ? COSMOS.ink : COSMOS.dim,
          'sans',
        ),
      );
    }

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-720 + u * 1440, 308, { radius: 6, color: st >= 2 ? COSMOS.gold : ROLE.radix }),
      txt(
        st >= 3
          ? 'Schema in prompt changes tokens; output mask keeps KV.'
          : st >= 2
            ? 'An early timestamp, random ID, or model update invalidates prefix reuse from token 0.'
            : 'Inside one request, explanation reuses its own already processed label context.',
        0,
        360,
        28,
        COSMOS.ink,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['sg-context-position-beat-0', 0],
    ['sg-context-diverge', 1, true],
    ['sg-context-position-beat-1', 2],
    ['sg-context-early', 2, true],
    ['sg-context-schema', 3, true],
  ]);
}
