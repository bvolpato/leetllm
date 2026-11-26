// Scene 10: cache-write - Pay once for a write and later for a read
// Orbiting 3D three-column waterfall for GPT-5.6 Terra (520 ordinary $2/M, 1,280 prefix $2.50 write -> $0.20 read, 180 output $12/M).
// Shows Call 1 ($0.006400) -> Call 2 ($0.003456) and pair savings ($0.009856 vs $0.011520, saving $0.001664).
import { gridPlane3d, group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  TERRA,
  addBox3D,
  addPointerArc3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  driftValue,
  fadeInNodes,
  fadeOutNodes,
  glowBar,
  guardedDynamic,
  hideNodes,
  orbitScene,
  txt,
  usd,
} from '../parts.mjs';

export default function cacheWrite(s, c) {
  const pulseT = s.value(0);
  const p0 = s.value(0);
  const call1Done = s.value(0);
  const call2Mode = s.value(0);

  const ordMicro = TERRA.ordinaryTokens * TERRA.input; // 1040 -> $0.001040
  const writeMicro = TERRA.prefixTokens * TERRA.write30m; // 3200 -> $0.003200
  const readMicro = TERRA.prefixTokens * TERRA.read; // 256 -> $0.000256
  const outMicro = TERRA.outputTokens * TERRA.output; // 2160 -> $0.002160
  const pairMicro = TERRA.writeCallMicro + TERRA.readCallMicro; // 9856 -> $0.009856
  const noCachePair = 2 * TERRA.coldCallMicro; // 11520 -> $0.011520

  const header = cinemaHeader(
    'GPT-5.6 TERRA · CACHE WRITE',
    'Pay 1.25x to write,',
    '0.10x to read',
    {
      x: -860,
      y: -415,
      accent: ROLE.write,
      size: 52,
    },
  );

  const sceneAura = aura(320, 15, 620, '#fb923c26', '#6ee7b71a');

  // Orbiting 3D Three-Column Cost Prism (Ordinary | Prefix Write->Read | Output)
  const view3d = cinematic3d({
    theta: -0.82,
    phi: 1.0,
    distance: 15.2,
    unit: 116,
    focus: [0, 0, 1.15],
  }).at(340, 10);

  view3d.add(
    gridPlane3d({
      x: [-3.4, 3.4],
      y: [-2.2, 2.2],
      z: 0,
      step: 1.2,
      color: '#25355a',
      width: 1.2,
      opacity: 0.48,
    }),
  );

  // Height scale: 3200 micro = 2.6 units
  const hScale = 2.6 / writeMicro;

  // Column 0: Ordinary 520 ($0.001040) - fixed across both calls
  addBox3D(view3d, -2.6, -0.7, 0.04, 1.35, 1.4, ordMicro * hScale, ROLE.input, ROLE.input, {
    faceOpacity: 0.84,
    edgeGlow: 7,
  });

  // Column 1a: Prefix Write 1,280 ($0.003200) - tall amber prism on Call 1
  const writePrism = addBox3D(
    view3d,
    -0.68,
    -0.7,
    0.04,
    1.35,
    1.4,
    writeMicro * hScale,
    ROLE.write,
    ROLE.cached,
    {
      faceOpacity: 0.86,
      edgeGlow: 9,
    },
  );

  // Column 1b: Prefix Read 1,280 ($0.000256) - compact emerald/gold prism on Call 2 + savings arc!
  const readPrism = hideNodes([
    ...addBox3D(
      view3d,
      -0.68,
      -0.7,
      0.04,
      1.35,
      1.4,
      Math.max(0.28, readMicro * hScale),
      ROLE.ok,
      ROLE.cached,
      {
        faceOpacity: 0.9,
        edgeGlow: 10,
      },
    ),
    ...addPointerArc3D(view3d, [0, 0, writeMicro * hScale], [0, 0, 0.34], ROLE.ok, {
      lift: 0.55,
      pulseVal: pulseT,
      phaseOffset: 0.2,
    }),
  ]);

  // Column 2: Output 180 ($0.002160) - fixed across both calls
  addBox3D(view3d, 1.25, -0.7, 0.04, 1.35, 1.4, outMicro * hScale, ROLE.output, ROLE.output, {
    faceOpacity: 0.84,
    edgeGlow: 8,
  });

  const hud = guardedDynamic(
    () => 1,
    () => {
      const c1 = call1Done.value;
      const c2 = call2Mode.value;
      const isRead = c2 > 0.5;
      const midMicro = isRead ? readMicro : writeMicro;
      const midColor = isRead ? ROLE.ok : ROLE.write;

      const nodes = [
        txt(
          'SEPARATE CARD · PREFIX P1 = 1,280 TOKENS',
          -860,
          -210,
          26,
          ROLE.cached,
          'mono',
          'left',
        ),

        // Ordinary row
        txt('520 ordinary  ($2.00/M)', -860, -145, 26, ROLE.input, 'mono', 'left'),
        txt(usd(ordMicro, 6), -140, -145, 28, ROLE.input, 'mono', 'right'),
        glowBar(-860, -104, 720, 20, ordMicro / writeMicro, { fill: ROLE.input, glow: 7 }),

        // Middle prefix row (Write -> Read)
        txt(
          isRead ? '1,280 read P1  ($0.20/M)' : '1,280 write P1  ($2.50/M)',
          -860,
          -40,
          26,
          midColor,
          'mono',
          'left',
        ),
        txt(usd(midMicro, 6), -140, -40, 28, midColor, 'mono', 'right').glow(7, midColor),
        glowBar(-860, 1, 720, 20, midMicro / writeMicro, { fill: midColor, glow: 9 }),

        // Output row
        txt('180 output  ($12.00/M)', -860, 65, 26, ROLE.output, 'mono', 'left'),
        txt(usd(outMicro, 6), -140, 65, 28, ROLE.output, 'mono', 'right'),
        glowBar(-860, 106, 720, 20, outMicro / writeMicro, { fill: ROLE.output, glow: 7 }),
      ];

      if (isRead) {
        nodes.push(
          txt(
            `CALL 2 (READ): ${usd(TERRA.readCallMicro, 6)}`,
            -860,
            196,
            36,
            ROLE.cached,
            'mono',
            'left',
          )
            .glow(8, ROLE.cached)
            .opacity(c2),
          txt(
            `Pair: ${usd(pairMicro, 6)}  vs  No-cache: ${usd(noCachePair, 6)}`,
            -860,
            262,
            28,
            ROLE.ok,
            'mono',
            'left',
          ).opacity(c2),
          txt(
            `Reuse repays write premium  ·  saves ${usd(noCachePair - pairMicro, 6)}`,
            -860,
            320,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(c2),
          txt('Unread write = pure extra cost', -860, 378, 26, ROLE.write, 'sans', 'left').opacity(
            c2,
          ),
        );
      } else if (c1 > 0.3) {
        nodes.push(
          txt(
            `CALL 1 (WRITE): ${usd(TERRA.writeCallMicro, 6)}`,
            -860,
            205,
            38,
            ROLE.write,
            'mono',
            'left',
          )
            .glow(8, ROLE.write)
            .opacity(c1),
          txt(
            '520 ordinary + 1,280 write = 1,800 input',
            -860,
            276,
            28,
            COSMOS.ink,
            'mono',
            'left',
          ).opacity(c1),
          txt(
            'Write price includes base input processing  ·  never double count',
            -860,
            345,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(c1),
        );
      } else {
        nodes.push(
          txt(
            '30-minute write = 1.25x ordinary input rate',
            -860,
            215,
            30,
            ROLE.write,
            'mono',
            'left',
          ).opacity(0.5 + 0.5 * p0.value),
          txt('Separate from GPT-5.4 monthly plan', -860, 285, 26, COSMOS.muted, 'sans', 'left'),
        );
      }

      // 3D column captions
      nodes.push(
        txt('Ordinary', 60, 365, 26, ROLE.input, 'mono'),
        txt(isRead ? 'Read P1' : 'Write P1', 330, 365, 26, midColor, 'mono').glow(6, midColor),
        txt('Output', 600, 365, 26, ROLE.output, 'mono'),
      );

      return group(...nodes);
    },
  );

  s.add(sceneAura, view3d, header, hud);
  orbitScene(s, c, view3d, { theta: -0.36, phi: 0.9 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulseT, 3.8, { startOffset: 0.1, endMargin: 0.5 });

  c.on('te-cache-write-0', () => {
    const t = c.cue('te-cache-write-0').start;
    s.play(p0.to(1, { duration: clampDur(c, t, 0.55) }));
  });
  c.on('te-cache-write-1', () => {
    const t = c.cue('te-cache-write-1').start;
    s.play(call1Done.to(1, { duration: clampDur(c, t, 0.55) }));
  });
  c.on('te-cache-write-2', () => {
    const t = c.cue('te-cache-write-2').start;
    s.play(call2Mode.to(1, { duration: clampDur(c, t, 0.55) }));
    fadeOutNodes(s, c, t, writePrism, 0.35);
    fadeInNodes(s, c, t, readPrism, 0.45);
  });
}
