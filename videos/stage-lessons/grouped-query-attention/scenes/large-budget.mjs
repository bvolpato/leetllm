// Scene 08: large-budget - 72B-class KV cache payloads, 10 GiB concurrency lattice, and 1Mi growth.
import {
  COSMOS,
  LARGE_MODEL,
  ROLE,
  cacheBytes,
  chapterModel,
  cinemaAtmosphere,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rect,
  rule,
  runPhase,
  txt,
} from '../parts.mjs';

export default function largeBudget(s, c) {
  const model = chapterModel(c.id);
  const heads = [64, 8, 1];
  const retainedLens = [32 * 1024, 128 * 1024, 1024 * 1024];
  const longPayload = retainedLens.map((tokens) =>
    heads.map((kvHeads) =>
      cacheBytes({
        layers: LARGE_MODEL.layers,
        batch: 1,
        tokens,
        kvHeads,
        width: LARGE_MODEL.width,
        bytes: LARGE_MODEL.bytes,
      }),
    ),
  );
  const maxLong = longPayload[2][0]; // 2.75 TB (1Mi MHA)
  const poolBytes = 10 * 2 ** 30;
  const caps = model.large.map((raw) => Math.floor(poolBytes / (raw / 32))); // [1, 8, 64]

  const phase = s.value(0);
  const barVals = [s.value(0), s.value(0), s.value(0)];
  const showBar = [s.value(0), s.value(0), s.value(0)];
  const showWeight = s.value(0);
  const longStage = s.value(0); // 0=batch 32x4K, 1=long scale, 2=32Ki, 3=128Ki, 4=1Mi
  const poolStage = s.value(0); // 0=empty, 1=MHA(1), 2=GQA(8), 3=MQA(64)
  const showCap = s.value(0);
  const showRankNote = s.value(0);
  const showDims = s.value(0);

  const title = heroTitle(['Ten GiB of', 'raw KV cache'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.query,
    eyebrow: '72B-CLASS SCALE · 80 LAYERS · 64 QUERIES',
  });

  const fmtSize = (bytes) =>
    bytes >= 1e12
      ? `${(bytes / 1e12).toFixed(2)} TB`
      : `${Number((bytes / 1e9).toFixed(bytes >= 8e10 ? 1 : 2))} GB`;

  const live = guardedDynamic(1, () => {
    const ls = Math.round(longStage.value);
    const ps = Math.round(poolStage.value);
    const sw = showWeight.value;
    const sc = showCap.value;
    const rn = showRankNote.value;
    const dm = showDims.value;

    const nodes = [rule(50, -325, 50, 395, COSMOS.rule, 1.6).opacity(0.6)];

    // --- LEFT: 72B-class payload bars ---
    const leftX = -855;
    const barW = 810;
    const barH = 38;
    const scaleHeader =
      ls === 0
        ? 'RAW KV · 32 REQUESTS × 4,096 POSITIONS'
        : ls === 1
          ? 'LONG-CONTEXT SCALE (UP TO 1M POSITIONS)'
          : `1 REQUEST · ${retainedLens[ls - 2].toLocaleString('en-US')} POSITIONS`;
    nodes.push(txt(scaleHeader, leftX, -265, 26, COSMOS.muted, 'mono', 'left'));

    const specs = [
      { name: 'MHA (64 KV)', col: ROLE.alert, y: -155 },
      { name: 'GQA-8 (8 KV)', col: ROLE.query, y: -5 },
      { name: 'MQA (1 KV)', col: ROLE.value, y: 145 },
    ];
    specs.forEach((sp, i) => {
      const frac = barVals[i].value;
      const shown = showBar[i].value;
      let valLabel = sp.name;
      if (ls >= 2) {
        valLabel = `${sp.name}   ·   ${fmtSize(longPayload[ls - 2][i])}`;
      } else if (shown > 0.5) {
        valLabel = `${sp.name}   ·   ${fmtSize(model.large[i])}`;
      }
      nodes.push(
        txt(
          valLabel,
          leftX,
          sp.y - 46,
          30,
          shown > 0.5 || ls >= 2 ? sp.col : COSMOS.ink,
          'mono',
          'left',
        ),
        rect(barW, barH, { fill: '#0d1527', stroke: '#27375c', width: 1.6, radius: 6 }).at(
          leftX + barW / 2,
          sp.y,
        ),
      );
      if (frac > 0.002) {
        const w = Math.max(8, frac * barW);
        nodes.push(
          lumBar(leftX + w / 2, sp.y, w, barH - 4, {
            color: sp.col,
            fillOpacity: 0.5,
            strokeWidth: 2,
            glow: 8,
            radius: 5,
          }),
        );
      }
    });

    // Weight benchmark line (144 GB for 72B BF16 weights)
    if (sw > 0.02 && ls === 0) {
      const wFrac = 144e9 / model.large[0];
      const wx = leftX + wFrac * barW;
      nodes.push(
        txt('72B BF16 weights: 144 GB', leftX, 265, 28, ROLE.gold, 'mono', 'left').opacity(sw),
        lumBar(leftX + (wFrac * barW) / 2, 314, wFrac * barW, 24, {
          color: ROLE.gold,
          fillOpacity: 0.42,
          strokeWidth: 2,
          glow: 7,
          radius: 4,
          opacity: sw,
        }),
        txt('← 144 GB', wx + 18, 314, 26, ROLE.gold, 'mono', 'left').opacity(sw),
      );
    } else if (ls >= 1) {
      nodes.push(
        txt(
          'GQA-8 uses 1/8 of MHA at every context length',
          leftX,
          292,
          28,
          ROLE.query,
          'sans',
          'left',
        ),
      );
    }

    // --- RIGHT: 10 GiB VRAM Pool Lattice (8x8 grid) ---
    const gx0 = 155;
    const gy0 = -215;
    const gridW = 640;
    const gridH = 480;
    nodes.push(
      txt(
        '10 GiB RAW KV POOL (4K REQUESTS)',
        gx0 + gridW / 2,
        -265,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ),
      rect(gridW + 12, gridH + 12, { fill: '#0b1121', stroke: '#334674', width: 2, radius: 10 }).at(
        gx0 + gridW / 2,
        gy0 + gridH / 2,
      ),
    );

    const cellW = gridW / 8;
    const cellH = gridH / 8;

    if (ps === 0) {
      // Subtle empty 8x8 lattice
      for (let r = 0; r < 8; r++) {
        for (let col = 0; col < 8; col++) {
          nodes.push(
            rect(cellW - 8, cellH - 8, {
              fill: '#111930',
              stroke: '#223154',
              width: 1.2,
              radius: 4,
            }).at(gx0 + (col + 0.5) * cellW, gy0 + (r + 0.5) * cellH),
          );
        }
      }
    } else if (ps === 1) {
      // 1 MHA request fills the entire 10 GiB pool
      nodes.push(
        lumBar(gx0 + gridW / 2, gy0 + gridH / 2, gridW - 10, gridH - 10, {
          color: ROLE.alert,
          fillOpacity: 0.36,
          strokeWidth: 3,
          glow: 11,
          radius: 8,
        }),
        txt(
          '1 MHA request',
          gx0 + gridW / 2,
          gy0 + gridH / 2 - 22,
          40,
          COSMOS.ink,
          'serif',
          'center',
        ),
        txt(
          '10.0 GiB / request',
          gx0 + gridW / 2,
          gy0 + gridH / 2 + 30,
          30,
          ROLE.alert,
          'mono',
          'center',
        ),
      );
    } else if (ps === 2) {
      // 8 GQA-8 horizontal strips (1.25 GiB each)
      for (let r = 0; r < 8; r++) {
        const cy = gy0 + (r + 0.5) * cellH;
        nodes.push(
          lumBar(gx0 + gridW / 2, cy, gridW - 12, cellH - 8, {
            color: ROLE.query,
            fillOpacity: r === 0 ? 0.5 : 0.3,
            strokeWidth: r === 0 ? 2.6 : 1.8,
            glow: r === 0 ? 10 : 4,
            radius: 5,
          }),
        );
      }
      nodes.push(
        txt('1.25 GiB strip', gx0 + gridW / 2, gy0 + 0.5 * cellH, 26, COSMOS.ink, 'mono', 'center'),
      );
    } else if (ps >= 3) {
      // 64 MQA tiles (0.15625 GiB each)
      for (let r = 0; r < 8; r++) {
        for (let col = 0; col < 8; col++) {
          const active = r === 0 && col === 0;
          nodes.push(
            lumBar(gx0 + (col + 0.5) * cellW, gy0 + (r + 0.5) * cellH, cellW - 8, cellH - 8, {
              color: active ? ROLE.gold : ROLE.value,
              fillOpacity: active ? 0.65 : 0.36,
              strokeWidth: active ? 2.6 : 1.5,
              glow: active ? 10 : 3,
              radius: 4,
            }),
          );
        }
      }
    }

    // Readout beneath the 10 GiB pool
    const poolCaption =
      sc > 0.5
        ? `Fits: MHA ${caps[0]} · GQA-8 ${caps[1]} · MQA ${caps[2]}`
        : ps === 1
          ? 'MHA: 10 GiB / request'
          : ps === 2
            ? 'GQA-8: 1.25 GiB / request'
            : ps === 3
              ? 'MQA: 0.156 GiB / request'
              : '10 GiB raw cache pool';
    nodes.push(
      txt(
        poolCaption,
        gx0 + gridW / 2,
        326,
        30,
        sc > 0.5 ? ROLE.gold : COSMOS.ink,
        'mono',
        'center',
      ).glow(sc > 0.5 ? 7 : 0, ROLE.gold),
    );

    // Bottom floating footer
    const footText =
      rn > 0.5
        ? 'Byte division is only a lower bound: TP also requires a valid head-sharding split'
        : dm > 0.5
          ? '80 full-attention layers  ·  64 queries  ·  width 128  ·  2 B/number'
          : '';
    if (footText) {
      nodes.push(txt(footText, 0, 444, 28, rn > 0.5 ? ROLE.gold : COSMOS.muted, 'sans', 'center'));
    }

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.query, ROLE.alert), title, live);
  runPhase(s, c, phase, 14);

  playCue(s, c, 'dimensions', (d) => s.play(showDims.to(1, { duration: Math.min(0.3, d) })), {
    dur: 0.35,
  });
  playCue(
    s,
    c,
    'mha',
    (d) => s.play(showBar[0].to(1, { duration: 0.2 }), barVals[0].to(1, { duration: d })),
    { after: true, dur: 0.55 },
  );
  playCue(
    s,
    c,
    'gqa',
    (d) =>
      s.play(
        showBar[1].to(1, { duration: 0.2 }),
        barVals[1].to(model.large[1] / model.large[0], { duration: d }),
      ),
    { after: true, dur: 0.55 },
  );
  playCue(
    s,
    c,
    'mqa',
    (d) =>
      s.play(
        showBar[2].to(1, { duration: 0.2 }),
        barVals[2].to(model.large[2] / model.large[0], { duration: d }),
      ),
    { after: true, dur: 0.55 },
  );
  playCue(s, c, 'weight', (d) => s.play(showWeight.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });

  playCue(s, c, 'one-request', (d) => s.play(poolStage.to(1, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'gqa-request', (d) => s.play(poolStage.to(2, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'mqa-request', (d) => s.play(poolStage.to(3, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'capacity', (d) => s.play(showCap.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });

  playCue(
    s,
    c,
    'long',
    (d) =>
      s.play(
        longStage.to(1, { duration: 0.2 }),
        ...barVals.map((v, i) => v.to(model.large[i] / maxLong, { duration: d })),
      ),
    { dur: 0.6 },
  );
  ['context-32ki', 'context-128ki', 'context-1mi'].forEach((cueId, j) => {
    playCue(
      s,
      c,
      cueId,
      (d) =>
        s.play(
          longStage.to(j + 2, { duration: 0.2 }),
          ...barVals.map((v, i) => v.to(longPayload[j][i] / maxLong, { duration: d })),
        ),
      { after: true, dur: 0.55 },
    );
  });
  playCue(s, c, 'rank', (d) => s.play(showRankNote.to(1, { duration: d })), { dur: 0.4 });
}
