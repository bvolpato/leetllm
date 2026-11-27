// Scene 01: Which ticket can SGLang explain? (Prediction scene: R43 login has label "bug", R42 dark mode pending.)
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function intro(s, c) {
  // step: 0=R43 bug lands, 1=R42 dark mode pending, 2=PREDICT HOLD (which can start?),
  // 3=copy bug into R43 prompt, 4=R43 explanation submitted, 5=R42 waits for label, 6=open R42 prompt
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#5ce1e61c', '#60a5fa18');
  const title = heroTitle(['Which Ticket Can', 'SGLang Explain?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.radix,
    eyebrow: 'SGLANG FRONTEND STATE · NAMED VARIABLE DEPENDENCY',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    // Column headers
    nodes.push(
      txt('SUPPORT TICKET', -520, -210, 26, COSMOS.muted, 'mono'),
      txt('LABEL SLOT', 80, -210, 26, COSMOS.muted, 'mono'),
      txt('EXPLANATION PROMPT', 560, -210, 26, COSMOS.muted, 'mono'),
    );

    // Row 1: R43 Login ticket
    const r43Y = -75;
    const r43Copied = st >= 3;
    const r43Sent = st >= 4;
    nodes.push(
      glassCell(-520, r43Y, 640, 140, ROLE.radix, { fill: '#0e1d30', glow: 9 }),
      txt('R43 · Login ticket', -805, r43Y - 28, 26, ROLE.radix, 'mono', 'left'),
      txt('Login button throws 500', -805, r43Y + 26, 32, COSMOS.ink, 'sans', 'left'),
      line([-190, r43Y], [-65, r43Y], { color: ROLE.radix, width: 3 }),
      glassCell(80, r43Y, 260, 108, ROLE.radix, { fill: '#102b38', glow: 10 }),
      txt('bug', 80, r43Y, 38, ROLE.radix, 'mono'),
      line([220, r43Y], [350, r43Y], { color: r43Copied ? ROLE.decode : COSMOS.dim, width: 3 }),
      glassCell(575, r43Y, 440, 140, r43Sent ? ROLE.decode : r43Copied ? ROLE.radix : ROLE.warn, {
        fill: r43Sent ? '#0d2922' : r43Copied ? '#0f2436' : '#151828',
        glow: r43Sent ? 11 : 6,
      }),
      txt(
        r43Copied ? 'Label: bug' : st >= 2 ? 'Ready to start?' : 'empty slot',
        575,
        r43Y - 22,
        30,
        r43Copied ? ROLE.radix : ROLE.warn,
        'mono',
      ),
      txt(
        r43Sent ? 'SUBMITTED TO SRT' : r43Copied ? 'Copied to prompt' : 'awaiting binding',
        575,
        r43Y + 30,
        26,
        r43Sent ? ROLE.decode : COSMOS.muted,
        'mono',
      ),
    );

    // Row 2: R42 Dark-mode ticket
    const r42Y = 145;
    const focusR42 = st >= 6;
    nodes.push(
      glassCell(-520, r42Y, 640, 140, focusR42 ? COSMOS.gold : ROLE.prefill, {
        fill: focusR42 ? '#201c12' : '#0f172a',
        glow: focusR42 ? 11 : 5,
      }),
      txt(
        'R42 · Dark-mode ticket',
        -805,
        r42Y - 28,
        26,
        focusR42 ? COSMOS.gold : ROLE.prefill,
        'mono',
        'left',
      ),
      txt('Add dark mode to settings', -805, r42Y + 26, 32, COSMOS.ink, 'sans', 'left'),
      line([-190, r42Y], [-65, r42Y], { color: COSMOS.dim, width: 2.5 }),
      glassCell(80, r42Y, 260, 108, ROLE.warn, { fill: '#1c1810', glow: 6 }),
      txt('pending', 80, r42Y, 32, ROLE.warn, 'mono'),
      line([220, r42Y], [350, r42Y], { color: COSMOS.dim, width: 2.5 }),
      glassCell(575, r42Y, 440, 140, COSMOS.dim, { fill: '#0b101d', glow: 2 }),
      txt('empty', 575, r42Y - 22, 30, COSMOS.dim, 'mono'),
      txt('waits for its label', 575, r42Y + 30, 26, COSMOS.muted, 'mono'),
    );

    nodes.push();

    const caption =
      st <= 1
        ? 'R43 received label "bug". R42 is still waiting for its label.'
        : st === 2
          ? 'Predict: Which ticket explanation can start right now?'
          : st === 3
            ? 'R43 starts: copy "bug"'
            : st === 4
              ? 'R43 explanation submitted to the serving runtime.'
              : st === 5
                ? 'R42 prompt stays empty until its own label arrives.'
                : 'Next: open R42 prompt.';

    nodes.push(txt(caption, 0, 355, 28, st === 2 ? COSMOS.gold : COSMOS.ink, 'sans'));
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['ticket-bug', 0],
    ['ticket-dark', 1],
    ['ticket-ask', 2],
    ['ticket-bind', 3, true],
    ['ticket-submit', 4, true],
    ['ticket-wait', 5, true],
    ['intro-return', 6],
  ]);
}
