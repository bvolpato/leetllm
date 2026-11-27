// Scene 24: Budget compressed input and decoded media separately (2 compressed runs: red x 6, blue x 6 -> expands to 12 decoded pixels; remote domains/no redirects/audio caps/v0.31 trust flag; API media time vs worker prefill time).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function mediaLimits(s, c) {
  // step: 0=op-0 two compressed runs, 1=expand (12 decoded pixels!), 2=op-1 remote/audio caps, 3=trust-override (v0.31 server trust flag), 4=op-2 time download/decode at API server
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#ff6b8b1a', '#60a5fa18');
  const title = heroTitle(['Budget Compressed Bytes &', 'Decoded Media Separately'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.kv,
    eyebrow: 'MULTIMODAL LIMITS · DOWNLOAD CAP VS PIXEL CAP · API OWNER',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    if (st <= 1) {
      // Left: Compressed 2 runs
      nodes.push(
        txt('COMPRESSED INPUT (DOWNLOAD CAP)', -470, -225, 26, ROLE.r0, 'mono'),
        glassCell(-470, -85, 680, 175, ROLE.r0, { fill: '#101f38', glow: 8 }),
        glassCell(-640, -85, 290, 95, ROLE.bad, { fill: '#3a1426', glow: 7 }),
        txt('red x 6', -640, -85, 32, ROLE.bad, 'mono'),
        glassCell(-300, -85, 290, 95, ROLE.r0, { fill: '#132b52', glow: 7 }),
        txt('blue x 6', -300, -85, 32, ROLE.r0, 'mono'),
        txt('Tiny payload: just 2 color runs', -470, 56, 26, COSMOS.muted, 'sans'),
      );

      // Right: Expanded 12 decoded pixels (4x3 grid)
      const expanded = st >= 1;
      nodes.push(
        txt('DECODED PIXELS (PIXEL CAP)', 440, -225, 26, ROLE.kv, 'mono'),
        glassCell(440, 5, 760, 360, expanded ? ROLE.kv : COSMOS.dim, {
          fill: '#0c1626',
          glow: expanded ? 9 : 3,
        }),
      );
      if (expanded) {
        for (let i = 0; i < 12; i++) {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const px = 195 + col * 164;
          const py = -98 + row * 102;
          const isRed = i < 6;
          nodes.push(
            glassCell(px, py, 146, 84, isRed ? ROLE.bad : ROLE.r0, {
              fill: isRed ? '#44162b' : '#14305e',
              glow: 6,
            }),
            txt(`px ${i + 1}`, px, py, 26, COSMOS.ink, 'mono'),
          );
        }
      } else {
        nodes.push(txt('Expands on decode to 12 pixels...', 440, 5, 28, COSMOS.muted, 'mono'));
      }

      nodes.push(
        glassCell(0, 245, 1680, 92, COSMOS.gold, { fill: '#221c0e', glow: 7 }),
        txt(
          'Small compressed files can explode into huge decoded tensors -> enforce BOTH caps!',
          0,
          245,
          26,
          COSMOS.gold,
          'sans',
        ),
      );
    } else if (st <= 3) {
      const trust = st >= 3;
      const guards = [
        ['REMOTE MEDIA SSRF', 'Allow only approved domains · disable HTTP redirects', ROLE.r0],
        ['AUDIO MEDIA CAPS', 'Limit compressed file size, clip duration & decoded bytes', ROLE.kv],
        [
          'v0.31 PROCESSOR OVERRIDES',
          trust
            ? 'Server trust flag required before clients can override processor settings!'
            : 'Offline Python caller controls its own inputs; online server guards overrides',
          trust ? ROLE.good : COSMOS.gold,
        ],
      ];
      guards.forEach(([k, d, col], i) => {
        const cy = -140 + i * 165;
        nodes.push(
          glassCell(0, cy, 1680, 138, col, { fill: '#101b2e', glow: i === 2 && trust ? 11 : 7 }),
          txt(k, -800, cy - 30, 26, col, 'mono', 'left'),
          txt(d, -800, cy + 26, 26, COSMOS.ink, 'sans', 'left'),
        );
      });
    } else {
      nodes.push(
        glassCell(-430, -135, 800, 158, ROLE.r0, { fill: '#101f38', glow: 8 }),
        txt('API SERVER (MEDIA + TOKENIZER)', -430, -172, 26, ROLE.r0, 'mono'),
        txt('Time download + decode here', -430, -112, 30, COSMOS.ink, 'mono'),

        glassCell(430, -135, 800, 158, ROLE.kv, { fill: '#0e222e', glow: 8 }),
        txt('GPU WORKER (PREFILL)', 430, -172, 26, ROLE.kv, 'mono'),
        txt('Compare worker prefill duration', 430, -112, 30, COSMOS.ink, 'mono'),

        glassCell(0, 128, 1680, 185, ROLE.good, { fill: '#0e2824', glow: 9 }),
        txt('RECORD ON EVERY MULTIMODAL REQUEST TRACE', 0, 76, 26, ROLE.good, 'mono'),
        txt(
          'Permitted Source   |   Compressed Bytes Received   |   Decoded Pixel Count',
          0,
          136,
          28,
          COSMOS.ink,
          'mono',
        ),
        txt(
          'Isolates API media bottleneck from GPU prefill latency',
          0,
          190,
          26,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    nodes.push(
      txt(
        st <= 1
          ? 'Download cap bounds network bytes; pixel cap bounds decoded memory & CPU'
          : st <= 3
            ? 'Keep untrusted client media overrides disabled unless explicitly trusted'
            : 'Measure download & decode latency at the API process before tuning the GPU',
        0,
        382,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['vv-media-limits-op-0', 0],
    ['vv-media-limits-expand', 1, true],
    ['vv-media-limits-op-1', 2],
    ['vv-media-limits-trust-override', 3, true],
    ['vv-media-limits-op-2', 4],
  ]);
}
