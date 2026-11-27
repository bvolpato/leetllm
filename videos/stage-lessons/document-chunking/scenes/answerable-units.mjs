// Scene 2: What does the passage let you say? (Answerability vs 3-phrase negation trap)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  requiredPhrasesPresent,
  txt,
} from '../parts.mjs';

export default function answerableUnits(s, c) {
  const showMissing = s.value(0);
  const showEdit = s.value(0);
  const showSame = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2e1a4e16');
  const title = heroTitle(['What Does the Passage', 'Let You Say?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'ANSWERABLE UNITS · 3 REQUIRED FIELDS · NEGATION BLIND SPOT',
  });

  const negated = 'Rollback failure: DO NOT page on-call within 15 minutes with deploy ID.';
  const negatedPasses = requiredPhrasesPresent(negated);

  const live = guardedDynamic(s.value(1), () => {
    const sm = showMissing.value;
    const se = showEdit.value;
    const ss = showSame.value;

    const nodes = [
      // Left: Comparing the 3 cuts
      txt('THREE CUTS OF THE SAME PAGE', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),

      glassCell(-465, -110, 770, 114, COSMOS.rose, { fill: '#26111a', glow: 3 }),
      txt(
        'CUT 1: "Rollback failure: page on-call within"',
        -825,
        -134,
        26,
        COSMOS.amber,
        'mono',
        'left',
      ),
      txt('Has trigger, missing 15 min & deploy ID', -825, -88, 26, COSMOS.rose, 'sans', 'left'),

      glassCell(-465, 36, 770, 118, sm > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: '#26111a',
        glow: sm > 0.3 ? 8 : 2,
      }),
      txt(
        'CUT 2: "15 min + deploy ID. Archive in 14d."',
        -825,
        10,
        26,
        COSMOS.amber,
        'mono',
        'left',
      ),
      txt(
        'Missing trigger + mixes in unrelated archive rule!',
        -825,
        58,
        26,
        COSMOS.rose,
        'sans',
        'left',
      ),

      glassCell(-465, 190, 770, 118, COSMOS.emerald, { fill: '#0e2824', glow: 6 }),
      txt('CUT 3: Full 10-word paging sentence', -825, 164, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        'Matches all 3: rollback failure, 15 min, deploy ID',
        -825,
        212,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      // Right: Negation counterexample ("do not page on-call")
      txt('PHRASE-MATCH BLIND SPOT', 110, -205, 26, COSMOS.gold, 'mono', 'left'),

      glassCell(495, -52, 760, 224, se > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: se > 0.3 ? '#29111a' : '#12182b',
        glow: se > 0.3 ? 10 : 3,
      }),
      txt('INSERT "DO NOT" BEFORE "page on-call":', 145, -124, 26, COSMOS.gold, 'mono', 'left'),
      txt('"Rollback failure: DO NOT page on-call', 145, -72, 26, COSMOS.rose, 'mono', 'left'),
      txt(' within 15 minutes with deploy ID."', 145, -32, 26, COSMOS.rose, 'mono', 'left'),
      txt(
        ss > 0.4
          ? `3-phrase check: ${negatedPasses ? 'STILL PASSES (3/3)!' : 'FAILS'}`
          : 'Will the 3-phrase check change?  ?',
        145,
        24,
        27,
        ss > 0.4 ? COSMOS.rose : COSMOS.gold,
        'mono',
        'left',
      ),

      glassCell(495, 184, 760, 134, COSMOS.cyan, { fill: '#101c34', glow: 3 }),
      txt('TAKEAWAY FOR EVALUATION', 145, 150, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        'Phrase checks catch broken cuts, NOT negation.',
        145,
        192,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        'Review action, condition & exceptions directly!',
        145,
        228,
        26,
        COSMOS.emerald,
        'sans',
        'left',
      ),

      glowDot(-840, 355, { radius: 6, color: ss > 0.4 ? COSMOS.rose : COSMOS.gold }),
      txt(
        ss > 0.4
          ? 'Exact substring matching still passes when "do not" reverses the operational instruction!'
          : 'An answerable unit preserves the action, its governing condition, and any exceptions',
        -812,
        357,
        28,
        ss > 0.4 ? COSMOS.rose : COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('missing-trigger', () => s.play(showMissing.to(1, { duration: 0.45 })));
  c.on('edit-instruction', () => s.play(showEdit.to(1, { duration: 0.45 })));
  c.after('same-result', () =>
    s.play(showSame.to(1, { duration: remainDuration(c, 'same-result', 0.45) })),
  );
}
