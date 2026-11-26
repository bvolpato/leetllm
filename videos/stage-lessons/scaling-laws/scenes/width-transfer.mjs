// Scene 14: width-transfer: "Does a wider model take a bigger step?"
// Act 1 (Beat 0): Exact cancellation of 8 alternating paths at width=16 (output = 0, target = 1).
// Act 2 (Beats 1-3): muP width-transfer trajectories across widths 16, 64, 256:
//   - Standard update explodes linearly with width (17, 65, 257 -> width + 1).
//   - Coordinated muP predictions stay strictly hidden ("?") during Beat 2's 2.2s prediction hold,
//     then land cleanly on 2.0 at every width AFTER sl-width-transfer-1, and 0.5 AFTER width-half!
import { line } from 'vizmatic/stage';
import { COSMOS, glowTex, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  ROLE,
  cinemaAtmosphere,
  fmt,
  lumBar,
  playBeat,
  playCue,
  scenePulse,
  simultaneousWidthUpdate,
  swapVis,
} from '../parts.mjs';

const WIDTHS = [16, 64, 256];

export default function widthTransfer(s, c) {
  const title = heroTitle(['Does a wider model', 'take a bigger step?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.tokens,
  });

  const act1Vis = s.value(1);
  const act2Vis = s.value(0);

  // Beat 0 cues
  const posVis = s.value(0); // AFTER width-positive
  const negVis = s.value(0); // AFTER sl-width-transfer-0
  const zeroVis = s.value(0); // AFTER width-zero

  // Beat 1 standard bars
  const std16Vis = s.value(0); // AFTER width-sixteen
  const std64Vis = s.value(0); // AFTER width-sixty-four
  const std256Vis = s.value(0); // AFTER width-standard

  // Beat 2 coordinated setup (prediction withheld!)
  const mupColVis = s.value(0); // width-recipe

  // Beat 3 reveals
  const mupTwoVis = s.value(0); // AFTER sl-width-transfer-1
  const lowerRateT = s.value(0); // sl-width-transfer-2: eta 1 -> 0.25
  const mupHalfVis = s.value(0); // AFTER width-half
  const pulse = s.value(0);

  // Act 1 (Beat 0): Alternating path cancellation at width = 16
  const act1Layer = guardedDynamic(act1Vis, (alpha) => {
    const nodes = [];
    const { u, v } = simultaneousWidthUpdate(16);
    const cols = [-420, -20, 440];

    nodes.push(
      txt(
        'Input = 1   ·   width = 16   ·   8 alternating pairs',
        0,
        -255,
        32,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      txt('Input weight uᵢ', cols[0], -150, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('Output weight vᵢ', cols[1], -150, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('Path product uᵢ vᵢ', cols[2], -150, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
    );

    for (let i = 0; i < 2; i++) {
      const cy = -30 + i * 145;
      const col = i === 0 ? ROLE.params : ROLE.cap;
      const ready = i === 0 ? posVis.value : negVis.value;
      const prod = u[i] * v[i];
      nodes.push(
        txt(`Path ${i + 1}`, -740, cy, 32, COSMOS.muted, 'sans', 'left').opacity(alpha),
        lumBar(cols[0], cy, 175, 84, {
          color: col,
          fillOpacity: 0.42,
          strokeWidth: 2.8,
          glow: 10,
          opacity: alpha,
        }),
        txt(u[i] > 0 ? '+1' : '−1', cols[0], cy, 46, COSMOS.ink, 'mono', 'center').opacity(alpha),
        txt('×', -220, cy, 42, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt(fmt(v[i], 2), cols[1], cy, 46, COSMOS.ink, 'mono', 'center').opacity(alpha),
        txt('=', 205, cy, 42, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt(
          ready > 0.5 ? `${prod > 0 ? '+' : '−'}${fmt(Math.abs(prod), 2)}` : '?',
          cols[2],
          cy,
          48,
          ready > 0.5 ? col : COSMOS.dim,
          'mono',
          'center',
        )
          .glow(ready > 0.5 ? 9 : 0, col)
          .opacity(alpha),
      );
    }

    if (zeroVis.value > 0.05) {
      nodes.push(
        txt('8 × (+0.25 − 0.25)  =  0', 0, 255, 50, ROLE.compute, 'mono', 'center')
          .glow(10, ROLE.compute)
          .opacity(zeroVis.value * alpha),
      );
    }

    nodes.push(
      txt(
        'Target = 1   ·   loss = ½ (f − 1)²   ·   both gradients use old weights',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  // Act 2 (Beats 1-3): Standard vs Coordinated muP across widths 16, 64, 256
  const act2Layer = guardedDynamic(act2Vis, (alpha) => {
    const nodes = [];
    const lr = lowerRateT.value;
    const eta = lr > 0.5 ? 0.25 : 1;
    const mupCol = mupColVis.value;
    const mupReady = lr > 0.5 ? mupHalfVis.value : mupTwoVis.value;

    const stdReady = [std16Vis.value, std64Vis.value, std256Vis.value];
    const stdLeft = -580;
    const mupLeft = 175;
    const stdScale = 440 / 257; // width 256 -> 257 fits inside 440px
    const mupScale = 235; // value 2 -> 470px (175 + 470 = 645 < 860)

    nodes.push(
      txt(
        `One SGD step from 0   ·   target = 1   ·   base learning rate η = ${eta}`,
        0,
        -260,
        30,
        ROLE.compute,
        'mono',
        'center',
      )
        .glow(6, ROLE.compute)
        .opacity(alpha),
      txt('Width', -820, -170, 32, COSMOS.ink, 'sans', 'left').opacity(alpha),
      txt('Standard update', stdLeft, -170, 36, ROLE.params, 'sans', 'left')
        .glow(6, ROLE.params)
        .opacity(alpha),
      txt('vᵢ = 1/√n  ·  both LRs = η', stdLeft, -122, 26, COSMOS.muted, 'mono', 'left').opacity(
        alpha,
      ),
    );

    const mupColAlpha = Math.max(0.62, mupCol) * alpha;
    const targetX = mupLeft + 1 * mupScale;
    nodes.push(
      txt(
        mupCol > 0.04 ? 'Coordinated μP (close-up)' : 'Coordinated μP (upcoming)',
        mupLeft,
        -170,
        36,
        mupCol > 0.04 ? ROLE.tokens : COSMOS.muted,
        'sans',
        'left',
      )
        .glow(mupCol > 0.04 ? 7 : 3, ROLE.tokens)
        .opacity(mupColAlpha),
      txt(
        mupCol > 0.04 ? 'vᵢ = 1/n  ·  in ηn, out η/n' : 'Layer-scaled rates compared next',
        mupLeft,
        -122,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(mupColAlpha),
      line([targetX, -48], [targetX, 265], { stroke: ROLE.cap, width: 2.8 }).opacity(
        (mupCol > 0.04 ? 0.85 : 0.65) * mupColAlpha,
      ),
      txt('Target 1', targetX, -82, 26, ROLE.cap, 'mono', 'center').opacity(mupColAlpha),
    );

    WIDTHS.forEach((w, i) => {
      const cy = 0 + i * 115;
      const stdPred = simultaneousWidthUpdate(w, false, eta).prediction;
      const mupPred = simultaneousWidthUpdate(w, true, eta).prediction;

      nodes.push(txt(String(w), -820, cy, 40, COSMOS.ink, 'mono', 'left').opacity(alpha));

      if (stdReady[i] > 0.5) {
        const bw = Math.max(12, stdPred * stdScale);
        nodes.push(
          lumBar(stdLeft + bw / 2, cy, bw, 52, {
            color: ROLE.params,
            fillOpacity: 0.44,
            strokeWidth: 2.6,
            glow: 9,
            opacity: alpha,
          }),
          txt(fmt(stdPred, eta < 1 ? 2 : 0), stdLeft + bw + 20, cy, 34, ROLE.params, 'mono', 'left')
            .glow(6, ROLE.params)
            .opacity(alpha),
        );
      } else {
        nodes.push(txt('?', stdLeft + 10, cy, 38, COSMOS.dim, 'mono', 'left').opacity(alpha));
      }

      if (mupCol > 0.04 && mupReady > 0.5) {
        const ma = mupCol * alpha;
        const mw = Math.max(12, mupPred * mupScale);
        nodes.push(
          lumBar(mupLeft + mw / 2, cy, mw, 52, {
            color: ROLE.tokens,
            fillOpacity: 0.46,
            strokeWidth: 2.8,
            glow: 11,
            opacity: ma,
          }),
          line([mupLeft + mw / 2, cy - 26], [mupLeft + mw / 2, cy + 26], {
            stroke: COSMOS.bg,
            width: 3,
          }).opacity(ma),
          txt(fmt(mupPred, eta < 1 ? 1 : 0), mupLeft + mw + 22, cy, 36, ROLE.tokens, 'mono', 'left')
            .glow(8, ROLE.tokens)
            .opacity(ma),
        );
      } else {
        nodes.push(
          lumBar(mupLeft + 235, cy, 470, 52, {
            color: COSMOS.dim,
            fillOpacity: 0.06,
            strokeWidth: 1.4,
            glow: 0,
            opacity: 0.45 * mupColAlpha,
          }),
          txt(
            '?',
            mupLeft + 18,
            cy,
            40,
            mupCol > 0.04 ? ROLE.compute : COSMOS.dim,
            'mono',
            'left',
          ).opacity(mupColAlpha),
        );
      }
    });

    if (std256Vis.value > 0.5) {
      nodes.push(
        txt(
          lr > 0.5 ? 'Standard: 0.25 × (width + 1)' : 'Standard: width + 1',
          stdLeft,
          345,
          30,
          ROLE.params,
          'mono',
          'left',
        ).opacity(alpha),
      );
    }

    if (mupCol > 0.04) {
      const ma = mupCol * alpha;
      const mupNote =
        mupReady > 0.5
          ? `μP: ${eta} + ${eta} = ${2 * eta} at every width!`
          : lr > 0.5
            ? 'Replaying μP from 0 at η = 0.25...'
            : 'Will wider models still jump farther?';
      nodes.push(
        txt(mupNote, mupLeft, 345, 30, mupReady > 0.5 ? ROLE.optimal : ROLE.compute, 'mono', 'left')
          .glow(7, mupReady > 0.5 ? ROLE.optimal : ROLE.compute)
          .opacity(ma),
      );
    }

    return nodes;
  });

  const eq = glowTex(
    '\\Delta f_{\\text{std}} = \\eta(n+1) \\qquad \\Delta f_{\\mu\\text{P}} = 2\\eta',
    {
      x: 420,
      y: -380,
      size: 32,
      color: ROLE.tokens,
    },
  );

  s.add(cinemaAtmosphere(ROLE.params, ROLE.tokens), title, act1Layer, act2Layer);
  scenePulse(s, c, pulse);

  // Beat 0: path cancellation
  playCue(s, c, 'width-positive', (d) => s.play(posVis.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'sl-width-transfer-0', (d) => s.play(negVis.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'width-zero', (d) => s.play(zeroVis.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });

  // Beat 1: swap to trajectory comparison
  playBeat(s, c, 1, (d) => s.play(swapVis(act1Vis, act2Vis, d)), { dur: 0.6 });
  playCue(s, c, 'width-sixteen', (d) => s.play(std16Vis.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'width-sixty-four', (d) => s.play(std64Vis.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'width-standard', (d) => s.play(std256Vis.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });

  // Beat 2: introduce muP recipe (strictly hide answer during 2.2s hold!)
  playCue(s, c, 'width-recipe', (d) => s.play(mupColVis.to(1, { duration: d })), { dur: 0.65 });

  // Beat 3: reveal muP = 2.0, then drop base LR to 0.25 -> 0.5
  c.show('sl-width-transfer-1', eq, { after: true });
  playCue(s, c, 'sl-width-transfer-1', (d) => s.play(mupTwoVis.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'sl-width-transfer-2', (d) => s.play(lowerRateT.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'width-half', (d) => s.play(mupHalfVis.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
}
