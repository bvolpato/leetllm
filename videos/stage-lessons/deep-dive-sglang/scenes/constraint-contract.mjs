// Scene 17: How does the server choose a legal label? (Constraint backends + 0.05/0.95/47% normalization + empty legal set + token-limit truncation at colon.)
import {
  COSMOS,
  GRAMMAR_RAW,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function constraintContract(s, c) {
  const phase = s.value(0);
  // step:
  // 0 = JSON schema for label
  // 1 = server options: JSON schema / regex / EBNF
  // 2 = pinned Python gen: schema / regex
  // 3 = backends: XGrammar (default), llguidance, Outlines
  // 4 = 4 candidates raw weights (42 = 5%)
  // 5 = grammar rules out 42
  // 6 = remaining 3 keep 0.95 total weight
  // 7 = divide by 0.95 -> bug ~47% (0.474)
  // 8 = if all tokens ruled out -> stop sampling / error
  // 9 = reply reaches colon {"label":
  // 10 = max_tokens limit stops it -> incomplete JSON!
  const step = s.value(0);

  const bgAura = aura(0, 20, 640, '#a78bfa1c', '#5ce1e618');
  const title = heroTitle(['Server Constraints,', 'Weights & Truncation'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.grammar,
    eyebrow: 'XGRAMMAR · LLGUIDANCE · OUTLINES · FINISH REASON',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const nodes = [];

    if (st <= 3) {
      // Beat 0: Constraint contract & backends
      nodes.push(
        glassCell(0, -170, 1480, 108, ROLE.prefill, { fill: '#0e1e36', glow: 8 }),
        txt('{"enum": ["bug", "feature", "question"]}', 0, -170, 36, COSMOS.ink, 'mono'),

        glassCell(-420, 0, 720, 118, ROLE.radix, { fill: '#0e2436', glow: 8 }),
        txt('SERVER API (1 CONSTRAINT / REQ)', -420, -28, 26, ROLE.radix, 'mono'),
        txt(
          st >= 1 ? 'JSON schema  |  Regex  |  EBNF' : 'JSON schema',
          -420,
          24,
          28,
          COSMOS.ink,
          'mono',
        ),

        glassCell(420, 0, 720, 118, st >= 2 ? ROLE.prefill : COSMOS.dim, {
          fill: st >= 2 ? '#10213d' : '#0b101d',
          glow: st >= 2 ? 8 : 2,
        }),
        txt('PINNED PYTHON sgl.gen()', 420, -28, 26, st >= 2 ? ROLE.prefill : COSMOS.dim, 'mono'),
        txt(
          st >= 2 ? 'JSON schema  |  Regex' : 'subset of server options',
          420,
          24,
          28,
          st >= 2 ? COSMOS.ink : COSMOS.dim,
          'mono',
        ),

        glassCell(0, 180, 1480, 112, st >= 3 ? COSMOS.gold : COSMOS.dim, {
          fill: st >= 3 ? '#201c10' : '#0b101d',
          glow: st >= 3 ? 10 : 2,
        }),
        txt('BACKENDS', -660, 180, 26, COSMOS.gold, 'mono', 'left'),
        txt(
          st >= 3
            ? 'XGrammar (default, EBNF)  ·  llguidance (EBNF)  ·  Outlines (schema / regex)'
            : 'Documented grammar engines',
          -440,
          180,
          26,
          st >= 3 ? COSMOS.ink : COSMOS.dim,
          'sans',
          'left',
        ),
      );
    } else if (st <= 8) {
      // Beat 1: Candidate weights, masking 42, 0.95 mass, 47% renorm, empty set stop
      const masked = st >= 5;
      const showMass = st >= 6;
      const renorm = st >= 7;
      const emptySet = st >= 8;

      nodes.push(
        txt('CANDIDATE', -680, -205, 26, COSMOS.muted, 'mono', 'left'),
        txt('MODEL', -350, -205, 26, ROLE.prefill, 'mono'),
        txt(
          emptySet ? 'EMPTY LEGAL SET' : renorm ? 'NORMALIZED PROB' : 'MASKED WEIGHT',
          180,
          -205,
          26,
          emptySet ? ROLE.fail : ROLE.radix,
          'mono',
        ),
      );

      GRAMMAR_RAW.labels.forEach((lbl, i) => {
        const y = -125 + i * 78;
        const ok = GRAMMAR_RAW.allowed[i];
        const raw = GRAMMAR_RAW.raw[i];
        const prob = GRAMMAR_RAW.probabilities[i];
        const val = emptySet ? 0 : renorm ? prob : masked && !ok ? 0 : raw;
        const col = emptySet || (masked && !ok) ? ROLE.fail : ROLE.radix;
        const barMax = 680;
        const bw = Math.max(4, barMax * val);

        nodes.push(
          txt(lbl, -680, y, 30, col, 'mono', 'left'),
          txt(raw.toFixed(2), -350, y, 28, ROLE.prefill, 'mono'),
          rect(barMax, 34, { fill: '#0b1220', stroke: '#334155', width: 2, radius: 6 }).at(120, y),
          rect(bw, 30, { fill: col, stroke: null, radius: 5 }).at(-220 + bw / 2, y),
          txt(
            emptySet ? 'BLOCKED' : renorm ? prob.toFixed(3) : val.toFixed(2),
            560,
            y,
            28,
            col,
            'mono',
            'left',
          ),
        );
      });

      const mathLine = emptySet
        ? '0 legal tokens -> stop sampling, return error or mark incomplete'
        : renorm
          ? 'bug: 0.45 / 0.95 = 0.474 (~47%)  ·  remaining labels sum to 1.000'
          : showMass
            ? 'Allowed labels keep mass: 0.45 + 0.35 + 0.15 = 0.95'
            : masked
              ? 'Number 42 (5%) is ruled out by the JSON schema'
              : 'Four raw candidates before grammar masking';

      nodes.push(
        glassCell(0, 228, 1460, 86, emptySet ? ROLE.fail : COSMOS.gold, {
          fill: emptySet ? '#2c1120' : '#1e1a10',
          glow: 9,
        }),
        txt(mathLine, 0, 228, 28, emptySet ? ROLE.fail : COSMOS.gold, 'mono'),
      );
    } else {
      // Beat 2: Truncation at colon due to token limit
      const stopped = st >= 10;
      nodes.push(
        txt('STREAMING CONSTRAINED REPLY', 0, -185, 28, ROLE.prefill, 'mono'),
        glassCell(0, -45, 1320, 175, stopped ? ROLE.fail : ROLE.radix, {
          fill: stopped ? '#261120' : '#0e2036',
          glow: 11,
        }),
        txt(stopped ? '{"label":' : '{"label": |', 0, -45, 72, COSMOS.ink, 'mono'),
        glassCell(0, 165, 1320, 115, stopped ? ROLE.fail : COSMOS.gold, {
          fill: stopped ? '#2c1120' : '#1e1a10',
          glow: 9,
        }),
        txt(
          stopped
            ? 'STOPPED BY MAX_TOKENS: missing label value & closing "}"!'
            : 'Reply reaches the colon before max_tokens fires...',
          0,
          165,
          30,
          stopped ? ROLE.fail : COSMOS.gold,
          'mono',
        ),
      );
    }

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-720 + u * 1440, 305, {
        radius: 6,
        color: st >= 10 || st === 8 ? ROLE.fail : ROLE.grammar,
      }),
      txt(
        st >= 10
          ? 'Always check finish reason, validate parsed JSON against schema, then check label accuracy.'
          : st >= 4
            ? 'Masking removes illegal logits before renormalization and sampling.'
            : 'Use server API with XGrammar or llguidance when you need EBNF grammars.',
        0,
        355,
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
    ['sg-constraint-contract-beat-0', 0],
    ['constraint-server-options', 1],
    ['constraint-frontend', 2],
    ['constraint-backends', 3],
    ['sg-constraint-contract-beat-1', 4],
    ['sg-constraint-mask', 5, true],
    ['sg-constraint-mass', 6, true],
    ['sg-constraint-normalize', 7, true],
    ['sg-constraint-empty', 8, true],
    ['sg-constraint-contract-beat-2', 9],
    ['constraint-limit', 10, true],
  ]);
}
