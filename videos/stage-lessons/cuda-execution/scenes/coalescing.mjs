// Scene 07: How many segments does one warp load touch? Coalesced vs strided global memory routing with prediction withholding.
import {
  COALESCED_REQ,
  COSMOS,
  STRIDED_REQ,
  TOKEN_VALUES,
  afterDuration,
  aura,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function coalescing(s, c) {
  const adjProg = s.value(0);
  const askPred = s.value(0);
  const mode = s.value(0); // 0=adjacent, 1=strided, 2=restored
  const fanProg = s.value(0);
  const fanAnswer = s.value(0);
  const restoreProg = s.value(0);

  const bgAura = aura(0, 40, 560, '#5ce1e622', '#ff6b8b16');

  const title = heroTitle(['Coalesced vs Strided', 'Warp Loads'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'GLOBAL MEMORY · 32-BYTE ALIGNED SEGMENTS (CC 6.0+)',
  });

  const live = guardedDynamic(1, () => {
    const m = Math.round(mode.value);
    const isStrided = m === 1;
    const isRestored = m === 2;
    const activeProg = isStrided ? fanProg.value : isRestored ? restoreProg.value : adjProg.value;
    const req = isStrided ? STRIDED_REQ : COALESCED_REQ;

    const subtitle = isStrided
      ? 'Stride 32 words (128 bytes apart) · same 8 logical values'
      : isRestored
        ? 'Restored adjacent layout · routes converge into segment 0'
        : askPred.value > 0.5
          ? 'What if we spread these 8 values 32 words apart?'
          : '8 active warp lanes · consecutive 4-byte words starting at byte 0';

    const nodes = [
      txt(subtitle, -855, -205, 28, isStrided ? COSMOS.rose : COSMOS.cyan, 'sans', 'left'),
    ];

    const laneY = -65;
    const segY = 200;
    const xStart = -735;
    const stepX = 210;

    // 8 active lanes at top
    req.rows.forEach((row, i) => {
      const lx = xStart + i * stepX;
      const lit = activeProg * 8 >= i + 0.3;
      const stroke = isStrided ? COSMOS.rose : COSMOS.blue;
      nodes.push(
        txt(`L${i} · val ${TOKEN_VALUES[i]}`, lx, laneY - 68, 26, COSMOS.muted, 'mono'),
        glassCell(lx, laneY, 178, 92, lit ? stroke : COSMOS.rule, {
          fill: isStrided ? '#1f1220' : '#0f182e',
          glow: lit ? 7 : 0,
        }),
        txt(
          lit ? `byte ${row.address}` : '·',
          lx,
          laneY + 4,
          28,
          lit ? COSMOS.ink : COSMOS.dim,
          'mono',
        ),
      );
    });

    // Destination segments at bottom
    if (isStrided) {
      req.segments.forEach((segId, idx) => {
        const sx = xStart + idx * stepX;
        const lit = activeProg * 8 >= idx + 0.5;
        nodes.push(
          glassCell(sx, segY, 178, 92, lit ? COSMOS.rose : COSMOS.rule, {
            fill: '#241220',
            glow: lit ? 8 : 0,
          }),
          txt(`seg ${segId}`, sx, segY + 4, 28, lit ? COSMOS.rose : COSMOS.dim, 'mono'),
        );
        if (lit) {
          nodes.push(
            glowingArc([sx, laneY + 50], [sx, segY - 50], 0, {
              color: COSMOS.rose,
              width: 3.2,
              opacity: 0.88,
            }),
          );
        }
      });
    } else {
      // Single aligned segment 0
      const segLit = activeProg > 0.08;
      nodes.push(
        glassCell(0, segY, 500, 98, segLit ? COSMOS.emerald : COSMOS.rule, {
          fill: '#0e2424',
          glow: segLit ? 10 : 0,
        }),
        txt(
          'segment 0  (bytes 0..31)',
          0,
          segY + 4,
          30,
          segLit ? COSMOS.emerald : COSMOS.dim,
          'mono',
        ),
      );
      req.rows.forEach((_, i) => {
        const lx = xStart + i * stepX;
        if (activeProg * 8 >= i + 0.3) {
          const tx = -175 + i * 50;
          nodes.push(
            glowingArc([lx, laneY + 50], [tx, segY - 58], -16, {
              color: COSMOS.cyan,
              width: 3.0,
              opacity: 0.82,
            }),
          );
        }
      });
    }

    // Bottom footprint receipt (strictly withhold stride-32 answer until fanAnswer!)
    let receiptText = 'Tracing adjacent warp load...';
    let receiptColor = COSMOS.cyan;
    if (!isStrided && !isRestored) {
      if (askPred.value > 0.5) {
        receiptText = 'Adjacent: 1 segment (32 B)   ·   Stride 32: ? segments (? B)';
        receiptColor = COSMOS.gold;
      } else if (adjProg.value > 0.7) {
        receiptText = '1 segment × 32 B = 32 B   ·   100% useful bytes';
        receiptColor = COSMOS.emerald;
      }
    } else if (isStrided) {
      if (fanAnswer.value > 0.5) {
        receiptText = '8 segments × 32 B = 256 B fetched for 32 useful bytes';
        receiptColor = COSMOS.rose;
      } else {
        receiptText = 'Spreading lanes to 128-byte stride...';
        receiptColor = COSMOS.gold;
      }
    } else if (isRestored) {
      receiptText =
        'Restored: 1 segment × 32 B = 32 B · stage rows in shared tile to read columns locally';
      receiptColor = COSMOS.emerald;
    }

    nodes.push(
      glassCell(0, 365, 1660, 96, receiptColor, { fill: '#101627', glow: 8 }),
      txt(receiptText, 0, 368, 30, receiptColor, 'mono').glow(6, receiptColor),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('collect-adjacent', () => s.play(adjProg.to(1, { duration: 0.8 })));
  c.on('predict-segments', () => s.play(askPred.to(1, { duration: 0.35 })));
  c.on('fan-segments', () => {
    s.play(mode.to(1, { duration: 0.05 }));
    s.play(fanProg.to(1, { duration: 1.0 }));
  });
  c.after('fan-segments', () =>
    s.play(fanAnswer.to(1, { duration: afterDuration(c, 'fan-segments', 0.45) })),
  );
  c.on('restore-segments', () => {
    s.play(mode.to(2, { duration: 0.05 }));
    s.play(restoreProg.to(1, { duration: remainDuration(c, 'restore-segments', 0.85) }));
  });
}
