// Scene 16: inflation: Multilingual fertility tax (English 1x, Italian 1.6x, Shan 15x) + window/cost/latency impact.
import {
  COSMOS,
  ENGLISH_CELLS,
  ROLE,
  WINDOW_CELLS,
  aura,
  bindCueBeat,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function inflation(s, c) {
  const showStudy = s.value(0);
  const showShan = s.value(0);
  const showItalian = s.value(0);
  const showImpact = s.value(0);

  const bgAura = aura(0, 0, 740, '#461a2c26', '#16355c18');
  const title = heroTitle(['Multilingual Fertility:', 'same content, 15× tokens'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.warn,
  });

  const stageVis = s.value(1);
  const ratio = WINDOW_CELLS / ENGLISH_CELLS; // 15

  const layer = guardedDynamic(stageVis, (alpha) => {
    const st = showStudy.value;
    const sh = showShan.value;
    const it = showItalian.value;
    const imp = showImpact.value;
    const maxW = 920;
    const barX = -480;
    const nodes = [
      txt(
        'TOKENS FOR IDENTICAL TRANSLATED CONTENT (2023 STUDY)',
        -855,
        -210,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    // English baseline (1.0x)
    nodes.push(
      txt('English', -855, -110, 34, ROLE.ok, 'mono', 'left').opacity(alpha),
      lumBar(barX, -110, (maxW * 1.0) / ratio, 40, ROLE.ok, { opacity: alpha, maxTrackW: maxW }),
      txt('1.0×', barX + maxW + 38, -110, 34, ROLE.ok, 'mono', 'left').opacity(alpha),
    );

    // Italian (quiet track from t=0, illuminates on cue)
    const aIt = (0.45 + 0.55 * it) * alpha;
    nodes.push(
      txt('Italian', -855, -5, 34, ROLE.piece, 'mono', 'left').opacity(aIt),
      lumBar(barX, -5, Math.max(8, ((maxW * 1.6) / ratio) * Math.max(0.15, it)), 40, ROLE.piece, {
        opacity: aIt,
        maxTrackW: maxW,
      }),
      txt(it > 0.2 ? '1.6×' : '?×', barX + maxW + 38, -5, 34, ROLE.piece, 'mono', 'left').opacity(
        aIt,
      ),
    );

    // Shan (quiet track from t=0, illuminates on cue)
    const aSh = (0.45 + 0.55 * Math.max(sh, st * 0.4)) * alpha;
    nodes.push(
      txt('Shan', -855, 100, 34, ROLE.warn, 'mono', 'left').opacity(aSh),
      lumBar(barX, 100, maxW * Math.max(0.08, sh), 40, ROLE.warn, {
        opacity: aSh,
        maxTrackW: maxW,
      }),
      txt(sh > 0.2 ? `${ratio}×` : '?×', barX + maxW + 38, 100, 38, ROLE.warn, 'mono', 'left')
        .glow(sh > 0.2 ? 10 : 0, ROLE.warn)
        .opacity(aSh),
    );

    // Three downstream effects (quiet from t=0, illuminate on price cue)
    const aI = (0.45 + 0.55 * imp) * alpha;
    const gx = [-570, 0, 570];
    const gy = 270;
    const items = [
      { k: 'API PRICE', v: 'Scales per token', c: ROLE.merge },
      { k: 'CONTEXT WINDOW', v: '15× less fits', c: ROLE.warn },
      { k: 'LATENCY', v: 'Longer prefill & decode', c: ROLE.piece },
    ];
    items.forEach((item, idx) => {
      nodes.push(
        txt(item.k, gx[idx], gy, 26, item.c, 'mono', 'center')
          .glow(imp > 0.2 ? 6 : 0, item.c)
          .opacity(aI),
        txt(item.v, gx[idx], gy + 50, 30, COSMOS.ink, 'sans', 'center').opacity(aI),
      );
    });
    nodes.push(
      txt(
        'Measure fertility on your own languages before committing to a token budget',
        0,
        400,
        28,
        ROLE.ok,
        'sans',
        'center',
      )
        .glow(imp > 0.2 ? 6 : 0, ROLE.ok)
        .opacity(aI),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'study', (d) => s.play(showStudy.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'shan', (d) => s.play(showShan.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'italian', (d) => s.play(showItalian.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'price', (d) => s.play(showImpact.to(1, { duration: d })), { dur: 0.6 });
  bindCueBeat(s, c, s.value(0), ['fertility', 'widest', 'window', 'longer', 'measure']);
}
