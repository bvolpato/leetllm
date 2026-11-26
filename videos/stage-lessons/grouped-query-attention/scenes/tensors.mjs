// Scene 05: tensors - Magnified 3x4 Key/Value coordinate grids + live tensor shape morphing.
import {
  COSMOS,
  HEADS,
  ROLE,
  cinemaAtmosphere,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  range,
  rect,
  renderGqaRack2d,
  rule,
  runPhase,
  txt,
} from '../parts.mjs';

export default function tensors(s, c) {
  const phase = s.value(0);
  const mode = s.value(1); // starts GQA (2), opens to MHA (0), returns to GQA (1)
  const tokCount = s.value(2); // 2 -> 3 on 'append'
  const lit = s.value(-1);
  const showRow3 = s.value(0);
  const shapeStage = s.value(0); // 0=init, 1=twelve, 2=shape(8), 3=ask(?), 4=gqa(2)
  const showDecodeQ = s.value(0);
  const showPayload = s.value(0);

  const title = heroTitle(['Which dimension', 'belongs to storage?'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.key,
    eyebrow: 'TENSOR AXES · B × H_kv × T × d',
  });

  const payloadFormula = glowTex(
    String.raw`\text{Bytes} = 2 \cdot L \cdot B \cdot H_{kv} \cdot T \cdot d \cdot P`,
    { x: 380, y: 425, size: 34, color: ROLE.gold, glow: 6 },
  );

  const live = guardedDynamic(1, () => {
    const r3 = showRow3.value;
    const st = Math.round(shapeStage.value);
    const dq = showDecodeQ.value;
    const pay = showPayload.value;

    const nodes = [
      ...renderGqaRack2d({
        left: -855,
        top: -215,
        width: 700,
        height: 550,
        mode: mode.value,
        tokens: tokCount.value,
        slots: 4,
        lit: lit.value,
        cursor: -1,
        phase: phase.value,
        colNames: ['Rain', 'fell', '2', '3'],
      }),
      rule(-95, -310, -95, 410, COSMOS.rule, 1.6).opacity(0.6),
      txt(
        'INSIDE ONE STORED HEAD · ONE LAYER (T = 3, d = 4)',
        380,
        -325,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ),
    ];

    // Two side-by-side luminous 3x4 coordinate grids: Key (blue) and Value (emerald)
    const grids = [
      { label: 'Key coordinates', cx: 155, col: ROLE.key },
      { label: 'Value coordinates', cx: 605, col: ROLE.value },
    ];
    const cellW = 76;
    const cellH = 56;
    const gapX = 12;
    const gapY = 12;
    const gridTop = -215;

    for (const g of grids) {
      const totalW = HEADS.width * cellW + (HEADS.width - 1) * gapX;
      const x0 = g.cx - totalW / 2;
      nodes.push(txt(g.label, g.cx, gridTop - 42, 28, g.col, 'sans', 'center'));

      for (const t of range(HEADS.tokens)) {
        const cy = gridTop + t * (cellH + gapY) + cellH / 2;
        if (g.col === ROLE.key) {
          nodes.push(txt(`t${t}`, x0 - 34, cy, 26, COSMOS.dim, 'mono', 'right'));
        }
        for (const d of range(HEADS.width)) {
          const cx = x0 + d * (cellW + gapX) + cellW / 2;
          const isThird = t === HEADS.tokens - 1;
          nodes.push(
            rect(cellW, cellH, {
              fill: '#0d1527',
              stroke: '#27365a',
              width: 1.6,
              radius: 7,
              dash: isThird ? [6, 5] : undefined,
            }).at(cx, cy),
          );
          const cellOp = isThird ? r3 : 1;
          if (cellOp > 0.02) {
            nodes.push(
              lumBar(cx, cy, cellW - 4, cellH - 4, {
                color: g.col,
                fillOpacity: isThird ? 0.45 : 0.34,
                strokeWidth: isThird ? 2.4 : 1.8,
                glow: isThird ? 9 : 4,
                radius: 6,
                opacity: cellOp,
              }),
            );
          }
        }
      }
    }

    // Tensor shape readout with strict withholding on 'ask' -> 'gqa'
    const axisY = 66;
    nodes.push(
      txt(
        'requests  ×  heads  ×  positions  ×  width',
        380,
        axisY,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ),
    );

    if (st >= 1) {
      let shapeText = 'Per head: 12 key + 12 value numbers';
      let shapeCol = COSMOS.ink;
      if (st === 2) {
        shapeText = 'K, V each:   1  ×  8  ×  3  ×  4';
        shapeCol = ROLE.key;
      } else if (st === 3) {
        shapeText = 'K, V each:   1  ×  ?  ×  3  ×  4';
        shapeCol = ROLE.gold;
      } else if (st >= 4) {
        shapeText = 'K, V each:   1  ×  2  ×  3  ×  4';
        shapeCol = ROLE.value;
      }
      nodes.push(
        txt(shapeText, 380, 145, 38, shapeCol, 'mono', 'center').glow(st >= 3 ? 9 : 5, shapeCol),
      );
    }

    if (dq > 0.02) {
      nodes.push(
        txt('New Q (decode):   1  ×  8  ×  1  ×  4', 380, 232, 34, ROLE.query, 'mono', 'center')
          .glow(7, ROLE.query)
          .opacity(dq),
      );
    }

    if (pay < 0.5 && st >= 2) {
      nodes.push(
        txt(
          'Width (4) and stored positions (3) stay fixed when heads group',
          380,
          325,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.key, ROLE.value), title, live);
  c.show('payload', payloadFormula, { fade: 0.4 });
  runPhase(s, c, phase, 14);

  playCue(
    s,
    c,
    'append',
    (d) => s.play(showRow3.to(1, { duration: d }), tokCount.to(HEADS.tokens, { duration: d })),
    { dur: 0.65 },
  );
  playCue(s, c, 'twelve', (d) => s.play(shapeStage.to(1, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.3,
  });
  playCue(s, c, 'mha', (d) => s.play(mode.to(0, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'shape', (d) => s.play(shapeStage.to(2, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.3,
  });
  playCue(s, c, 'ask', (d) => s.play(shapeStage.to(3, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
  playCue(
    s,
    c,
    'gqa',
    (d) => s.play(mode.to(1, { duration: d }), shapeStage.to(4, { duration: Math.min(0.25, d) })),
    { after: true, dur: 0.6 },
  );
  playCue(
    s,
    c,
    'queries',
    (d) => s.play(lit.to(7, { duration: 0.35 }), showDecodeQ.to(1, { duration: d })),
    { after: true, dur: 0.45 },
  );
  playCue(s, c, 'payload', (d) => s.play(showPayload.to(1, { duration: Math.min(0.3, d) })), {
    dur: 0.35,
  });
}
