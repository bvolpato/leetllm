// Scene 02: What goes into R42's prompt? (select("label") resolves to "feature", appends to assistant text, submits bounded gen.)
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

export default function frontendProgram(s, c) {
  const phase = s.value(0);
  // step: 0=roles, 1=select choices pending, 2=feature returned, 3=appended to Label:, 4=gen explanation submitted
  const step = s.value(0);

  const bgAura = aura(0, 15, 640, '#60a5fa1c', '#5ce1e618');
  const title = heroTitle(['What Goes Into', 'R42 Prompt State?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.prefill,
    eyebrow: 'FRONTEND INTERPRETER · SELECT & BOUNDED GEN',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const nodes = [];

    // Left panel: select("label") call
    const returned = st >= 2;
    const appended = st >= 3;
    const submitted = st >= 4;

    nodes.push(
      glassCell(-470, 5, 680, 420, st >= 1 ? ROLE.radix : COSMOS.dim, {
        fill: '#0e172a',
        glow: st >= 1 ? 8 : 3,
      }),
      txt('sgl.select("label", choices)', -470, -155, 28, ROLE.radix, 'mono'),
      txt('bug   |   feature   |   question', -470, -90, 30, COSMOS.ink, 'mono'),
      glassCell(-470, 15, 360, 100, returned ? ROLE.decode : ROLE.warn, {
        fill: returned ? '#0d2922' : '#1d1810',
        glow: returned ? 11 : 6,
      }),
      txt(
        returned ? 'feature' : 'pending...',
        -470,
        15,
        38,
        returned ? ROLE.decode : ROLE.warn,
        'mono',
      ),
      txt(
        returned ? 'Stored under state["label"]' : 'Reading before ready blocks program',
        -470,
        130,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    // Connector beam
    nodes.push(
      line([-120, 15], [30, 15], { color: appended ? ROLE.radix : COSMOS.dim, width: 3.5 }),
    );

    // Right panel: assembled R42 prompt state + bounded gen
    nodes.push(
      glassCell(440, -55, 800, 300, ROLE.prefill, { fill: '#0e1b30', glow: 8 }),
      txt('ASSEMBLED PROMPT · R42', 440, -168, 26, ROLE.prefill, 'mono'),
      txt('system:', 75, -108, 26, COSMOS.muted, 'mono', 'left'),
      txt('Return concise, evidence-backed answers.', 235, -108, 26, COSMOS.ink, 'sans', 'left'),
      txt('user:', 75, -50, 26, COSMOS.muted, 'mono', 'left'),
      txt('Add dark mode to settings', 235, -50, 26, COSMOS.ink, 'sans', 'left'),
      txt('assistant:', 75, 16, 26, COSMOS.muted, 'mono', 'left'),
      txt(
        appended ? 'Label: feature' : 'Label: [ waiting ]',
        235,
        16,
        30,
        appended ? ROLE.radix : ROLE.warn,
        'mono',
        'left',
      ),
      glassCell(440, 180, 800, 130, submitted ? ROLE.decode : COSMOS.dim, {
        fill: submitted ? '#0d2820' : '#0b101d',
        glow: submitted ? 11 : 3,
      }),
      txt(
        'sgl.gen("explanation", max_tokens=64, stop="\\n")',
        440,
        148,
        26,
        submitted ? ROLE.decode : COSMOS.muted,
        'mono',
      ),
      txt(
        submitted
          ? 'SUBMITTED WITH LABEL: feature'
          : appended
            ? 'Ready to submit explanation'
            : 'Waiting for label slot',
        440,
        204,
        28,
        submitted ? ROLE.decode : appended ? COSMOS.gold : COSMOS.dim,
        'mono',
      ),
    );

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-120 + u * 150, 15, { radius: 6, color: appended ? ROLE.decode : COSMOS.gold }),
      txt(
        submitted
          ? 'Inspect the assembled prompt first before tracing GPU execution.'
          : appended
            ? 'Appended "feature" -> ready to submit.'
            : returned
              ? 'select("label") resolved to "feature".'
              : 'System prompt, user ticket, and assistant label field assemble in order.',
        0,
        355,
        28,
        submitted ? ROLE.decode : COSMOS.ink,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['program-roles', 0],
    ['program-choices', 1],
    ['program-feature', 2, true],
    ['program-append', 3, true],
    ['program-submit', 4, true],
  ]);
}
