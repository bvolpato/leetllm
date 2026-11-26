// Scene 06: budget - Byte-scale comparison of MHA, GQA, and MQA against a glowing 256 B limit.
import {
  COSMOS,
  HEADS,
  ROLE,
  cacheBytes,
  cinemaAtmosphere,
  group,
  guardedDynamic,
  heroTitle,
  line,
  lumBar,
  playCue,
  rect,
  renderGqaRack2d,
  rule,
  runPhase,
  txt,
} from '../parts.mjs';

export default function budget(s, c) {
  const maxBytes = cacheBytes({ kvHeads: HEADS.mhaKV, tokens: 4 }); // 1024 B
  const limitBytes = 256;

  const phase = s.value(0);
  const rackTokens = s.value(3);
  const barMha = s.value(0);
  const barGqa = s.value(0);
  const barMqa = s.value(0);

  const showMha = s.value(0);
  const showGqa = s.value(0);
  const showMqa = s.value(0);
  const showLimit = s.value(0);
  const showFourthGqa = s.value(0);
  const showCompare = s.value(0);
  const footStage = s.value(0); // 0=none, 1=fixture, 2=limit, 3=ask, 4=fit, 5=scope

  const title = heroTitle(['Can the next', 'token fit?'], {
    x: -855,
    y: -445,
    size: 52,
    lineHeight: 60,
    accent: ROLE.gold,
    eyebrow: 'RAW KV BYTE BUDGET · 2 LAYERS · 2 B/NUM',
  });

  const live = guardedDynamic(1, () => {
    const lim = showLimit.value;
    const fg = showFourthGqa.value;
    const cmp = showCompare.value;
    const fs = Math.round(footStage.value);

    const nodes = [
      ...renderGqaRack2d({
        left: -855,
        top: -215,
        width: 700,
        height: 550,
        mode: 1,
        tokens: rackTokens.value,
        slots: 4,
        lit: -1,
        cursor: fg > 0.5 ? 3 : -1,
        phase: phase.value,
        colNames: ['Rain', 'fell', '2', '3'],
      }),
      rule(-95, -310, -95, 400, COSMOS.rule, 1.6).opacity(0.6),
      txt('RAW KV BYTES · SHARED 0–1,024 B SCALE', 390, -315, 26, COSMOS.muted, 'mono', 'center'),
    ];

    const barLeft = 10;
    const barW = 790;
    const barH = 44;
    const rows = [
      {
        name: 'MHA',
        heads: HEADS.mhaKV,
        val: barMha.value,
        shown: showMha.value,
        grown: cmp,
        col: ROLE.alert,
        y: -145,
      },
      {
        name: 'GQA',
        heads: HEADS.gqaKV,
        val: barGqa.value,
        shown: showGqa.value,
        grown: fg,
        col: ROLE.value,
        y: 35,
      },
      {
        name: 'MQA',
        heads: HEADS.mqaKV,
        val: barMqa.value,
        shown: showMqa.value,
        grown: cmp,
        col: ROLE.key,
        y: 215,
      },
    ];

    for (const r of rows) {
      const b3 = cacheBytes({ kvHeads: r.heads, tokens: 3 });
      const b1 = cacheBytes({ kvHeads: r.heads, tokens: 1 });
      const b4 = cacheBytes({ kvHeads: r.heads, tokens: 4 });

      let labelText = `${r.name} · ${r.heads} ${r.heads === 1 ? 'head' : 'heads'}`;
      let labelCol = COSMOS.ink;
      if (r.grown > 0.5) {
        labelText = `${r.name}   ${b3} + ${b1} = ${b4} B`;
        labelCol = r.col;
      } else if (r.shown > 0.5) {
        labelText = `${r.name} · ${r.heads} ${r.heads === 1 ? 'head' : 'heads'}   (${b3} B)`;
      }

      nodes.push(
        txt(labelText, barLeft, r.y - 58, 32, labelCol, 'mono', 'left'),
        rect(barW, barH, { fill: '#0d1426', stroke: '#27365a', width: 1.8, radius: 7 }).at(
          barLeft + barW / 2,
          r.y,
        ),
      );

      if (r.val > 1) {
        const w = Math.max(6, (r.val / maxBytes) * barW);
        nodes.push(
          lumBar(barLeft + w / 2, r.y, w, barH - 4, {
            color: r.col,
            fillOpacity: 0.5,
            strokeWidth: 2.2,
            glow: r.name === 'GQA' && fg > 0.5 ? 11 : 6,
            radius: 6,
          }),
        );
      }

      // Highlight GQA 64 B remaining headroom during prediction ('ask')
      if (r.name === 'GQA' && fs === 3 && fg < 0.5) {
        const x192 = barLeft + (192 / maxBytes) * barW;
        const x256 = barLeft + (256 / maxBytes) * barW;
        nodes.push(
          lumBar((x192 + x256) / 2, r.y, x256 - x192 - 4, barH - 6, {
            color: ROLE.gold,
            fillOpacity: 0.25,
            strokeWidth: 2.4,
            dash: [6, 4],
            glow: 9,
            radius: 5,
          }),
          txt('+64 B room', x256 + 18, r.y, 26, ROLE.gold, 'mono', 'left'),
        );
      }
    }

    // Segmented vertical glowing 256 B budget laser markers across each bar track (never crossing text!)
    if (lim > 0.02) {
      const limX = barLeft + (limitBytes / maxBytes) * barW;
      for (const r of rows) {
        nodes.push(
          line([limX, r.y - barH / 2 - 4], [limX, r.y + barH / 2 + 4], {
            stroke: ROLE.gold,
            width: 4.4,
          })
            .glow(10, ROLE.gold)
            .opacity(lim),
        );
      }
      nodes.push(
        txt('256 B budget', limX, -258, 28, ROLE.gold, 'mono', 'center')
          .glow(6, ROLE.gold)
          .opacity(lim),
      );
    }

    // Scale tick labels under bottom row
    for (const v of [0, 256, 512, 768, 1024]) {
      const tx = barLeft + (v / maxBytes) * barW;
      nodes.push(
        txt(
          `${v} B`,
          tx,
          298,
          26,
          v === limitBytes && lim > 0.5 ? ROLE.gold : COSMOS.dim,
          'mono',
          'center',
        ),
      );
    }

    // Bottom floating status line (always accurate to visible state, A8)
    const footMap = [
      '',
      '1 head at 1 pos:  2 arrays × width 4 × 2 B × 2 layers = 32 B',
      'Gold budget line:  256 B available for raw KV cache',
      'GQA has 192 B + 64 B room. Will a 4th position fit?',
      'Fits exactly:  192 B + (2 heads × 32 B) = 256 B',
      'Raw cache only: devices also budget weights, temporaries, and replicas',
    ];
    if (fs > 0) {
      nodes.push(
        txt(
          footMap[fs],
          0,
          444,
          28,
          fs === 3 || fs === 4 ? ROLE.gold : COSMOS.muted,
          'sans',
          'center',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.gold, ROLE.value), title, live);
  runPhase(s, c, phase, 14);

  playCue(s, c, 'fixture', (d) => s.play(footStage.to(1, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.3,
  });
  playCue(
    s,
    c,
    'mha',
    (d) =>
      s.play(
        showMha.to(1, { duration: 0.2 }),
        barMha.to(cacheBytes({ kvHeads: HEADS.mhaKV, tokens: 3 }), { duration: d }),
      ),
    { after: true, dur: 0.55 },
  );
  playCue(
    s,
    c,
    'gqa',
    (d) =>
      s.play(
        showGqa.to(1, { duration: 0.2 }),
        barGqa.to(cacheBytes({ kvHeads: HEADS.gqaKV, tokens: 3 }), { duration: d }),
      ),
    { after: true, dur: 0.55 },
  );
  playCue(
    s,
    c,
    'mqa',
    (d) =>
      s.play(
        showMqa.to(1, { duration: 0.2 }),
        barMqa.to(cacheBytes({ kvHeads: HEADS.mqaKV, tokens: 3 }), { duration: d }),
      ),
    { after: true, dur: 0.55 },
  );
  playCue(
    s,
    c,
    'limit',
    (d) => s.play(showLimit.to(1, { duration: d }), footStage.to(2, { duration: 0.2 })),
    { dur: 0.45 },
  );
  playCue(s, c, 'ask', (d) => s.play(footStage.to(3, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
  playCue(s, c, 'fit', (d) => s.play(footStage.to(4, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.3,
  });
  playCue(
    s,
    c,
    'fourth',
    (d) =>
      s.play(
        showFourthGqa.to(1, { duration: 0.2 }),
        barGqa.to(cacheBytes({ kvHeads: HEADS.gqaKV, tokens: 4 }), { duration: d }),
        rackTokens.to(4, { duration: d }),
      ),
    { after: true, dur: 0.6 },
  );
  playCue(
    s,
    c,
    'compare',
    (d) =>
      s.play(
        showCompare.to(1, { duration: 0.2 }),
        barMha.to(cacheBytes({ kvHeads: HEADS.mhaKV, tokens: 4 }), { duration: d }),
        barMqa.to(cacheBytes({ kvHeads: HEADS.mqaKV, tokens: 4 }), { duration: d }),
      ),
    { dur: 0.6 },
  );
  playCue(s, c, 'scope', (d) => s.play(footStage.to(5, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
}
