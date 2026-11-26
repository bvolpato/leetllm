// Scene 32: Which reply should the ticket desk accept? (PREDICTION SCENE: Both {"label":"bug"} & {"label":"feature"} pass JSON schema; ticket desk accepts "feature"!)
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

export default function synthesis(s, c) {
  const phase = s.value(0);
  // step: 0=two JSON replies shown, 1=both pass JSON schema -> PREDICT HOLD ("Which one should the desk accept?"),
  // 2=accept "feature", send "bug" for review!
  const step = s.value(0);

  const bgAura = aura(0, 20, 640, '#6ee7b71a', '#ffd16618');
  const title = heroTitle(['Which Reply Should the', 'Ticket Desk Accept?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.decode,
    eyebrow: 'SYNTAX VALIDITY VS TASK CORRECTNESS · R42 DARK MODE',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const parsed = st >= 1;
    const decided = st >= 2;
    const nodes = [];

    // Ticket ground truth banner
    nodes.push(
      glassCell(0, -195, 1520, 88, COSMOS.gold, { fill: '#1f1b10', glow: 9 }),
      txt(
        'R42: "Add dark mode to settings"   |   Human reviewer category: feature',
        0,
        -195,
        28,
        COSMOS.gold,
        'mono',
      ),
    );

    // Column headers
    nodes.push(
      txt('COMPLETE JSON REPLY', -430, -96, 26, COSMOS.muted, 'mono'),
      txt('SCHEMA CHECK', 170, -96, 26, COSMOS.muted, 'mono'),
      txt('TICKET DESK', 560, -96, 26, COSMOS.muted, 'mono'),
    );

    const rows = [
      { json: '{"label": "bug"}', accept: false, y: 8 },
      { json: '{"label": "feature"}', accept: true, y: 175 },
    ];

    rows.forEach((r) => {
      const deskCol = !decided
        ? parsed
          ? COSMOS.gold
          : COSMOS.dim
        : r.accept
          ? ROLE.decode
          : ROLE.fail;
      const deskLbl = !decided ? (parsed ? 'Accept?' : 'Pending') : r.accept ? 'ACCEPT' : 'REVIEW';

      nodes.push(
        glassCell(-430, r.y, 660, 112, ROLE.prefill, { fill: '#10213d', glow: 8 }),
        txt(r.json, -430, r.y, 38, COSMOS.ink, 'mono'),

        line([-90, r.y], [-5, r.y], { color: parsed ? ROLE.radix : COSMOS.dim, width: 3 }),

        glassCell(170, r.y, 330, 112, parsed ? ROLE.radix : COSMOS.dim, {
          fill: parsed ? '#0e2436' : '#0b101d',
          glow: parsed ? 9 : 2,
        }),
        txt(
          parsed ? 'VALID JSON' : 'Unchecked',
          170,
          r.y,
          30,
          parsed ? ROLE.radix : COSMOS.dim,
          'mono',
        ),

        line([345, r.y], [395, r.y], { color: deskCol, width: 3 }),

        glassCell(560, r.y, 320, 112, deskCol, {
          fill: !decided ? '#181928' : r.accept ? '#0d2922' : '#2c1120',
          glow: decided || parsed ? 11 : 2,
        }),
        txt(deskLbl, 560, r.y, 34, deskCol, 'mono'),
      );
    });

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-720 + u * 1440, 290, { radius: 6, color: decided ? ROLE.decode : COSMOS.gold }),
      txt(
        decided
          ? 'Accept "feature" (matches ticket); route "bug" to review despite passing the same schema.'
          : parsed
            ? 'Predict: Both replies are valid JSON with allowed enum labels. Which should the desk accept?'
            : 'Both replies completed tokenization, cache lookup, scheduling, grammar, and detokenization.',
        0,
        355,
        28,
        parsed && !decided ? COSMOS.gold : decided ? ROLE.decode : COSMOS.ink,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['synthesis-output', 0],
    ['synthesis-parse', 1],
    ['synthesis-compare', 2, true],
  ]);
}
