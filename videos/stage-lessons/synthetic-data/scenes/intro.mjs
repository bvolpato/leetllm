// Scene 01: Would you train on this answer? (Incomplete paginated client vs page-2 cursor + synthetic variation)
import {
  COSMOS,
  FIRST_PAGE_RUN,
  SEARCH_PAGES,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const phase = s.value(0);
  const sOutput = s.value(0);
  const sStops = s.value(0);
  const sToken = s.value(0);
  const sAsk = s.value(0);
  const sFollow = s.value(0);
  const sLinus = s.value(0);
  const sEnd = s.value(0);
  const sWithhold = s.value(0);
  const sMissing = s.value(0);

  const bgAura = aura(0, 10, 680, '#12385c2a', '#2d1c4d18');

  const title = heroTitle(['Would You Train on', 'This Answer?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'SYNTHETIC DATA PIPELINES · CURSOR PAGINATION & VERIFICATION',
  });

  const printed = FIRST_PAGE_RUN.result.items;
  const page1 = SEARCH_PAGES[0];
  const page2 = SEARCH_PAGES[1];

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const out = Math.max(0.72, sOutput.value);
    const st = sStops.value;
    const tk = Math.max(0.75, sToken.value);
    const ak = sAsk.value;
    const fl = sFollow.value;
    const ln = sLinus.value;
    const ed = sEnd.value;
    const wh = sWithhold.value;
    const ms = sMissing.value;

    const nodes = [
      // Left column: Search API results (Page 1 always pre-framed, Page 2 opens on follow-token)
      glassCell(-450, -68, 760, 224, COSMOS.blue, {
        fill: '#0e1d36',
        glow: 6,
      }),
      txt('SEARCH API · PAGE 1', -800, -144, 26, COSMOS.blue, 'mono', 'left'),
      txt('STATUS 200', -100, -144, 26, COSMOS.emerald, 'mono', 'right'),
      txt(page1.items.join('   ·   '), -800, -76, 48, COSMOS.ink, 'serif', 'left'),

      // Highlighted yellow cursor tab on Page 1
      glassCell(-258, -4, 340, 62, COSMOS.gold, {
        fill: sToken.value > 0.3 ? '#2c220c' : '#1b1812',
        glow: sToken.value > 0.3 ? 11 * pulse : 5,
        opacity: tk,
      }),
      txt(`next_cursor: "${page1.nextCursor}"`, -258, -2, 26, COSMOS.gold, 'mono').opacity(tk),

      // Page 2 chamber (pre-framed dim silhouette before follow-token, strictly withholding Linus/null!)
      glassCell(-450, 178, 760, 168, fl > 0.2 ? COSMOS.gold : COSMOS.rule, {
        fill: fl > 0.2 ? '#121d33' : '#0b101d',
        dash: fl > 0.2 ? undefined : [10, 8],
        glow: fl > 0.2 ? 7 : 0,
        opacity: Math.max(0.74, fl),
      }),
      txt(
        fl > 0.2 ? 'SEARCH API · PAGE 2' : 'NEXT PAGE (UNFETCHED BY CLIENT)',
        -800,
        122,
        26,
        fl > 0.2 ? COSMOS.gold : COSMOS.dim,
        'mono',
        'left',
      ),
      txt(
        ln > 0.5 ? page2.items[0] : '?',
        -800,
        188,
        ln > 0.5 ? 48 : 42,
        ln > 0.5 ? COSMOS.emerald : COSMOS.dim,
        ln > 0.5 ? 'serif' : 'mono',
        'left',
      ),
      txt(
        ed > 0.5 ? 'next_cursor: null  (list ends)' : 'cursor: pending...',
        -100,
        188,
        26,
        ed > 0.5 ? COSMOS.muted : COSMOS.dim,
        'mono',
        'right',
      ),

      // Right column: Generated client output terminal
      glassCell(445, 55, 780, 470, wh > 0.5 ? COSMOS.rose : COSMOS.cyan, {
        fill: wh > 0.5 ? '#26111a' : '#0e1b2d',
        glow: wh > 0.5 ? 10 * pulse : 6,
      }),
      txt('GENERATED CLIENT OUTPUT', 85, -142, 26, COSMOS.cyan, 'mono', 'left'),
      txt('PROMPT: fetch every name', 85, -90, 26, COSMOS.muted, 'mono', 'left'),
      line([85, -56], [800, -56], { stroke: COSMOS.rule, width: 2 }),

      txt(`1.  ${printed[0]}`, 105, 8, 46, COSMOS.ink, 'mono', 'left').opacity(out),
      txt(`2.  ${printed[1]}`, 105, 84, 46, COSMOS.ink, 'mono', 'left').opacity(out),
      txt(
        st > 0.3 ? '[STOPPED AFTER PAGE 1]' : 'reading page 1...',
        105,
        158,
        28,
        st > 0.3 ? COSMOS.amber : COSMOS.muted,
        'mono',
        'left',
      ),
      txt(
        wh > 0.5
          ? 'REJECT · missed Linus -> keep out of training'
          : ak > 0.3
            ? 'VERDICT: ?   Would you train on this answer?'
            : 'WAITING FOR CURSOR CHECK',
        105,
        232,
        26,
        wh > 0.5 ? COSMOS.rose : ak > 0.3 ? COSMOS.gold : COSMOS.dim,
        'mono',
        'left',
      ),
    ];

    // Glowing arc connecting page-2 tab down to Page 2 chamber
    if (fl > 0.15) {
      nodes.push(
        glowingArc([-258, 28], [-258, 92], 0, {
          color: COSMOS.gold,
          width: 4.2,
          opacity: fl,
        }),
        glowDot(-258, 28 + 64 * Math.min(1, fl), { radius: 7, color: COSMOS.gold, opacity: fl }),
      );
    }

    // Bottom rail: synthetic variation transformation
    nodes.push(
      glassCell(0, 368, 1690, 108, ms > 0.2 ? COSMOS.gold : COSMOS.rule, {
        fill: ms > 0.2 ? '#161b2e' : '#0b101d',
        glow: ms > 0.2 ? 7 : 0,
        opacity: Math.max(0.76, ms),
      }),
      txt('SEED: Fetch every name', -810, 368, 26, COSMOS.blue, 'mono', 'left'),
      txt(
        ms > 0.2
          ? 'SYNTHETIC: Retry 429, then fetch next page'
          : 'SYNTHETIC: awaiting seed transform...',
        -255,
        368,
        26,
        ms > 0.2 ? COSMOS.gold : COSMOS.dim,
        'mono',
        'left',
      ),
    );

    if (ms > 0.2) {
      nodes.push(
        glowingArc([-425, 368], [-285, 368], 0, { color: COSMOS.gold, width: 3.4, opacity: ms }),
        glowDot(-285, 368, { radius: 6, color: COSMOS.gold, opacity: ms }),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('client-output', () => s.play(sOutput.to(1, { duration: 0.45 })));
  c.on('client-stops', () => s.play(sStops.to(1, { duration: 0.45 })));
  c.on('page-token', () => s.play(sToken.to(1, { duration: 0.45 })));
  c.on('keep-question', () => s.play(sAsk.to(1, { duration: 0.45 })));
  c.on('follow-token', () => s.play(sFollow.to(1, { duration: 0.5 })));
  c.after('last-name', () => s.play(sLinus.to(1, { duration: 0.35 })));
  c.after('end-token', () => s.play(sEnd.to(1, { duration: 0.35 })));
  c.after('withhold-incomplete', () => s.play(sWithhold.to(1, { duration: 0.4 })));
  c.on('missing-case', () =>
    s.play(sMissing.to(1, { duration: remainDuration(c, 'missing-case', 0.5) })),
  );
}
