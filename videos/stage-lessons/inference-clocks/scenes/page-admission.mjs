// Scene 11: page-admission: 16-slot PagedAttention pages (120/128 = 6.25% waste) + 12 GB pool admission (10.74 -> 11.81 -> 15.03 GB reject).
import {
  CAP,
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rect,
  swapVis,
  txt,
} from '../parts.mjs';

export default function pageAdmission(s, c) {
  const view1Vis = s.value(1);
  const view2Vis = s.value(0);
  const showOneSlot = s.value(0);
  const showSmall = s.value(0);
  const showBigPrompt = s.value(0);
  const revealOver = s.value(0); // strictly withheld until AFTER `over-limit`!

  const bgAura = aura(0, 0, 740, '#16355e28', '#461a3218');
  const title = heroTitle(['Page Admission:', 'will the next request fit?'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.clockA,
  });

  // View 1: 8 pages of 16 positions (7 full + 8/16 half full = 120 used, 8 empty = 6.25%)
  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const one = showOneSlot.value;
    const nodes = [
      txt(
        '16-POSITION PAGES: 120 USED / 128 RESERVED (6.25% INTERNAL WASTE)',
        -855,
        -215,
        28,
        ROLE.clockA,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    for (let p = 0; p < 8; p++) {
      const px = -760 + p * 215;
      const isLast = p === 7;
      nodes.push(
        rect(185, 110, { fill: '#111d36', stroke: ROLE.clockA, width: 2.5, radius: 10 })
          .at(px, -75)
          .opacity(alpha),
        rect(isLast ? 92 : 181, 106, { fill: ROLE.clockA, stroke: null, radius: 8 })
          .at(isLast ? px - 44 : px, -75)
          .opacity(0.65 * alpha),
        txt(`P${p + 1}`, px, -152, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt(
          isLast ? '8 / 16' : '16 / 16',
          px,
          10,
          26,
          isLast ? ROLE.wait : ROLE.clockA,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }

    nodes.push(
      txt(
        one > 0.3
          ? '1-token request wastes 15/16 slots; block tables link non-contiguous physical pages inside the 12 GB pool'
          : 'Paging avoids reserving 4,096 contiguous slots up front for short requests',
        -855,
        185,
        28,
        one > 0.3 ? ROLE.wait : COSMOS.ink,
        'sans',
        'left',
      ).opacity(alpha),
    );
    return group(...nodes);
  });

  // View 2: 12 GB pool admission gauge (10.74 -> 11.81 FITS -> 15.03 OVER LIMIT!)
  const liveGB = CAP.existing / 1e9; // 10.737
  const smallGB = CAP.small / 1e9; // 11.811
  const largeGB = CAP.large / 1e9; // 15.032

  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const sm = showSmall.value;
    const bp = showBigPrompt.value;
    const ov = revealOver.value;
    const maxGB = 16;
    const maxW = 1040;
    const barX = -520;
    const limitX = barX + (12 / maxGB) * maxW;
    const nodes = [
      txt(
        'KV POOL ADMISSION BOUNDARY = 12.0 GB',
        -855,
        -225,
        28,
        ROLE.wait,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(limitX - 2, 10, 4, 300, ROLE.wait, { opacity: 0.8 * alpha, glow: 8 }),
      txt('12 GB LIMIT', limitX, -172, 26, ROLE.wait, 'mono', 'center').opacity(alpha),

      txt('40 live (4k each)', -855, -100, 28, ROLE.clockA, 'mono', 'left').opacity(alpha),
      lumBar(barX, -100, (liveGB / maxGB) * maxW, 38, ROLE.clockA, {
        opacity: alpha,
        maxTrackW: maxW,
      }),
      txt(
        `${liveGB.toFixed(2)} GB`,
        barX + maxW + 26,
        -100,
        28,
        ROLE.clockA,
        'mono',
        'left',
      ).opacity(alpha),

      txt(
        '+ 16,384 pos',
        -855,
        10,
        28,
        sm > 0.2 ? ROLE.decode : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(barX, 10, (smallGB / maxGB) * maxW * Math.max(0.06, sm), 38, ROLE.decode, {
        opacity: (0.28 + 0.72 * sm) * alpha,
        maxTrackW: maxW,
      }),
      txt(
        sm > 0.2 ? `${smallGB.toFixed(2)} GB (FITS)` : 'candidate 1',
        barX + maxW + 26,
        10,
        28,
        sm > 0.2 ? ROLE.decode : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),

      txt(
        '+ 65,536 pos (4×)',
        -855,
        120,
        28,
        ov > 0.2 ? ROLE.stall : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(barX, 120, (largeGB / maxGB) * maxW * Math.max(0.06, ov), 38, ROLE.stall, {
        opacity: (0.28 + 0.72 * ov) * alpha,
        maxTrackW: maxW,
      }),
      txt(
        ov > 0.2 ? `${largeGB.toFixed(2)} GB (REJECT)` : 'candidate 2',
        barX + maxW + 26,
        120,
        28,
        ov > 0.2 ? ROLE.stall : COSMOS.dim,
        'mono',
        'left',
      )
        .glow(ov > 0.2 ? 8 : 0, ROLE.stall)
        .opacity(alpha),
    ];

    if (bp > 0.2 && ov < 0.2) {
      nodes.push(
        txt(
          'Newcomer asks for 4× more positions (65,536): does it fit inside 12 GB?',
          -855,
          290,
          32,
          ROLE.wait,
          'serif',
          'left',
        )
          .glow(8, ROLE.wait)
          .opacity(bp * (1 - ov * 5) * alpha),
      );
    }

    if (ov > 0.2) {
      nodes.push(
        txt(
          '15.03 GB exceeds 12 GB pool → queue or reject even though length is model-legal',
          -855,
          290,
          30,
          ROLE.stall,
          'mono',
          'left',
        )
          .glow(6, ROLE.stall)
          .opacity(ov * alpha),
      );
    }
    return group(...nodes);
  });

  s.add(bgAura, title, view1, view2);
  playCue(s, c, 'one-slot', (d) => s.play(showOneSlot.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'live-total', (d) => s.play(swapVis(view1Vis, view2Vis, d)), { dur: 0.6 });
  playCue(s, c, 'fits', (d) => s.play(showSmall.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'big-request', (d) => s.play(showBigPrompt.to(1, { duration: d })), { dur: 0.45 });
  // Strictly withhold 15.03 GB reject until AFTER `over-limit`!
  playCue(s, c, 'over-limit', (d) => s.play(revealOver.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  bindCueBeat(s, c, s.value(0), ['fill-pages', 'pool-only', 'small-request', 'queue-request']);
}
