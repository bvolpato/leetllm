// Scene 17: api-alignment: "Which mask row belongs to this query?"
// View 1 (Beat 0): 4x8 projected coordinates split into two 4x4 heads -> Q, K, V: [1, 2, 4, 4].
// View 2 (Beat 1): Boolean mask inversion: masked_fill (True = block) -> SDPA (True = allow) + dropout_p = 0.0.
// View 3 (Beats 2-3): Cached query at absolute pos 3 (local row 0): upper-left alignment selector locks row 0 ->
//         prediction question WITHHELD -> reveals only "function" (allclose=False even though winner="value") ->
//         selector slides smoothly down to row 3 -> allclose flips to emerald True!
import { arrow } from 'vizmatic/stage';
import { COSMOS, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  CACHE_RUNS,
  FEEDBACK_IDS,
  ROLE,
  VOCAB,
  cinemaAtmosphere,
  fmt,
  glowMatrix,
  lumBar,
  playCue,
  swapVis,
} from '../parts.mjs';

export default function apiAlignment(s, c) {
  const title = heroTitle(['PyTorch SDPA:', 'masks & cache alignment'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.attn,
  });

  const vSplit = s.value(1);
  const vBool = s.value(0);
  const vCache = s.value(0);

  const splitProg = s.value(0);
  const shapeDone = s.value(0);
  const allowShow = s.value(0);

  // View 3 channels (STRICT withholding during Beat 2!)
  const wrongLock = s.value(0); // Beat 2: locks selector on local row 0 (leaves question open!)
  const resultShow = s.value(0); // Beat 3 AFTER result: reveals "Only function" & allclose=False
  const repairSlide = s.value(0); // Beat 3: slides selector row 0 -> row 3
  const comparePass = s.value(0); // Beat 3: allclose=True

  // VIEW 1: 4x8 -> two 4x4 heads
  const coords4x8 = Array.from({ length: 4 }, (_, r) =>
    Array.from({ length: 8 }, (_, k) => `${r}${k}`),
  );
  const splitLayer = guardedDynamic(vSplit, (alpha) => {
    const sp = splitProg.value;
    const sd = shapeDone.value > 0.35;
    const cols8 = Array.from({ length: 4 }, () => [
      ROLE.stream,
      ROLE.stream,
      ROLE.stream,
      ROLE.stream,
      ROLE.mask,
      ROLE.mask,
      ROLE.mask,
      ROLE.mask,
    ]);
    const nodes = [
      txt(
        'B = 1  ·  T = 4 tokens  ·  d = 8  ->  2 heads of width 4',
        0,
        -275,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      glowMatrix({
        cx: -430,
        cy: 0,
        rows: 4,
        cols: 8,
        cellW: 78,
        cellH: 72,
        gap: 6,
        values: coords4x8,
        colors: cols8,
        fontSize: 26,
        opacity: alpha,
      }),
      txt('[1, 4, 8]', -430, 215, 28, ROLE.stream, 'mono', 'center').opacity(alpha),
    ];

    [0, 1].forEach((h) => {
      const cx = 190 + h * 410;
      const col = h === 0 ? ROLE.stream : ROLE.mask;
      const sub = Array.from({ length: 4 }, (_, r) =>
        Array.from({ length: 4 }, (_, k) => `${r}${k + h * 4}`),
      );
      nodes.push(
        txt(`head ${h}`, cx, -210, 28, col, 'mono', 'center').opacity((0.3 + 0.7 * sp) * alpha),
        glowMatrix({
          cx,
          cy: 0,
          rows: 4,
          cols: 4,
          cellW: 78,
          cellH: 72,
          gap: 6,
          values: sub,
          colors: sub.map((r) => r.map(() => col)),
          fontSize: 26,
          bracketColor: col,
          opacity: (0.25 + 0.75 * sp) * alpha,
        }),
      );
    });

    nodes.push(
      txt(
        sd
          ? 'Q, K, V shape:  [1, 2, 4, 4]  =  [B, h, T, d_h]'
          : 'Split projected feature axis across heads',
        0,
        325,
        34,
        ROLE.query,
        'mono',
        'center',
      )
        .glow(sd ? 8 : 0, ROLE.query)
        .opacity(alpha),
    );
    return nodes;
  });

  // VIEW 2: masked_fill (True = block) vs SDPA (True = allow)
  const boolLayer = guardedDynamic(vBool, (alpha) => {
    const al = allowShow.value > 0.35;
    const blockVals = Array.from({ length: 4 }, (_, r) =>
      Array.from({ length: 4 }, (_, k) => (k > r ? 'T' : 'F')),
    );
    const blockCols = Array.from({ length: 4 }, (_, r) =>
      Array.from({ length: 4 }, (_, k) => (k > r ? ROLE.mask : ROLE.rule)),
    );
    const allowVals = Array.from({ length: 4 }, (_, r) =>
      Array.from({ length: 4 }, (_, k) => (al ? (k <= r ? 'T' : 'F') : '?')),
    );
    const allowCols = Array.from({ length: 4 }, (_, r) =>
      Array.from({ length: 4 }, (_, k) => (al ? (k <= r ? ROLE.valid : ROLE.rule) : ROLE.query)),
    );

    return [
      txt('masked_fill: True = BLOCK', -420, -235, 32, ROLE.mask, 'mono', 'center').opacity(alpha),
      glowMatrix({
        cx: -420,
        cy: 15,
        rows: 4,
        cols: 4,
        cellW: 112,
        cellH: 82,
        gap: 10,
        values: blockVals,
        colors: blockCols,
        dim: (r, k) => k <= r,
        fontSize: 30,
        bracketColor: ROLE.mask,
        opacity: alpha,
      }),
      arrow([-120, 15], [120, 15], { stroke: ROLE.valid, width: 4.5, tip: 16 })
        .glow(8, ROLE.valid)
        .opacity(alpha),
      txt('invert (~future)', 0, -28, 28, ROLE.query, 'mono', 'center').opacity(alpha),
      txt('PyTorch SDPA: True = ALLOW', 420, -235, 32, ROLE.valid, 'mono', 'center').opacity(alpha),
      glowMatrix({
        cx: 420,
        cy: 15,
        rows: 4,
        cols: 4,
        cellW: 112,
        cellH: 82,
        gap: 10,
        values: allowVals,
        colors: allowCols,
        dim: (r, k) => al && k > r,
        fontSize: 30,
        bracketColor: ROLE.valid,
        opacity: alpha,
      }),
      txt(
        'Pass explicit dropout_p = 0.0 for deterministic evaluation  (even under model.eval())',
        0,
        340,
        28,
        ROLE.query,
        'mono',
        'center',
      ).opacity(alpha),
    ];
  });

  // VIEW 3: Cached query at absolute position 3 (local row 0) -> upper-left bug vs aligned repair
  const { full, upperLeft, aligned } = CACHE_RUNS[1];
  const labels4 = FEEDBACK_IDS.map((i) => VOCAB[i]);

  const cacheLayer = guardedDynamic(vCache, (alpha) => {
    const wl = wrongLock.value;
    const rs = resultShow.value > 0.35;
    const rp = repairSlide.value;
    const cp = comparePass.value > 0.35;
    const isRepaired = rp > 0.9;
    const cached = isRepaired ? aligned : upperLeft;

    const gLeft = -610;
    const gTop = -148;
    const dx = 148;
    const dy = 96;
    const nodes = [
      txt(
        'Cached keys (positions 0..3)',
        gLeft + 1.5 * dx,
        -298,
        28,
        ROLE.stream,
        'mono',
        'center',
      ).opacity(alpha),
    ];

    labels4.forEach((word, k) => {
      nodes.push(txt(word, gLeft + k * dx, -236, 26, ROLE.stream, 'mono', 'center').opacity(alpha));
    });

    for (let r = 0; r < 4; r++) {
      const cy = gTop + r * dy;
      nodes.push(
        txt(
          `row ${r}`,
          gLeft - 92,
          cy,
          26,
          r === 3 ? ROLE.query : COSMOS.dim,
          'mono',
          'right',
        ).opacity(alpha),
      );
      for (let k = 0; k < 4; k++) {
        const cx = gLeft + k * dx;
        const legal = k <= r;
        nodes.push(
          lumBar(cx, cy, 130, 78, {
            color: legal ? ROLE.stream : ROLE.rule,
            fillOpacity: legal ? 0.24 : 0.08,
            strokeWidth: 1.6,
            glow: legal ? 4 : 0,
            opacity: alpha,
          }),
          txt(
            legal ? 'ok' : 'x',
            cx,
            cy,
            26,
            legal ? COSMOS.ink : COSMOS.dim,
            'mono',
            'center',
          ).opacity(alpha),
        );
      }
    }

    // Animated left pointer arrow glides cleanly down far-left margin (24px clear of row labels!)
    if (wl > 0.1) {
      const selY = gTop + 3 * dy * rp;
      const selCol = isRepaired ? ROLE.valid : rp > 0.05 ? ROLE.attn : ROLE.mask;
      nodes.push(
        arrow([-860, selY], [-808, selY], { stroke: selCol, width: 4.5, tip: 14 })
          .glow(10, selCol)
          .opacity(wl * alpha),
      );
      if (rp < 0.05 || rp > 0.95) {
        nodes.push(
          lumBar(gLeft + 1.5 * dx, selY, 4 * dx - 6, 86, {
            color: selCol,
            fillOpacity: 0.12,
            strokeWidth: 4,
            glow: 12,
            radius: 10,
            opacity: wl * alpha,
          }),
        );
      }
    }

    // Right status column
    const rx = 435;
    nodes.push(
      txt('1 cached query: "result"', rx, -240, 34, ROLE.query, 'mono', 'center')
        .glow(7, ROLE.query)
        .opacity(alpha),
      txt(
        'Absolute pos = 3   ·   Local row = 0',
        rx,
        -172,
        28,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
    );

    if (wl > 0.4 && !rs) {
      // Strictly WITHHOLD answer during Beat 2!
      nodes.push(
        txt(
          'is_causal=True selects upper-left row 0',
          rx,
          -65,
          28,
          ROLE.mask,
          'mono',
          'center',
        ).opacity(alpha),
        txt('Which word can supply a value?', rx, 45, 34, ROLE.query, 'serif', 'center')
          .glow(8, ROLE.query)
          .opacity(alpha),
      );
    }

    if (rs) {
      const statusCol = isRepaired ? ROLE.valid : ROLE.mask;
      const matches = isRepaired && cp;
      nodes.push(
        txt(
          isRepaired
            ? 'Aligned row 3: all 4 keys allowed'
            : 'Row 0 bug: ONLY "function" allowed (w=1)',
          rx,
          -65,
          28,
          statusCol,
          'mono',
          'center',
        )
          .glow(7, statusCol)
          .opacity(alpha),
        txt(
          `Full-prefix winner:  ${VOCAB[full.choice]}`,
          rx,
          20,
          28,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
        txt(
          `Cached winner:       ${VOCAB[cached.choice]}`,
          rx,
          75,
          28,
          COSMOS.ink,
          'mono',
          'center',
        ).opacity(alpha),
        txt(
          `read[0]:  full ${fmt(full.A.at(-1)[0], 3)}   vs   cached ${fmt(cached.read[0], 3)}`,
          rx,
          165,
          28,
          ROLE.query,
          'mono',
          'center',
        ).opacity(alpha),
        txt(
          `torch.allclose(cached, full):  ${matches ? 'True' : isRepaired ? '...' : 'False'}`,
          rx,
          255,
          32,
          matches ? ROLE.valid : ROLE.mask,
          'mono',
          'center',
        )
          .glow(9, matches ? ROLE.valid : ROLE.mask)
          .opacity(alpha),
      );
    }

    nodes.push(
      txt(
        rs && !isRepaired
          ? 'Both runs still pick "value", so checking only the word hides the bug!'
          : 'Always verify cached read vectors against the full-prefix read',
        0,
        390,
        28,
        rs && !isRepaired ? ROLE.amber : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.attn, ROLE.mask), title, splitLayer, boolLayer, cacheLayer);

  // Beat 0: head split [1, 2, 4, 4]
  playCue(s, c, 'tr-api-alignment-voice-0', (d) => s.play(splitProg.to(1, { duration: d })), {
    dur: 1.0,
  });
  playCue(s, c, 'tr-api-alignment-shape', (d) => s.play(shapeDone.to(1, { duration: d })), {
    dur: 0.65,
  });

  // Beat 1: boolean convention inversion
  playCue(
    s,
    c,
    'tr-api-alignment-voice-1',
    (d) => s.play(swapVis(vSplit, vBool, Math.min(0.65, d * 0.4))),
    { dur: 0.7, offset: -0.65 },
  );
  playCue(s, c, 'tr-api-alignment-allow', (d) => s.play(allowShow.to(1, { duration: d })), {
    dur: 0.65,
  });

  // Beat 2: cached query upper-left bug (swap cleanly right after beat-1-end; WITHHOLDS answer!)
  const b2Swap = c.cue('tr-api-alignment-wrong').start - 22.0;
  c.at(Math.max(0.2, b2Swap - c.start), () => {
    s.play(swapVis(vBool, vCache, 0.65));
  });
  playCue(s, c, 'tr-api-alignment-wrong', (d) => s.play(wrongLock.to(1, { duration: d })), {
    dur: 0.7,
  });

  // Beat 3: reveal bug result AFTER result cue -> repair slide to row 3 -> compare True!
  playCue(s, c, 'tr-api-alignment-result', (d) => s.play(resultShow.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'tr-api-alignment-repair', (d) => s.play(repairSlide.to(1, { duration: d })), {
    dur: 0.9,
  });
  playCue(s, c, 'tr-api-alignment-compare', (d) => s.play(comparePass.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
}
