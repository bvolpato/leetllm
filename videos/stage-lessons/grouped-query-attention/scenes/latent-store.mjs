// Scene 13: latent-store - DeepSeek MLA 512+64=576 latent capsule vs explicit KV caches.
import {
  COSMOS,
  MLA,
  ROLE,
  cinemaAtmosphere,
  conduitPts,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  lumBar,
  playCue,
  range,
  rect,
  rule,
  txt,
} from '../parts.mjs';

export default function latentStore(s, c) {
  const contentFill = s.value(0);
  const posFill = s.value(0);
  const showSum = s.value(0);
  const showQueries = s.value(0);

  const barVals = [s.value(0), s.value(0), s.value(0), s.value(0)];
  const barShown = [s.value(0), s.value(0), s.value(0), s.value(0)];
  const showRatio = s.value(0);
  const showScale = s.value(0);
  const showTemp = s.value(0);

  const heads = [128, 8, 4, 1];
  const width = 128;
  const maxNums = 2 * heads[0] * width; // 32,768

  const title = heroTitle(['What fits in one', 'latent cache entry?'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.pos,
    eyebrow: 'MULTI-HEAD LATENT ATTENTION (MLA)',
  });

  const scaleEq = glowTex(
    String.raw`\text{scale} = \frac{1}{\sqrt{128 + 64}} = \frac{1}{\sqrt{192}}`,
    { x: -465, y: 340, size: 36, color: ROLE.gold, glow: 7 },
  );

  const mapLog = (val) =>
    Math.max(0.03, (Math.log2(val) - Math.log2(128)) / (Math.log2(maxNums) - Math.log2(128)));

  const live = guardedDynamic(1, () => {
    const cf = contentFill.value;
    const pf = posFill.value;
    const sm = showSum.value;
    const qm = showQueries.value;
    const rat = showRatio.value;
    const tmp = showTemp.value;

    const nodes = [rule(15, -315, 15, 390, COSMOS.rule, 1.6).opacity(0.6)];

    // --- LEFT: DeepSeek MLA 512 + 64 = 576 Compressed Capsule ---
    const lx = -855;
    const capW = 790;
    const capY = -105;
    const capH = 74;
    const contentW = (MLA.contentDims / MLA.totalDims) * capW;
    const posW = (MLA.posDims / MLA.totalDims) * capW;

    nodes.push(
      txt('DEEPSEEK MLA · 1 TOKEN · 1 LAYER', lx, -260, 26, COSMOS.muted, 'mono', 'left'),
      rect(capW, capH, { fill: '#0d1527', stroke: '#2c3d68', width: 2, radius: 10 }).at(
        lx + capW / 2,
        capY,
      ),
    );

    if (cf > 0.01) {
      const w = Math.max(8, contentW * cf);
      nodes.push(
        lumBar(lx + w / 2, capY, w, capH - 6, {
          color: ROLE.key,
          fillOpacity: 0.48,
          strokeWidth: 2.2,
          glow: 8,
          radius: 7,
        }),
      );
      if (cf > 0.9) {
        nodes.push(
          txt(
            '512 content latent',
            lx + contentW / 2,
            capY,
            30,
            COSMOS.ink,
            'mono',
            'center',
          ).opacity(Math.min(1, (cf - 0.9) / 0.1)),
        );
      }
    }
    if (pf > 0.01) {
      const w = Math.max(8, posW * pf);
      nodes.push(
        lumBar(lx + contentW + w / 2, capY, w, capH - 6, {
          color: ROLE.pos,
          fillOpacity: 0.56,
          strokeWidth: 2.4,
          glow: 10,
          radius: 7,
        }),
        txt('512 content  +  64 RoPE key', lx, capY - 64, 30, ROLE.pos, 'mono', 'left').opacity(pf),
      );
      if (pf > 0.9) {
        nodes.push(
          txt('64', lx + contentW + posW / 2, capY, 28, COSMOS.ink, 'mono', 'center').opacity(
            Math.min(1, (pf - 0.9) / 0.1),
          ),
        );
      }
    }

    if (sm > 0.02) {
      nodes.push(
        txt('576 stored numbers / token / layer', lx, 240, 36, ROLE.gold, 'mono', 'left')
          .glow(8, ROLE.gold)
          .opacity(sm),
      );
    }

    // 128 query fan converging into the shared latent capsule (cleanly above the 576 summary!)
    if (qm > 0.02) {
      const fanY = 122;
      for (const k of range(9)) {
        const qx = lx + 45 + k * 88;
        const pts = conduitPts([qx, fanY], [lx + contentW * 0.5, capY + capH / 2 + 12]);
        nodes.push(
          glowingTrail(pts, {
            color: ROLE.query,
            width: 2.2,
            glow: 5,
            core: false,
            opacity: 0.65 * qm,
          }),
          glowDot(qx, fanY, { radius: 4.5, color: ROLE.query, glow: 7, opacity: qm }),
        );
      }
      nodes.push(
        txt(
          '128 separate query heads read one shared latent',
          lx,
          fanY + 42,
          28,
          ROLE.query,
          'sans',
          'left',
        ).opacity(qm),
      );
    }

    // --- RIGHT: Explicit K/V comparison ---
    const rx = 85;
    const barW = 760;
    const barH = 34;
    nodes.push(
      txt('EXPLICIT KV · NUMBERS / POSITION (d = 128)', rx, -260, 26, COSMOS.muted, 'mono', 'left'),
    );

    const rows = [
      { name: 'MHA (128 KV)', n: 2 * 128 * width, col: ROLE.alert, y: -165 },
      { name: 'GQA-8 (8 KV)', n: 2 * 8 * width, col: ROLE.key, y: -40 },
      { name: 'GQA-4 (4 KV)', n: 2 * 4 * width, col: ROLE.query, y: 85 },
      { name: 'MQA (1 KV)', n: 2 * 1 * width, col: ROLE.value, y: 210 },
    ];

    rows.forEach((r, i) => {
      const sh = barShown[i].value;
      const frac = barVals[i].value;
      const lbl = sh > 0.5 ? `${r.name}   ·   ${r.n.toLocaleString('en-US')}` : r.name;
      nodes.push(
        txt(lbl, rx, r.y - 52, 30, sh > 0.5 ? r.col : COSMOS.ink, 'mono', 'left'),
        rect(barW, barH, { fill: '#0d1527', stroke: '#27375c', width: 1.6, radius: 6 }).at(
          rx + barW / 2,
          r.y,
        ),
      );
      if (frac > 0.01) {
        const w = Math.max(8, frac * barW);
        nodes.push(
          lumBar(rx + w / 2, r.y, w, barH - 4, {
            color: r.col,
            fillOpacity: 0.48,
            strokeWidth: 2,
            glow: 7,
            radius: 5,
          }),
        );
      }
    });

    // Segmented glowing MLA 576 reference markers on each bar track (never crossing text!)
    if (sm > 0.02) {
      const mlaX = rx + mapLog(MLA.totalDims) * barW;
      for (const r of rows) {
        nodes.push(
          line([mlaX, r.y - barH / 2 - 4], [mlaX, r.y + barH / 2 + 4], {
            stroke: ROLE.gold,
            width: 3.6,
          })
            .glow(8, ROLE.gold)
            .opacity(sm),
        );
      }
      nodes.push(
        txt('MLA 576', mlaX, 276, 26, ROLE.gold, 'mono', 'center').glow(6, ROLE.gold).opacity(sm),
      );
    }

    if (rat > 0.02) {
      nodes.push(
        txt(
          'MHA / MLA ≈ 56.9×   ·   GQA-8 / MLA ≈ 3.56×',
          rx + barW / 2,
          342,
          30,
          ROLE.gold,
          'mono',
          'center',
        )
          .glow(7, ROLE.gold)
          .opacity(rat),
      );
    }

    // Floating footer caption (concise so viewer has full reading time!)
    if (tmp > 0.02) {
      nodes.push(
        txt(
          'Measure temporary key expansions separately',
          0,
          444,
          28,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(tmp),
      );
    }

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.pos, ROLE.query), title, live);
  c.show('scale', scaleEq, { after: true, fade: 0.4 });

  playCue(s, c, 'latent', (d) => s.play(contentFill.to(1, { duration: d })), {
    after: true,
    dur: 0.6,
  });
  playCue(s, c, 'pos', (d) => s.play(posFill.to(1, { duration: d })), { after: true, dur: 0.55 });
  playCue(s, c, 'sum', (d) => s.play(showSum.to(1, { duration: d })), { after: true, dur: 0.45 });
  playCue(s, c, 'queries', (d) => s.play(showQueries.to(1, { duration: d })), { dur: 0.55 });

  const explicitCues = ['mha', 'gqa8', 'gqa4', 'mqa'];
  explicitCues.forEach((cueId, i) => {
    const n = 2 * heads[i] * width;
    playCue(
      s,
      c,
      cueId,
      (d) =>
        s.play(barShown[i].to(1, { duration: 0.2 }), barVals[i].to(mapLog(n), { duration: d })),
      { after: true, dur: 0.55 },
    );
  });
  playCue(s, c, 'ratio', (d) => s.play(showRatio.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'scale', (d) => s.play(showScale.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'temp', (d) => s.play(showTemp.to(1, { duration: d })), { dur: 0.4 });
}
