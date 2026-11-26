// Scene 1: intro: Dogs and cats trade places, then slide +8 along the position ruler.
import { arrow, dynamic, group, line, par, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAura,
  cinemaStars,
  clockDial,
  contentOutputs,
  glowDot,
  glowingCurve,
  heroTitle,
  playOn,
  safeDur,
  txt,
} from '../parts.mjs';

const DOGS_OUT = contentOutputs[0][0]; // 0.802

export default function intro(s, c) {
  const swapP = s.value(0);
  const highlightOut = s.value(0);
  const revealAns = s.value(0);
  const shiftP = s.value(0);
  const ropeSpin = s.value(0);

  const stars = cinemaStars(130, 1, ROLE.query);
  const stageAura = cinemaAura(680, -30, 320, '#5ce1e61e', '#ffd1660e');

  const headline = heroTitle(['How Position', 'Changes Attention'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.query,
    eyebrow: 'ROTARY POSITION EMBEDDING',
  });

  const liveCanvas = dynamic(() => {
    const sw = swapP.value;
    const hi = highlightOut.value;
    const ans = revealAns.value;
    const sh = shiftP.value;
    const spin = ropeSpin.value;

    const nodes = [];
    const basePos = [3, 4, 5];
    const shift = Math.round(sh * 8);
    const pos = basePos.map((p) => p + shift);

    // Position ruler spanning lower canvas cleanly
    const rulerX0 = -830;
    const rulerX1 = 420;
    const rulerY = 275;
    nodes.push(
      line([rulerX0, rulerY], [rulerX1, rulerY], { stroke: '#3a4b73', width: 3 }),
      txt(
        shift > 0 ? `Position ruler (+${shift})` : 'Position ruler',
        rulerX0,
        rulerY + 95,
        26,
        shift > 0 ? ROLE.shift : COSMOS.muted,
        'mono',
        'left',
      ),
    );
    const rulerStart = 1;
    const rulerEnd = 15;
    const xOfPos = (p) =>
      rulerX0 + ((p - rulerStart) / (rulerEnd - rulerStart)) * (rulerX1 - rulerX0);
    for (let p = 1; p <= 15; p++) {
      const tx = xOfPos(p);
      const active = pos.includes(p);
      nodes.push(
        line([tx, rulerY - (active ? 14 : 8)], [tx, rulerY + (active ? 14 : 8)], {
          stroke: active ? ROLE.shift : '#334366',
          width: active ? 3 : 1.8,
        }),
      );
      if (p % 2 === 1) {
        nodes.push(txt(String(p), tx, rulerY + 46, 26, active ? COSMOS.ink : COSMOS.dim, 'mono'));
      }
    }

    // Sentence 1 (top row): Dogs chase cats
    const topY = -155;
    const slotXs = [-520, -220, 80];
    const row1Words = [
      { word: 'Dogs', color: ROLE.query },
      { word: 'chase', color: COSMOS.muted },
      { word: 'cats', color: ROLE.key },
    ];
    nodes.push(txt('Sentence 1 (unmasked)', -855, topY - 68, 26, COSMOS.dim, 'mono', 'left'));
    row1Words.forEach((item, i) => {
      const x = slotXs[i];
      nodes.push(
        rect(200, 64, {
          fill: '#111626',
          stroke: item.color,
          width: i === 0 ? 3 : 1.8,
          radius: 14,
        }).at(x, topY),
        txt(item.word, x, topY, 32, item.color, 'serif'),
      );
    });
    // Blue output under Dogs in Sentence 1
    nodes.push(
      txt(DOGS_OUT.toFixed(3), slotXs[0], topY + 64, 34, ROLE.query, 'mono').glow(
        hi > 0.1 ? 10 : 4,
        ROLE.query,
      ),
      txt('output[0]', slotXs[0] - 130, topY + 64, 26, COSMOS.dim, 'mono', 'right'),
    );

    // Sentence 2 (nouns swap via clean vertical separation so they never cross 'chase'!)
    const botY = 65;
    const slideDx = sh * 140;
    const arcLift = Math.sin(Math.PI * sw) * 84;
    const dogsX = slotXs[0] + sw * (slotXs[2] - slotXs[0]) + slideDx;
    const dogsY = botY - arcLift;
    const chaseX = slotXs[1] + slideDx;
    const catsX = slotXs[2] + sw * (slotXs[0] - slotXs[2]) + slideDx;
    const catsY = botY + arcLift;

    // Glowing crossing curves while swapping
    if (sw > 0.04 && sw < 0.96 && sh < 0.1) {
      const arcPts1 = [];
      const arcPts2 = [];
      for (let k = 0; k <= 24; k++) {
        const u = (k / 24) * sw;
        arcPts1.push([slotXs[0] + u * (slotXs[2] - slotXs[0]), botY - 84 * Math.sin(Math.PI * u)]);
        arcPts2.push([slotXs[2] + u * (slotXs[0] - slotXs[2]), botY + 84 * Math.sin(Math.PI * u)]);
      }
      if (arcPts1.length >= 2) {
        nodes.push(
          glowingCurve(arcPts1, ROLE.query, { width: 3.0, glow: 7 }).opacity(0.65),
          glowingCurve(arcPts2, ROLE.key, { width: 3.0, glow: 7 }).opacity(0.65),
        );
      }
    }

    // Hide moving word labels briefly while flying mid-swap so no stroke crosses text
    const showMovingText = sw < 0.08 || sw > 0.92;
    nodes.push(
      txt(
        sh > 0.1 ? 'Shifted sentence (+8)' : 'Sentence 2 (swapped)',
        -855,
        botY - 72,
        26,
        sh > 0.1 ? ROLE.shift : COSMOS.muted,
        'mono',
        'left',
      ),
      rect(190, 64, { fill: '#111626', stroke: ROLE.key, width: 2.6, radius: 14 }).at(catsX, catsY),
      rect(190, 64, { fill: '#111626', stroke: '#3c4b70', width: 1.8, radius: 14 }).at(
        chaseX,
        botY,
      ),
      txt('chase', chaseX, botY, 32, COSMOS.muted, 'serif'),
      rect(190, 64, { fill: '#111626', stroke: ROLE.query, width: 3.0, radius: 14 })
        .at(dogsX, dogsY)
        .glow(ans > 0.2 ? 8 : 0, ROLE.query),
    );
    if (showMovingText) {
      nodes.push(
        txt('Cats', catsX, catsY, 32, ROLE.key, 'serif'),
        txt('dogs', dogsX, dogsY, 32, ROLE.query, 'serif'),
      );
    }

    // Withhold answer until `dogs-output` finishes!
    if (ans < 0.05 && hi > 0.2 && sw > 0.92) {
      nodes.push(
        txt('?', slotXs[0] + slideDx, botY + 64, 34, COSMOS.gold, 'mono').glow(6, COSMOS.gold),
        txt('?', slotXs[2] + slideDx, botY + 64, 34, COSMOS.gold, 'mono').glow(6, COSMOS.gold),
      );
    } else if (ans >= 0.05) {
      nodes.push(
        txt(DOGS_OUT.toFixed(3), dogsX, botY + 64, 34, ROLE.query, 'mono')
          .opacity(ans)
          .glow(10, ROLE.query),
      );
    }

    // Position gap bracket once shifted
    if (sh > 0.05) {
      const cX = xOfPos(pos[0]);
      const dX = xOfPos(pos[2]);
      nodes.push(
        line([cX, rulerY - 26], [dX, rulerY - 26], { stroke: ROLE.score, width: 4.5 })
          .opacity(sh)
          .glow(10, ROLE.score)
          .set('blend', 'screen'),
        glowDot(cX, rulerY, { radius: 6.5, color: ROLE.key, glow: 10 }).opacity(sh),
        glowDot(dX, rulerY, { radius: 6.5, color: ROLE.query, glow: 10 }).opacity(sh),
        txt(`Δ = ${pos[2] - pos[0]}`, (cX + dX) * 0.5, rulerY - 60, 30, ROLE.score, 'mono')
          .opacity(sh)
          .glow(6, ROLE.score),
      );
    }

    // Right side preview: glowing RoPE rotary compass dial
    const dialCx = 680;
    const dialCy = -30;
    const qAng = pos[2] * 0.5 * (0.25 + 0.75 * spin);
    const kAng = pos[0] * 0.5 * (0.25 + 0.75 * spin);
    nodes.push(
      clockDial({
        cx: dialCx,
        cy: dialCy,
        radius: 165,
        queryAngle: qAng,
        keyAngle: kAng,
        showProj: spin > 0.15,
        showAngleArc: spin > 0.15,
        auraColor: null,
        title: sh > 0.1 ? `q(${pos[2]}) · k(${pos[0]})` : 'RoPE phase dial',
        subtitle: sh > 0.1 ? 'Δ = 2 locked' : 'position → angle',
        titleColor: COSMOS.ink,
        subColor: sh > 0.1 ? ROLE.score : COSMOS.muted,
      }),
    );

    if (ans > 0.3 && sh < 0.15) {
      nodes.push(
        arrow([slotXs[0] + 60, topY + 64], [dogsX - 110, botY - 38], {
          stroke: ROLE.query,
          width: 2.8,
          tip: 13,
          dash: [7, 7],
        })
          .opacity(ans * (1 - sh * 6))
          .glow(5, ROLE.query),
      );
    }

    return group(...nodes);
  });

  s.add(stars, stageAura, headline, liveCanvas);

  playOn(s, c, 'swap-nouns', (d) => swapP.to(1, { duration: d }), 1.2);
  playOn(s, c, 'mark-output', (d) => highlightOut.to(1, { duration: d }), 0.6);
  playOn(s, c, 'track-output', (d) => ropeSpin.to(0.25, { duration: d }), 0.8);
  const dogsCue = c.cue('dogs-output');
  c.after('dogs-output', () => {
    s.play(revealAns.to(1, { duration: safeDur(c, dogsCue.end, 0.5) }));
  });
  playOn(
    s,
    c,
    'move-sentence',
    (d) => par(shiftP.to(1, { duration: d }), ropeSpin.to(1, { duration: d })),
    2.2,
  );
}
