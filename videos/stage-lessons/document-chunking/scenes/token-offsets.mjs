// Scene 7: What counts toward the embedding limit? (MiniLM 384d vs 256 wp, 12+3+2=17 -> 11+3+2=16, offsets)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  meterBar,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function tokenOffsets(s, c) {
  const showModel = s.value(0);
  const showTotal = s.value(0);
  const showShort = s.value(0);
  const showPrepend = s.value(0);
  const showParser = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2a1c5216');
  const title = heroTitle(['What Counts Toward', 'the Embedding Limit?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'TOKEN BUDGETS & OFFSETS · BODY + HEADING + SPECIAL TOKENS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const sm = showModel.value;
    const st = showTotal.value;
    const ss = showShort.value;
    const sp = showPrepend.value;
    const sr = showParser.value;

    const liveTotal = ss > 0.4 ? 16 : 17;
    const bodyToks = ss > 0.4 ? 11 : 12;

    const nodes = [
      // Left: MiniLM contract + 16-token limit budget test (strictly withhold 17 until st!)
      txt('1. OUTPUT DIM vs INPUT TOKEN LIMIT', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),
      glassCell(-455, -108, 810, 122, sm > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10213b',
        glow: sm > 0.3 ? 8 : 3,
      }),
      txt(
        'MiniLM output dim = 384   |   input cap = 256 wp',
        -825,
        -134,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(
        'Always tokenize FULL input (body + heading + specials)',
        -825,
        -86,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      txt('2. WORKED 16-TOKEN INPUT CAP', -855, 8, 26, COSMOS.gold, 'mono', 'left'),
      glassCell(
        -455,
        138,
        810,
        196,
        ss > 0.4 ? COSMOS.emerald : st > 0.4 ? COSMOS.rose : COSMOS.gold,
        {
          fill: ss > 0.4 ? '#0e2824' : st > 0.4 ? '#28111a' : '#181e34',
          glow: st > 0.4 ? 9 : 3,
        },
      ),
      txt(
        `Body: ${bodyToks}  +  Heading: 3  +  Special: 2`,
        -825,
        76,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ),
      meterBar(
        -825,
        128,
        730,
        28,
        Math.min(1, liveTotal / 16),
        ss > 0.4 ? COSMOS.emerald : COSMOS.rose,
      ),
      txt(
        ss > 0.4
          ? '11 + 3 + 2 = 16 / 16 -> ALL 16 FIT!'
          : st > 0.4
            ? '12 + 3 + 2 = 17 / 16 -> 1 TOKEN TRUNCATED!'
            : 'Will 12 body + 3 heading + 2 specials fit in 16?  ?',
        -825,
        184,
        26,
        ss > 0.4 ? COSMOS.emerald : st > 0.4 ? COSMOS.rose : COSMOS.gold,
        'mono',
        'left',
      ),

      // Right: Prepend copy vs Original body span + Recursive parser order
      txt(
        '3. QUOTE ORIGINAL SPAN, NOT PREPENDED COPY',
        110,
        -205,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      glassCell(495, -92, 760, 152, sp > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2624',
        glow: sp > 0.3 ? 8 : 2,
      }),
      txt(
        'Embedded copy: [source + heading] + body',
        145,
        -134,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        'Quoted span: original doc version + unit offsets',
        145,
        -90,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        'Record unit (chars / bytes / tokens) & norm map',
        145,
        -48,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      txt('4. STRUCTURE PARSER & RECURSIVE FALLBACK', 110, 32, 26, COSMOS.amber, 'mono', 'left'),
      glassCell(495, 152, 760, 168, sr > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: '#231b10',
        glow: sr > 0.3 ? 8 : 2,
      }),
      txt('Markdown ## -> keep PDF page + coordinates', 145, 108, 26, COSMOS.gold, 'mono', 'left'),
      txt(
        'Recursive split: \\n\\n -> \\n -> space -> char',
        145,
        154,
        26,
        COSMOS.ink,
        'mono',
        'left',
      ),
      txt(
        'Default counts chars -> verify final token length!',
        145,
        198,
        26,
        COSMOS.amber,
        'sans',
        'left',
      ),

      glowDot(-840, 355, { radius: 6, color: COSMOS.gold }),
      txt(
        'Re-check evidence completeness after shortening a chunk to fit the embedding token cap',
        -812,
        357,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('measure-full-input', () => s.play(showModel.to(0.4, { duration: 0.35 })));
  c.on('token-offsets-0', () => s.play(showModel.to(0.7, { duration: 0.35 })));
  c.on('token-model-contract', () => s.play(showModel.to(1, { duration: 0.35 })));
  c.after('token-total', () => s.play(showTotal.to(1, { duration: 0.45 })));
  c.on('shorter-child', () => s.play(showShort.to(0.6, { duration: 0.4 })));
  c.on('all-sixteen', () => s.play(showShort.to(1, { duration: 0.4 })));
  c.on('token-offsets-1', () => s.play(showPrepend.to(0.5, { duration: 0.35 })));
  c.on('prepend-labels', () => s.play(showPrepend.to(1, { duration: 0.4 })));
  c.on('token-offsets-2', () =>
    s.play(showParser.to(1, { duration: remainDuration(c, 'token-offsets-2', 0.45) })),
  );
}
