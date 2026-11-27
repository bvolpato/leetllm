// Scene 25: Which GPU runs out first? Pair with 29 GB free each (58 GB pooled -> 77 reqs @ 0.75 GB). Place 50 GB unevenly: 35 on GPU 0, 15 on GPU 1 -> strict hold until local-verdict (-6 GB short / +14 GB spare)!
import {
  COSMOS,
  PLACE_LOCAL,
  ROLE,
  aura,
  deviceGB,
  glassCell,
  group,
  guardedDynamic,
  halfGB,
  heroTitle,
  line,
  poolGB,
  rect,
  remainAfterDuration,
  remainDuration,
  reserveGB,
  txt,
} from '../parts.mjs';

export default function localFit(s, c) {
  const pPool = s.value(0);
  const pCeil = s.value(0);
  const pLeft = s.value(0);
  const pRight = s.value(0);
  const pVerdict = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1a', '#ff6b8b1c');
  const title = heroTitle(['Which GPU Runs', 'Out First?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.bad,
    eyebrow: 'PER-RANK MEMORY ADMISSION · 58 GB POOLED vs LOCAL FIT',
  });

  const live = guardedDynamic(1, () => {
    const ceil = pCeil.value > 0.5;
    const lp = pLeft.value;
    const rp = pRight.value;
    const placing = lp > 0.02 || rp > 0.02;
    const verd = pVerdict.value > 0.5;

    const x0 = -760;
    const px = 14.5; // 80 GB = 1160 px (ends at +400), 86 GB = 1247 px (ends at +487)
    const capW = deviceGB * px;
    const resW = reserveGB * px;
    const wtW = halfGB * px;
    const freeW = poolGB * px;
    const startX = x0 + resW + wtW;

    const nodes = [
      // 80 GB dashed limit (broken around bar bands so stroke never crosses bar text)
      line([x0 + capW, -172], [x0 + capW, -112], {
        stroke: COSMOS.gold,
        width: 3.2,
        dash: [8, 6],
      }).glow(7, COSMOS.gold),
      line([x0 + capW, -8], [x0 + capW, 88], {
        stroke: COSMOS.gold,
        width: 3.2,
        dash: [8, 6],
      }).glow(7, COSMOS.gold),
      line([x0 + capW, 192], [x0 + capW, 240], {
        stroke: COSMOS.gold,
        width: 3.2,
        dash: [8, 6],
      }).glow(7, COSMOS.gold),
      txt('80 GB LIMIT', x0 + capW, -200, 26, COSMOS.gold, 'mono'),
    ];

    [0, 1].forEach((rank) => {
      const y = rank === 0 ? -60 : 140;
      const col = rank === 0 ? ROLE.gpu0 : ROLE.gpu1;
      const fill = rank === 0 ? '#122a4d' : '#0f303c';
      nodes.push(
        txt(`GPU ${rank}`, x0 - 30, y, 30, col, 'mono', 'right'),
        rect(capW, 84, { fill: '#0c1526', stroke: COSMOS.dim, width: 2.0, radius: 8 }).at(
          x0 + capW * 0.5,
          y,
        ),
        rect(resW, 84, { fill: '#232c44', stroke: COSMOS.muted, width: 1.8, radius: 8 }).at(
          x0 + resW * 0.5,
          y,
        ),
        txt('16 GB', x0 + resW * 0.5, y, 26, COSMOS.ink, 'mono'),
        rect(wtW, 84, { fill, stroke: col, width: 2.4, radius: 8 }).at(x0 + resW + wtW * 0.5, y),
        txt('35 GB weights', x0 + resW + wtW * 0.5, y, 28, COSMOS.ink, 'mono'),
      );

      if (!placing) {
        nodes.push(
          rect(freeW, 84, { fill: '#0d2622', stroke: ROLE.good, width: 2.2, radius: 8 })
            .at(startX + freeW * 0.5, y)
            .opacity(pPool.value > 0.2 ? 0.92 : 0.72),
          txt(`${poolGB} GB free`, startX + freeW * 0.5, y, 28, ROLE.good, 'mono'),
        );
      } else {
        const prog = rank === 0 ? lp : rp;
        const gb = PLACE_LOCAL.values[rank];
        const kw = gb * px * prog;
        const free = PLACE_LOCAL.free[rank];
        const kvCol = verd ? (free < 0 ? ROLE.bad : ROLE.good) : COSMOS.gold;
        const kvFill = verd ? (free < 0 ? '#321222' : '#0d2b24') : '#29210e';
        if (kw > 4) {
          nodes.push(
            rect(kw, 84, { fill: kvFill, stroke: kvCol, width: 2.8, radius: 8 })
              .at(startX + kw * 0.5, y)
              .glow(8, kvCol),
          );
          if (prog > 0.75) {
            nodes.push(txt(`${gb} GB KV`, startX + kw * 0.5, y, 28, kvCol, 'mono'));
          }
        }
        if (verd) {
          nodes.push(
            txt(
              free < 0 ? `${-free} GB SHORT (OOM!)` : `${free} GB SPARE`,
              x0 + capW + 135,
              y,
              28,
              free < 0 ? ROLE.bad : ROLE.good,
              'mono',
              'left',
            ).glow(6, free < 0 ? ROLE.bad : ROLE.good),
          );
        }
      }
    });

    const foot = verd
      ? 'GPU 0 is 6 GB short while GPU 1 has 14 GB spare · check every rank before admission!'
      : placing
        ? '50 GB total requested (35 GB on GPU 0, 15 GB on GPU 1) · Predict: which runs out, by how much?'
        : ceil
          ? 'Pooled math: 58 GB ÷ 0.75 GB/req = 77 whole requests (assumes one shared pool)'
          : 'Both GPUs start with 29 GB free (58 GB combined across the pair)';

    nodes.push(
      glassCell(0, 325, 1560, 82, verd ? ROLE.bad : placing ? COSMOS.gold : ROLE.good, {
        fill: '#10182b',
        glow: 8,
      }),
      txt(foot, 0, 325, 26, verd ? ROLE.bad : placing ? COSMOS.gold : COSMOS.ink, 'mono'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('request-pool', () =>
    s.play(pPool.to(1, { duration: remainDuration(c, 'request-pool', 0.4) })),
  );
  c.after('request-ceiling', () =>
    s.play(pCeil.to(1, { duration: remainAfterDuration(c, 'request-ceiling', 0.4) })),
  );
  c.on('left-placement', () =>
    s.play(pLeft.to(1, { duration: remainDuration(c, 'left-placement', 0.65) })),
  );
  c.on('right-placement', () =>
    s.play(pRight.to(1, { duration: remainDuration(c, 'right-placement', 0.65) })),
  );
  c.after('local-verdict', () =>
    s.play(pVerdict.to(1, { duration: remainAfterDuration(c, 'local-verdict', 0.4) })),
  );
}
