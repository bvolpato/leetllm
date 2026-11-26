// Scene 13: What should the assistant learn to write? (Privacy preference pair -> DPO record & SFT target)
import {
  COSMOS,
  LOG_ANSWERS,
  SUPPORT_CHECKS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function safePreferences(s, c) {
  const phase = s.value(0);
  const sPolicy = s.value(0);
  const sOptions = s.value(0);
  const sAsk = s.value(0);
  const sWinner = s.value(0);
  const sChecked = s.value(0);
  const sPair = s.value(0);
  const sSafe = s.value(0);
  const sRejFn = s.value(0);
  const sCopy = s.value(0);
  const sKeepRej = s.value(0);
  const sLen = s.value(0);

  const bgAura = aura(0, 15, 680, '#123e3628', '#331a4018');

  const title = heroTitle(['What Should the Assistant', 'Learn to Write?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'PRIVACY BOUNDARY · PREFERENCE PAIRS & SFT TARGETS',
  });

  const ansA = SUPPORT_CHECKS[0];
  const ansB = SUPPORT_CHECKS[1];
  const wordsA = LOG_ANSWERS[0].answer.split(' ').length;
  const wordsB = LOG_ANSWERS[1].answer.split(' ').length;

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);
    const pol = Math.max(0.76, sPolicy.value);
    const opt = Math.max(0.72, sOptions.value);
    const ask = sAsk.value;
    const win = sWinner.value > 0.5;
    const chk = sChecked.value > 0.5;
    const pr = sPair.value > 0.3;
    const saf = sSafe.value > 0.5;
    const rjf = sRejFn.value > 0.5;
    const cpy = sCopy.value;
    const krj = sKeepRej.value > 0.3;
    const eqL = sLen.value > 0.3;

    const colA = win ? COSMOS.emerald : COSMOS.cyan;
    const colB = chk ? COSMOS.rose : COSMOS.cyan;

    const nodes = [
      // Top prompt & policy rail
      glassCell(0, -132, 1660, 152, COSMOS.blue, { fill: '#0e1d36', glow: 6, opacity: pol }),
      txt(
        pr ? 'PREFERENCE RECORD · SHARED SUPPORT PROMPT' : 'SUPPORT REQUEST PROMPT',
        -795,
        -178,
        26,
        COSMOS.blue,
        'mono',
        'left',
      ),
      txt(
        '"Put the customer email in the failed search log."',
        -795,
        -132,
        32,
        COSMOS.ink,
        'serif',
        'left',
      ),
      txt(
        'POLICY:   request_id PERMITTED   ·   customer_email PRIVATE',
        -795,
        -84,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),

      // Left answer: Answer A (request ID)
      glassCell(-430, 82, 790, 214, colA, {
        fill: win ? '#0e2824' : '#0f1d33',
        glow: win ? 9 * pulse : 5,
        opacity: opt,
      }),
      txt(
        saf
          ? 'CHOSEN  ->  declines email bypass'
          : win
            ? 'CHOSEN ANSWER (PERMITTED)'
            : 'PROPOSED ANSWER A',
        -795,
        12,
        26,
        colA,
        'mono',
        'left',
      ),
      txt(`"${ansA.answer}"`, -795, 76, 36, COSMOS.ink, 'serif', 'left'),
      txt(
        win
          ? `field: ${ansA.fields.join(', ')} [PASS]${eqL ? ` · ${wordsA} words` : ''}`
          : `field: pending...${eqL ? ` · ${wordsA} words` : ''}`,
        -795,
        142,
        26,
        win ? COSMOS.emerald : COSMOS.muted,
        'mono',
        'left',
      ),

      // Right answer: Answer B (customer email)
      glassCell(430, 82, 790, 214, colB, {
        fill: chk ? '#281119' : '#0f1d33',
        glow: krj ? 9 * pulse : chk ? 7 : 5,
        opacity: opt,
      }),
      txt(
        rjf
          ? 'REJECTED  ->  returns success after leak'
          : chk
            ? 'REJECTED ANSWER (EMAIL LEAK)'
            : 'PROPOSED ANSWER B',
        65,
        12,
        26,
        colB,
        'mono',
        'left',
      ),
      txt(`"${ansB.answer}"`, 65, 76, 36, COSMOS.ink, 'serif', 'left'),
      txt(
        chk
          ? `field: ${ansB.fields.join(', ')} [FAIL]${eqL ? ` · ${wordsB} words` : ''}`
          : `field: pending...${eqL ? ` · ${wordsB} words` : ''}`,
        65,
        142,
        26,
        chk ? COSMOS.rose : COSMOS.muted,
        'mono',
        'left',
      ),

      // Bottom SFT Target chamber (pre-framed dim silhouette, lights on sft-copy)
      glassCell(
        0,
        344,
        1660,
        126,
        cpy > 0.2 ? COSMOS.emerald : ask > 0.3 && !win ? COSMOS.gold : COSMOS.rule,
        {
          fill: cpy > 0.2 ? '#0d2622' : '#0c1222',
          glow: cpy > 0.2 ? 9 : 2,
        },
      ),
      txt(
        cpy > 0.2
          ? `SUPERVISED TARGET (SFT):   "${ansA.answer}"`
          : ask > 0.3 && !win
            ? 'PREDICT: Which answer belongs in the training target?'
            : 'TRAINING TARGET SLOT (AWAITING VERIFIED WINNER)',
        -795,
        318,
        30,
        cpy > 0.2 ? COSMOS.emerald : ask > 0.3 && !win ? COSMOS.gold : COSMOS.muted,
        'mono',
        'left',
      ),
      txt(
        eqL
          ? `Equal length (${wordsA} words vs ${wordsB} words): preference cannot be a verbosity shortcut · isolate untrusted code`
          : krj
            ? 'Keep unsafe completion in the REJECTED slot of the preference pair (never in SFT)'
            : 'Safe refusals are valid desired targets; verify against trusted policy checks',
        -795,
        374,
        26,
        eqL ? COSMOS.cyan : COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    if (cpy > 0.1) {
      nodes.push(
        glowingArc([-430, 192], [-430, 276], 0, {
          color: COSMOS.emerald,
          width: 4.2,
          opacity: cpy,
        }),
        glowDot(-430, 192 + 84 * Math.min(1, cpy), {
          radius: 7,
          color: COSMOS.emerald,
          opacity: cpy,
        }),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('log-policy', () => s.play(sPolicy.to(1, { duration: 0.4 })));
  c.on('log-options', () => s.play(sOptions.to(1, { duration: 0.45 })));
  c.on('log-question', () => s.play(sAsk.to(1, { duration: 0.4 })));
  c.after('log-winner', () => s.play(sWinner.to(1, { duration: 0.35 })));
  c.after('checked-fields', () => s.play(sChecked.to(1, { duration: 0.35 })));
  c.on('pair-fields', () => s.play(sPair.to(1, { duration: 0.4 })));
  c.after('safe-target', () => s.play(sSafe.to(1, { duration: 0.35 })));
  c.after('rejected-function-result', () => s.play(sRejFn.to(1, { duration: 0.35 })));
  c.on('sft-copy', () => s.play(sCopy.to(1, { duration: 0.6 })));
  c.on('keep-rejected', () => s.play(sKeepRej.to(1, { duration: 0.4 })));
  c.on('equal-length', () =>
    s.play(sLen.to(1, { duration: remainDuration(c, 'equal-length', 0.45) })),
  );
}
