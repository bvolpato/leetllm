// Scene 22: Which words fit in eight tokens? (Keep-start truncation at 8 erases escalate vs grant + full-prompt drop)
import {
  COSMOS,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function truncationAudit(s, c) {
  const phase = s.value(0);
  const sIntro = s.value(0);
  const sCut = s.value(0);
  const sPrompt8 = s.value(0);
  const sDrop = s.value(0);
  const sAudit = s.value(0);

  const bgAura = aura(0, 20, 620, '#3c1b2a24', '#14385c24');
  const title = heroTitle(['Which Words Fit', 'in Eight Tokens?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'KEEP-START TRUNCATION AUDIT · MAX_LENGTH = 8 CAN ERASE THE LABEL',
  });

  const tokA = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'cite', 'P7', 'and', 'then', 'escalate', 'EOS'];
  const tokB = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'cite', 'P7', 'and', 'then', 'grant', 'EOS'];

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const cut = sCut.value;
    const p8 = sPrompt8.value;
    const dr = sDrop.value;
    const au = sAudit.value;

    const showPromptFill = p8 > 0.4 && au < 0.4;
    const x0 = -760;
    const stride = 136;
    const cutX = x0 + 8 * stride - 68;

    const nodes = [];

    if (showPromptFill) {
      nodes.push(
        txt(
          'CASE 2: PROMPT ALONE FILLS ALL 8 POSITIONS (0 REPLY TARGETS LEFT)',
          -855,
          -195,
          26,
          COSMOS.rose,
          'mono',
          'left',
        ),
        ...Array.from({ length: 8 }, (_, i) => {
          const cx = -720 + i * 204;
          return group(
            glassCell(cx, -65, 178, 92, COSMOS.blue, { fill: '#102138', glow: 6 }),
            txt(`P${i}`, cx, -63, 30, COSMOS.blue, 'mono'),
          );
        }),
        glassCell(0, 145, 1460, 136, dr > 0.3 ? COSMOS.rose : COSMOS.amber, {
          fill: dr > 0.3 ? '#29101a' : '#221c0e',
          glow: 10 * pulse,
        }),
        txt(
          dr > 0.3
            ? '0 REPLY TOKENS SURVIVE  ->  TRL DROPS THE ROW'
            : 'Prompt fills positions 0..7; no reply token fits inside max_length = 8',
          0,
          120,
          32,
          dr > 0.3 ? COSMOS.rose : COSMOS.gold,
          'mono',
        ),
        txt(
          'Count pairs before & after preparation; custom collators must verify >= 1 shifted reply target',
          0,
          176,
          26,
          COSMOS.ink,
          'sans',
        ),
      );
    } else {
      nodes.push(
        txt('CHOSEN (6 PROMPT + 6 REPLY)', -855, -206, 26, COSMOS.emerald, 'mono', 'left'),
        txt('REJECTED (6 PROMPT + 6 REPLY)', -855, 22, 26, COSMOS.rose, 'mono', 'left'),
      );

      [tokA, tokB].forEach((arr, r) => {
        const cy = r === 0 ? -120 : 108;
        arr.forEach((word, i) => {
          const cx = x0 + i * stride;
          const erased = cut > 0.45 && i >= 8;
          const isDiff = i === 10;
          const isPrompt = i < 6;
          const col = erased
            ? COSMOS.dim
            : isPrompt
              ? COSMOS.blue
              : isDiff
                ? COSMOS.gold
                : r === 0
                  ? COSMOS.emerald
                  : COSMOS.rose;
          nodes.push(
            glassCell(cx, cy, 126, 78, col, {
              fill: erased ? '#0b0e18' : isPrompt ? '#101d34' : isDiff ? '#261e0e' : '#12182b',
              glow: isDiff && !erased ? 8 * pulse : 3,
              opacity: erased ? 0.22 : 0.94,
            }),
            txt(word, cx, cy + 2, 26, col, 'sans').opacity(erased ? 0.25 : 0.96),
          );
        });
      });

      // Gold guillotine cut line at token 8
      nodes.push(
        line([cutX, -225], [cutX, 200], { stroke: COSMOS.gold, width: 4.5 }).glow(
          cut > 0.45 ? 12 * pulse : 5,
          COSMOS.gold,
        ),
        txt('CUT AT 8', cutX, 232, 26, COSMOS.gold, 'mono'),
      );
    }

    // Bottom verdict banner (strictly withheld until c.after('pa-truncate-cut'))
    nodes.push(
      glassCell(0, 344, 1680, 114, cut > 0.45 ? COSMOS.rose : COSMOS.amber, {
        fill: cut > 0.45 ? '#29101a' : '#1b1710',
        dash: cut > 0.45 ? undefined : [10, 6],
        glow: 8 * pulse,
      }),
      txt(
        au > 0.3
          ? 'BOTH REPLIES SCORE IDENTICAL TOKENS ("cite P7")  ·  CHECK TOKENIZER, TEMPLATE, EOS & DROPOUT'
          : cut > 0.45
            ? 'ERASED! Both surviving replies only read "cite P7" (escalate vs grant are gone!)'
            : 'If TRL keeps only the first 8 tokens, which reply words survive to be scored?  [ ? ]',
        0,
        346,
        26,
        cut > 0.45 ? COSMOS.rose : COSMOS.amber,
        'mono',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('truncation-audit-b0', () =>
    s.play(sIntro.to(1, { duration: remainDuration(c, 'truncation-audit-b0', 0.45) })),
  );
  c.after('pa-truncate-cut', () =>
    s.play(sCut.to(1, { duration: remainAfterDuration(c, 'pa-truncate-cut', 0.5) })),
  );
  c.on('truncation-audit-b1', () =>
    s.play(sPrompt8.to(1, { duration: remainDuration(c, 'truncation-audit-b1', 0.5) })),
  );
  c.on('pa-truncate-drop', () =>
    s.play(sDrop.to(1, { duration: remainDuration(c, 'pa-truncate-drop', 0.5) })),
  );
  c.on('truncation-audit-b2', () =>
    s.play(sAudit.to(1, { duration: remainDuration(c, 'truncation-audit-b2', 0.55) })),
  );
}
