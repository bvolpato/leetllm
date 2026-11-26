// Scene 01: intro: Halfway state marker (0 -> 1.5 -> 1.25) vs full-attention 30k-token lookback arc.
import { linear } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  arcPts,
  aura,
  bindCueBeat,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  openingFiles,
  playCue,
  txt,
  valuePill,
} from '../parts.mjs';

export default function intro(s, c) {
  const markerPos = s.value(0); // 0 -> 1.5 -> 1.25 (withheld until after `write-timeout`!)
  const showTimeout = s.value(0);
  const showAnswer = s.value(0);
  const showAttention = s.value(0);
  const showLookback = s.value(0);
  const pulse = s.value(0);

  const bgAura = aura(0, 0, 740, '#103c362a', '#162d5e18');
  const title = heroTitle(['Can a State-Space Model', 'remember the retry limit?'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.state,
  });

  const fileA = openingFiles[0]; // retries=3, timeout=1, states=[1.5, 1.25]
  const xOf = (val) => -640 + (val / 3.5) * 1280;
  const lineY = -10;

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const pos = markerPos.value;
    const to = showTimeout.value;
    const ans = showAnswer.value;
    const attn = showAttention.value;
    const lb = showLookback.value;
    const p = 0.65 + 0.35 * Math.sin(pulse.value * Math.PI * 2);
    const nodes = [];

    // Top config pills
    nodes.push(
      txt('CONFIG FILE A', -855, -230, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      valuePill(`max_retries = ${fileA.retries}`, -665, -145, {
        w: 340,
        h: 72,
        color: ROLE.carry,
        size: 30,
        opacity: alpha,
      }),
    );
    if (to > 0.05) {
      nodes.push(
        valuePill(`timeout_s = ${fileA.timeout}`, -280, -145, {
          w: 320,
          h: 72,
          color: ROLE.write,
          size: 30,
          opacity: to * alpha,
        }),
      );
    }

    // Living number line (0 to 3) with glowing green state marker
    nodes.push(
      glowingTrail(
        [
          [xOf(0), lineY],
          [xOf(3.2), lineY],
        ],
        { color: '#384c7a', width: 3.5, glow: 5, core: false, opacity: alpha },
      ),
    );
    [0, 1, 1.5, 2, 3].forEach((tick) => {
      const tx = xOf(tick);
      nodes.push(
        glowDot(tx, lineY, { radius: 5, color: COSMOS.muted, glow: 4, opacity: alpha }),
        txt(String(tick), tx, lineY + 42, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      );
    });

    // Moving green state photon
    const mx = xOf(pos);
    nodes.push(
      glowingTrail(
        [
          [xOf(0), lineY],
          [mx, lineY],
        ],
        { color: ROLE.state, width: 6, glow: 12 * p, opacity: alpha },
      ),
      glowDot(mx, lineY, { radius: 13, color: ROLE.state, glow: 16 * p, opacity: alpha }),
      txt(`state = ${pos.toFixed(2)}`, mx, lineY - 52, 34, ROLE.state, 'mono', 'center')
        .glow(8, ROLE.state)
        .opacity(alpha),
    );

    // Prediction prompt (strictly withheld before `write-timeout`!)
    if (to > 0.2 && ans < 0.2) {
      nodes.push(
        txt(
          'Marker moves halfway toward 1.0: where will it land?',
          -855,
          140,
          34,
          ROLE.delta,
          'serif',
          'left',
        )
          .glow(8, ROLE.delta)
          .opacity(to * (1 - ans * 5) * alpha),
      );
    }

    if (ans > 0.2 && attn < 0.2) {
      nodes.push(
        txt(
          `State lands at ${fileA.returned.toFixed(2)}: one slot now blends both settings`,
          -855,
          140,
          32,
          ROLE.state,
          'mono',
          'left',
        )
          .glow(6, ROLE.state)
          .opacity(ans * (1 - attn * 5) * alpha),
      );
    }

    // Persistent quiet bottom comparison track before full attention sweep (zero empty space!)
    if (attn < 0.05) {
      nodes.push(
        txt(
          'ONE FIXED SCALAR SLOT: h_t = 0.5 · h_{t-1} + 0.5 · x_t',
          -855,
          290,
          28,
          COSMOS.dim,
          'mono',
          'left',
        ).opacity(alpha),
        glowingTrail(
          [
            [-855, 345],
            [855, 345],
          ],
          { color: '#24355a', width: 2.5, core: false, opacity: 0.7 * alpha },
        ),
      );
    }

    // Attention comparison stream 30,000 tokens later
    if (attn > 0.05) {
      const aA = attn * alpha;
      const streamY = 265;
      nodes.push(
        txt(
          'FULL ATTENTION · 30,000 TOKENS LATER',
          -855,
          165,
          26,
          ROLE.carry,
          'mono',
          'left',
        ).opacity(aA),
        valuePill('3 (K,V)', -740, streamY, {
          w: 190,
          h: 72,
          color: ROLE.carry,
          size: 30,
          opacity: aA,
        }),
        txt(
          '· · · 30,000 stored KV pairs · · ·',
          -80,
          streamY,
          28,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(aA),
        valuePill('Query: retries?', 600, streamY, {
          w: 300,
          h: 72,
          color: ROLE.delta,
          size: 28,
          opacity: aA,
        }),
      );
      if (lb > 0.05) {
        const arc = arcPts([600, streamY - 40], [-740, streamY - 40], -60, 36);
        const cnt = Math.max(2, Math.round(arc.length * lb));
        nodes.push(
          glowingTrail(arc.slice(0, cnt), {
            gradientColors: [ROLE.delta, ROLE.read, ROLE.carry],
            width: 4.5,
            glow: 12,
            opacity: aA,
          }),
          txt(
            'Query attends directly back to key "3" and reads its exact value',
            -855,
            375,
            28,
            ROLE.read,
            'sans',
            'left',
          ).opacity(lb * aA),
        );
      }
    }

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  const totalDur = Math.max(1, c.end - c.start - 0.5);
  c.at(0.1, () => {
    s.play(pulse.to(5, { duration: totalDur, ease: linear }));
  });

  playCue(s, c, 'write-retries', (d) => s.play(markerPos.to(1.5, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'timeout-line', (d) => s.play(showTimeout.to(1, { duration: d })), { dur: 0.45 });
  // Strictly withhold 1.25 landing until AFTER `write-timeout`!
  playCue(
    s,
    c,
    'write-timeout',
    (d) => s.play(markerPos.to(fileA.returned, { duration: d }), showAnswer.to(1, { duration: d })),
    { after: true, dur: 0.45 },
  );
  playCue(s, c, 'later-question', (d) => s.play(showAttention.to(1, { duration: d })), {
    dur: 0.5,
  });
  playCue(s, c, 'look-back', (d) => s.play(showLookback.to(1, { duration: d })), { dur: 0.7 });
  bindCueBeat(s, c, s.value(0), ['retry-line', 'kv-entries']);
}
