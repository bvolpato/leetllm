// Scene 10: How much weight do three mentions of "key" get? (BM25 k1 & b saturation curves)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function bm25Controls(s, c) {
  const phase = s.value(0);
  const showFormula = s.value(0);
  const showCred = s.value(0);
  const showCurve = s.value(0);
  const showK1Zero = s.value(0);
  const showKnobs = s.value(0);
  const showLucene = s.value(0);

  const bgAura = aura(0, 10, 680, '#13356026', '#2a1b4f14');
  const title = heroTitle(['How Much Weight Do', '3 Mentions of "key" Get?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'BM25 KNOBS · k1 SATURATION CEILING (k1+1 = 2.2) · b LENGTH NORMALIZATION',
  });

  // Precompute saturation curves for k1=1.2 and k1=0 (IDF=1, avg length)
  const gx0 = 135;
  const gy0 = 225;
  const gw = 690;
  const gh = 365;
  const maxY = 2.5;
  const buildCurve = (k1) => {
    const pts = [];
    for (let f = 1; f <= 20; f += 0.5) {
      const w = (f * (k1 + 1)) / (f + k1);
      const x = gx0 + ((f - 1) / 19) * gw;
      const y = gy0 - (w / maxY) * gh;
      pts.push([x, y]);
    }
    return pts;
  };
  const curve12 = buildCurve(1.2);
  const curve0 = buildCurve(0);
  const asymY = gy0 - (2.2 / maxY) * gh;

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sf = showFormula.value;
    const sc = showCred.value;
    const sv = showCurve.value;
    const sz = showK1Zero.value;
    const sk = showKnobs.value;
    const sl = showLucene.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const f20w = (20 * 2.2) / (20 + 1.2);
    const f3w = (3 * 2.2) / (3 + 1.2);

    const nodes = [
      // Left: Rotation guide breakdown + knob summary
      txt('ROTATION GUIDE (|d|=11, avgdl=8)', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),
      glassCell(-465, -95, 760, 148, sc > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#10203a',
        glow: sc > 0.3 ? 8 * pulse : 3,
      }),
      txt(
        'api (f=1):  ~ +0.60   |   key (f=3):  ~ +1.05',
        -820,
        -128,
        27,
        COSMOS.gold,
        'mono',
        'left',
      ),
      txt('3 mentions of "key" earn < 1.6x one mention', -820, -84, 26, COSMOS.ink, 'sans', 'left'),
      txt(
        'Total puts Rotation guide ahead of Quota page',
        -820,
        -46,
        26,
        COSMOS.emerald,
        'sans',
        'left',
      ),

      glassCell(-465, 86, 760, 148, sk > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#11182c',
        glow: sk > 0.3 ? 8 * pulse : 2,
      }),
      txt('TWO MAIN KNOBS', -820, 48, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        'k1 = 0 -> binary presence (every hit = 1.0)',
        -820,
        88,
        26,
        sz > 0.3 ? COSMOS.rose : COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        'b = 0 ignores length  |  b = 1 full length ratio',
        -820,
        126,
        26,
        COSMOS.amber,
        'sans',
        'left',
      ),

      glassCell(-465, 245, 760, 108, sl > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: sl > 0.3 ? '#0e2624' : '#12182b',
        glow: sl > 0.3 ? 7 : 2,
      }),
      txt('LUCENE 10.5.1 NOTE', -820, 224, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        'Drops (k1+1) constant & encodes length norms',
        -820,
        264,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      // Right: Interactive saturation curve plot (f = 1..20)
      txt('TF WEIGHT vs COUNT (IDF=1, AVG LENGTH)', gx0, -205, 26, COSMOS.gold, 'mono', 'left'),
      line([gx0, gy0], [gx0 + gw, gy0], { stroke: COSMOS.muted, width: 2.2 }),
      line([gx0, gy0], [gx0, gy0 - gh], { stroke: COSMOS.muted, width: 2.2 }),
      line([gx0, asymY], [gx0 + gw, asymY], { stroke: COSMOS.amber, width: 2, dash: [10, 8] }),
      txt('asymptote k1 + 1 = 2.2', gx0 + gw - 175, asymY - 28, 26, COSMOS.amber, 'mono'),

      glowingTrail(curve12, {
        color: COSMOS.cyan,
        width: 4.5,
        glow: sv > 0.3 ? 10 * pulse : 4,
        opacity: Math.max(0.75, sf),
      }),

      glowingTrail(curve0, {
        color: COSMOS.rose,
        width: 3.6,
        glow: sz > 0.3 ? 8 * pulse : 2,
        opacity: Math.max(0.45, sz),
      }),

      // Dots at f=1, f=3, f=20
      glowDot(gx0, gy0 - (1 / maxY) * gh, { radius: 8, color: COSMOS.emerald }),
      txt('f=1 -> 1.00', gx0 + 18, gy0 - (1 / maxY) * gh + 36, 26, COSMOS.emerald, 'mono', 'left'),

      glowDot(gx0 + (2 / 19) * gw, gy0 - (f3w / maxY) * gh, { radius: 8, color: COSMOS.gold }),
      txt(
        `f=3 -> ${f3w.toFixed(2)}`,
        gx0 + (2 / 19) * gw + 42,
        gy0 - (f3w / maxY) * gh + 44,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),

      glowDot(gx0 + gw, gy0 - (f20w / maxY) * gh, { radius: 8, color: COSMOS.cyan }),
      txt(
        `f=20 -> ${f20w.toFixed(2)}`,
        gx0 + gw - 195,
        gy0 - (f20w / maxY) * gh + 44,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      txt('k1 = 0 (flat 1.0)', gx0 + gw - 150, gy0 - (1 / maxY) * gh + 36, 26, COSMOS.rose, 'mono'),
      txt('term count f (1 to 20)', gx0 + gw / 2, gy0 + 44, 26, COSMOS.muted, 'mono'),

      glowDot(-840, 368, { radius: 6, color: COSMOS.gold }),
      txt(
        'Shifted IDF stays positive; compare BM25 scores only under one shared scoring convention',
        -812,
        370,
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

  c.on('bm25-tf-formula', () => s.play(showFormula.to(0.5, { duration: 0.35 })));
  c.on('bm25-length-formula', () => s.play(showFormula.to(0.8, { duration: 0.35 })));
  c.on('bm25-idf-formula', () => s.play(showFormula.to(1, { duration: 0.35 })));
  c.on('credential-api', () => s.play(showCred.to(0.4, { duration: 0.35 })));
  c.on('credential-key', () => s.play(showCred.to(0.75, { duration: 0.35 })));
  c.on('credential-total', () => s.play(showCred.to(1, { duration: 0.35 })));
  c.on('frequency-weights', () => s.play(showCurve.to(0.6, { duration: 0.4 })));
  c.on('frequency-limit', () => s.play(showCurve.to(1, { duration: 0.4 })));
  c.on('k1-zero', () => s.play(showK1Zero.to(1, { duration: 0.45 })));
  c.on('length-knobs', () => s.play(showKnobs.to(1, { duration: 0.45 })));
  c.on('lucene-scale', () =>
    s.play(showLucene.to(1, { duration: remainDuration(c, 'lucene-scale', 0.45) })),
  );
}
