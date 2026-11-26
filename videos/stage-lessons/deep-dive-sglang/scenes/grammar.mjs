// Scene 16: Grammar state changes the allowed next-token set (HERO 3D FSM + masking "42", renormalizing 0.95, advancing to "}", syntax vs accuracy).
import {
  COSMOS,
  GRAMMAR_RAW,
  ROLE,
  aura,
  buildGrammarFsm3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function grammar(s, c) {
  const phase = s.value(0);
  // step:
  // 0 = raw 4-token distribution (bug 0.45, feature 0.35, question 0.15, 42 0.05)
  // 1 = grammar masks invalid "42" -> 0 (legal mass = 0.95)
  // 2 = renormalize remaining 3 probabilities (0.474, 0.368, 0.158)
  // 3 = select category "bug"
  // 4 = grammar state advances -> next position allows only "}"
  // 5 = valid JSON {"label":"bug"}, yet task accuracy failed (dark mode != bug)
  const step = s.value(0);

  const bgAura = aura(460, 20, 560, '#a78bfa22', '#5ce1e618');
  const { view: fsm3d } = buildGrammarFsm3d(step, phase, { x: 475, y: 25, unit: 92 });

  const title = heroTitle(['Grammar Masks Illegal', 'Tokens Before Sampling'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.grammar,
    eyebrow: 'CONSTRAINED DECODING · MASK · RENORMALIZE · ADVANCE',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const masked = st >= 1;
    const renorm = st >= 2;
    const closing = st >= 4;
    const verdict = st >= 5;

    const nodes = [
      txt('3D CONSTRAINED FSM GRAPH', 475, -390, 26, ROLE.grammar, 'mono').glow(5, ROLE.grammar),
      txt(
        closing ? 'Next state: only "}" allowed' : 'Each request owns its grammar state',
        475,
        405,
        26,
        COSMOS.gold,
        'mono',
      ),
    ];

    // State strip
    nodes.push(
      glassCell(-420, -195, 860, 74, closing ? ROLE.decode : ROLE.prefill, {
        fill: closing ? '#0d2922' : '#10213d',
        glow: 8,
      }),
      txt(
        closing
          ? 'FSM State: CLOSURE  ->  only "}" legal'
          : st >= 3
            ? 'Selected: "bug"  ->  advancing FSM state'
            : 'R42 Ticket: "Add dark mode to settings"',
        -420,
        -195,
        26,
        closing ? ROLE.decode : COSMOS.gold,
        'mono',
      ),
    );

    const rows = closing
      ? [
          { lbl: '}', raw: 0.6, ok: true, prob: 1.0 },
          { lbl: ',', raw: 0.2, ok: false, prob: 0.0 },
          { lbl: '42', raw: 0.1, ok: false, prob: 0.0 },
          { lbl: 'bug', raw: 0.1, ok: false, prob: 0.0 },
        ]
      : GRAMMAR_RAW.labels.map((lbl, i) => ({
          lbl,
          raw: GRAMMAR_RAW.raw[i],
          ok: GRAMMAR_RAW.allowed[i],
          prob: GRAMMAR_RAW.probabilities[i],
        }));

    rows.forEach((r, i) => {
      const y = -98 + i * 74;
      const shownVal = closing ? (r.ok ? 1 : 0) : renorm ? r.prob : masked && !r.ok ? 0 : r.raw;
      const col = masked && !r.ok ? ROLE.fail : ROLE.radix;
      const barMax = 380;
      const bw = Math.max(4, barMax * shownVal);
      nodes.push(
        txt(r.lbl, -830, y, 28, col, 'mono', 'left'),
        txt(r.raw.toFixed(2), -620, y, 26, ROLE.prefill, 'mono'),
        rect(barMax, 28, { fill: '#0b1220', stroke: '#334155', width: 2, radius: 6 }).at(-350, y),
        rect(bw, 24, { fill: col, stroke: null, radius: 5 }).at(-540 + bw / 2, y),
        txt(
          masked && !r.ok
            ? 'MASK (0)'
            : renorm || closing
              ? shownVal.toFixed(3)
              : shownVal.toFixed(2),
          -55,
          y,
          26,
          col,
          'mono',
          'left',
        ),
      );
    });

    // Bottom readout card: legal mass or syntax vs accuracy verdict
    nodes.push(
      glassCell(-420, 228, 860, 112, verdict ? ROLE.fail : COSMOS.gold, {
        fill: verdict ? '#2c1120' : '#1e1a10',
        glow: 9,
      }),
      txt(
        verdict
          ? '{"label":"bug"}  ->  VALID JSON SYNTAX'
          : closing
            ? 'Closure step: 0.60 / 0.60 = 1.000'
            : renorm
              ? 'Renormalize: 0.45 / 0.95 = 0.474'
              : masked
                ? 'Masked "42" -> remaining legal mass = 0.95'
                : 'Unmasked model distribution (mass = 1.00)',
        -420,
        verdict || renorm ? 204 : 228,
        26,
        verdict ? ROLE.fail : COSMOS.gold,
        'mono',
      ),
    );
    if (verdict || renorm) {
      nodes.push(
        txt(
          verdict
            ? 'Task accuracy FAILED (expected feature)'
            : closing
              ? 'Only "}" is legal; every other token is masked'
              : 'Normalized allowed probabilities sum to 1.000',
          -420,
          252,
          26,
          verdict ? COSMOS.ink : COSMOS.muted,
          'sans',
        ),
      );
    }

    const caption = verdict
      ? 'Grammar guarantees syntax validity, never factual or task accuracy.'
      : 'Mask illegal candidates to zero, renormalize, sample, and advance the request FSM.';

    nodes.push(txt(caption, -855, 355, 26, COSMOS.ink, 'sans', 'left'));
    return group(...nodes);
  });

  s.add(bgAura, fsm3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, fsm3d, { theta: -0.2, phi: 0.9 });
  wireStepCues(s, c, step, [
    ['grammar-beat-1-focus-1', 0],
    ['grammar-mask-number', 1, true],
    ['grammar-beat-2-focus-1', 2, true],
    ['grammar-select-category', 3, true],
    ['grammar-close-object', 4, true],
    ['grammar-syntax-and-accuracy', 5, true],
    ['grammar-beat-3-focus-1', 6],
  ]);
}
