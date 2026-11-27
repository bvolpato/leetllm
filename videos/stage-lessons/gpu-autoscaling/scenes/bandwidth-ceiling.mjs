// Scene 19: bandwidth-ceiling - How long does one weight read take?
// Glowing HBM 3,350 GB/s weight-read millisecond ruler:
// 54 GB -> 16.1 ms / 62.0 tok/s; strict prediction withholding on 27 GB -> reveals AFTER packed-read & packed-rate;
// then 16 GB -> 4.8 ms / 209.4 tok/s, plus beat 3 real-step KV/batch/MoE note.
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  DATA,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  glowBar,
  glowTex,
  guardedDynamic,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function bandwidthCeiling(s, c) {
  const step = s.value(0); // 1=54GB ms, 2=62 tok/s, 3=27GB prompt(PREDICT!), 4=8ms(AFTER), 5=124 tok/s(AFTER), 6=16GB 4.8ms(AFTER), 7=209 tok/s(AFTER), 8=beat 3 reality

  const header = cinemaHeader(
    'H100 SXM · 3,350 GB/s HBM',
    'How long does one',
    'weight read take?',
    {
      x: -860,
      y: -420,
      accent: ROLE.active,
      size: 52,
    },
  );

  const bgAura = aura(200, 40, 640, '#60a5fa20', '#5ce1e61a');

  const bwEq = glowTex(
    String.raw`\text{tok/s} \le \frac{3350\;\text{GB/s}}{\text{Active Weight GB}}`,
    {
      x: 470,
      y: -335,
      size: 38,
      color: ROLE.focus,
      glow: 7,
    },
  );

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;

      const barLeft = -420;
      const barW = 800;
      const maxMs = 18;
      const nodes = [];

      // Ruler ticks 0..18 ms
      nodes.push(
        beamWithPhotons(
          [
            [barLeft, 240],
            [barLeft + barW, 240],
          ],
          '#3a5382',
          0,
          { width: 2.8, glow: 5, photonCount: 2 },
        ),
      );
      for (const ms of [0, 4, 8, 12, 16]) {
        const x = barLeft + (ms / maxMs) * barW;
        nodes.push(txt(`${ms} ms`, x, 278, 26, COSMOS.dim, 'mono'));
      }

      // Row 1: 54 GB dense BF16 -> 16.1 ms / 62.0 tok/s
      nodes.push(
        txt('27B BF16 · 54 GB', -860, -135, 30, ROLE.cold, 'mono', 'left'),
        glowBar(barLeft, -135, barW, 56, DATA.bw54.milliseconds / maxMs, {
          fill: ROLE.cold,
          glow: 9,
        }),
        txt(
          st >= 1.5
            ? `${DATA.bw54.milliseconds.toFixed(1)} ms  ·  ${DATA.bw54.tps.toFixed(0)} tok/s`
            : `${DATA.bw54.milliseconds.toFixed(1)} ms / read`,
          420,
          -135,
          28,
          ROLE.cold,
          'mono',
          'left',
        ),
      );

      // Row 2: 27 GB packed (INT8/FP8) -> STRICT PREDICTION before st >= 3.5!
      if (st >= 2.5) {
        const revealed = st >= 3.5;
        nodes.push(
          txt(
            '27B Packed · 27 GB',
            -860,
            -8,
            30,
            revealed ? ROLE.active : ROLE.predict,
            'mono',
            'left',
          ),
        );
        if (!revealed) {
          nodes.push(
            txt('PREDICT: How long does 27 GB take?', barLeft, -8, 30, ROLE.predict, 'sans', 'left')
              .glow(8, ROLE.predict)
              .opacity(1),
          );
        } else {
          nodes.push(
            glowBar(barLeft, -8, barW, 56, DATA.bw27.milliseconds / maxMs, {
              fill: ROLE.active,
              glow: 9,
            }),
            txt(
              st >= 4.5
                ? `${DATA.bw27.milliseconds.toFixed(1)} ms  ·  ${DATA.bw27.tps.toFixed(0)} tok/s (2x)`
                : `${DATA.bw27.milliseconds.toFixed(1)} ms / read`,
              420,
              -8,
              28,
              ROLE.active,
              'mono',
              'left',
            ).glow(6, ROLE.active),
          );
        }
      }

      // Row 3: 16 GB small model (8B BF16) -> 4.8 ms / 209 tok/s (revealed AFTER small-read/small-rate)
      if (st >= 5.5) {
        nodes.push(
          txt('8B BF16 · 16 GB', -860, 120, 30, ROLE.warm, 'mono', 'left'),
          glowBar(barLeft, 120, barW, 56, DATA.bw16.milliseconds / maxMs, {
            fill: ROLE.warm,
            glow: 9,
          }),
          txt(
            st >= 6.5
              ? `${DATA.bw16.milliseconds.toFixed(1)} ms  ·  ${DATA.bw16.tps.toFixed(0)} tok/s`
              : `${DATA.bw16.milliseconds.toFixed(1)} ms / read`,
            420,
            120,
            28,
            ROLE.warm,
            'mono',
            'left',
          ).glow(6, ROLE.warm),
        );
      }

      // Bottom guidance (beat 3 adds KV, attention, batch amortization & MoE)
      const foot =
        st >= 7.5
          ? 'Real decode also reads KV cache, runs attention & samples  ·  batching amortizes weight reads'
          : 'Single-stream batch=1 weight-only ceiling on H100 SXM';
      nodes.push(txt(foot, 0, 385, 26, st >= 7.5 ? ROLE.focus : COSMOS.muted, 'sans'));

      return group(...nodes);
    },
  );

  s.add(bgAura, header, bwEq, dyn);

  tweenOn(s, c, 'full-read', step, 1, 0.3);
  tweenOn(s, c, 'full-rate', step, 2, 0.3);
  tweenOn(s, c, 'packed-input', step, 3, 0.3); // Question beat: NO reveal!
  tweenOn(s, c, 'packed-read', step, 4, 0.3, { after: true });
  tweenOn(s, c, 'packed-rate', step, 5, 0.3, { after: true });
  tweenOn(s, c, 'small-read', step, 6, 0.3, { after: true });
  tweenOn(s, c, 'small-rate', step, 7, 0.3, { after: true });
  c.onBeat(3, () => {
    const t = c.beats[3].start;
    s.play(step.to(8, { duration: clampDur(c, t, 0.35) }));
  });
}
