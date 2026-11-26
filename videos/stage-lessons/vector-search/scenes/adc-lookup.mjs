// Scene 11: Scoring a stored code (ADC lookup tables, 96 KiB per query, code collision A vs B rerank, IVF residual coding)
import {
  COLL_FIX,
  COMP_FIX,
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function adcLookup(s, c) {
  const phase = s.value(0);
  const showAdc = s.value(0);
  const showTable = s.value(0);
  const showCollide = s.value(0);
  const showRerank = s.value(0);
  const showResid = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Scoring a', 'Stored Code'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'ASYMMETRIC DISTANCE COMPUTATION (ADC) · COLLISION RERANK · IVF RESIDUAL',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sa = showAdc.value;
    const st = showTable.value;
    const sc = showCollide.value;
    const sr = showRerank.value;
    const sd = showResid.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const t0 = COMP_FIX.tables[0];
    const t1 = COMP_FIX.tables[1];
    const origA = COLL_FIX.originals[0];
    const origB = COLL_FIX.originals[1];

    const nodes = [
      // Left: Uncompressed Query LUT (ADC)
      txt(
        '1. ASYMMETRIC DISTANCE LOOKUP (Q = [0,0,0,0])',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      glassCell(-465, -94, 780, 146, sa > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: sa > 0.3 ? 8 : 2,
      }),
      txt(
        `Row 0 LUT: [${t0.join(', ')}] (col 1 -> ${t0[1]})`,
        -825,
        -132,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(
        `Row 1 LUT: [${t1.join(', ')}] (col 2 -> ${t1[2]})`,
        -825,
        -88,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        'Code [1,2] -> LUT[0][1]+LUT[1][2] = 4+4 = 8',
        -825,
        -46,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),

      glassCell(-465, 108, 780, 186, st > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#12182d',
        glow: st > 0.3 ? 8 : 2,
      }),
      txt('ALL 4 CODES SCORED BY TABLE SUMS:', -825, 48, 26, COSMOS.gold, 'mono', 'left'),
      txt('[0,0]->0  [1,0]->4  [0,1]->4 (tie)  [1,1]->8', -825, 96, 26, COSMOS.ink, 'mono', 'left'),
      txt(
        `Per-query LUT: 96 x 256 x 4B = ${COMP_FIX.tableBytes / 1024} KiB`,
        -825,
        142,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(
        'Query stays uncompressed; DB stays 1 byte/chunk',
        -825,
        180,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      // Right top: Code collision [0,0] -> Overfetch & rerank originals -> B wins!
      txt('2. CODE COLLISION & ORIGINAL RERANK', 110, -205, 26, COSMOS.rose, 'mono', 'left'),

      glassCell(
        495,
        -88,
        750,
        160,
        sr > 0.3 ? COSMOS.emerald : sc > 0.3 ? COSMOS.rose : COSMOS.muted,
        {
          fill: sr > 0.3 ? '#0e2824' : '#26111a',
          glow: sc > 0.3 ? 9 * pulse : 2,
        },
      ),
      txt('A & B both encode [0,0] -> tie (A by ID)', 145, -132, 26, COSMOS.amber, 'mono', 'left'),
      txt(
        `True d^2: A=${origA.trueDistance2.toFixed(2)} vs B=${origB.trueDistance2.toFixed(2)} (B wins!)`,
        145,
        -86,
        26,
        sr > 0.3 ? COSMOS.emerald : COSMOS.rose,
        'mono',
        'left',
      ),
      txt(
        'Overfetch candidates & rescore original vectors',
        145,
        -42,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      // Right bottom: IVF Residual PQ (encode x - c, score q - c)
      txt('3. IVF-PQ RESIDUAL ENCODING', 110, 26, 26, COSMOS.cyan, 'mono', 'left'),

      glassCell(495, 146, 750, 168, sd > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#101d35',
        glow: sd > 0.3 ? 8 * pulse : 2,
      }),
      txt('Coarse center c = [10, 0, 10, 0]', 145, 92, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        'DB residual: x - c = [0.8, 0.8, 0.8, 0.8]',
        145,
        136,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt('Query residual: q - c (score with same c)', 145, 180, 26, COSMOS.gold, 'mono', 'left'),

      glowDot(-840, 358, { radius: 6, color: COSMOS.gold }),
      txt(
        'ADC replaces dot products with tiny table lookups; overfetch & rerank originals to fix ties',
        -812,
        360,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('adc-lookup-b1', () => s.play(showAdc.to(0.35, { duration: 0.3 })));
  c.on('adc-first-byte', () => s.play(showAdc.to(0.6, { duration: 0.3 })));
  c.on('adc-second-byte', () => s.play(showAdc.to(0.8, { duration: 0.3 })));
  c.on('adc-sum', () => s.play(showAdc.to(1, { duration: 0.35 })));
  c.on('adc-lookup-b2', () => s.play(showTable.to(0.35, { duration: 0.3 })));
  c.on('lookup-one-zero', () => s.play(showTable.to(0.6, { duration: 0.3 })));
  c.on('lookup-zero-one', () => s.play(showTable.to(0.8, { duration: 0.3 })));
  c.on('lookup-scores', () => s.play(showTable.to(1, { duration: 0.35 })));
  c.on('adc-lookup-b3', () => s.play(showCollide.to(0.5, { duration: 0.35 })));
  c.on('adc-original-order', () => s.play(showCollide.to(1, { duration: 0.35 })));
  c.on('adc-overfetch-originals', () => s.play(showRerank.to(1, { duration: 0.4 })));
  c.on('adc-database-residual', () => s.play(showResid.to(0.5, { duration: 0.35 })));
  c.on('adc-query-residual', () =>
    s.play(showResid.to(1, { duration: remainDuration(c, 'adc-query-residual', 0.45) })),
  );
}
