// Scene 13: Who is the service owner? (Late chunking contextual pooling vs isolated encoding)
import {
  COSMOS,
  LATE_FIXTURE,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  meterBar,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function semanticAndLate(s, c) {
  const showIsolated = s.value(0);
  const showFull = s.value(0);
  const showPooled = s.value(0);
  const showReturn = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Who Is the', 'Service Owner?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'LATE CHUNKING · ENCODE FULL CONTEXT BEFORE POOLING SPAN STATES',
  });

  const live = guardedDynamic(s.value(1), () => {
    const si = showIsolated.value;
    const sf = showFull.value;
    const sp = showPooled.value;
    const sr = showReturn.value;

    const tokenNodes = [];
    const tokens = LATE_FIXTURE.tokens;
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      const tx = -755 + i * 212;
      const inSpan = i >= 4;
      const isMaya = i === 2;
      const col = isMaya
        ? COSMOS.gold
        : inSpan && sp > 0.3
          ? COSMOS.emerald
          : inSpan
            ? COSMOS.cyan
            : COSMOS.muted;
      tokenNodes.push(
        glassCell(tx, 10, 192, 118, col, {
          fill: isMaya ? '#241c10' : inSpan && sp > 0.3 ? '#0e2824' : '#10182d',
          glow: isMaya || (inSpan && sp > 0.3) ? 8 : 2,
        }),
        txt(tok.text, tx, -16, 27, col, 'mono'),
        txt(
          sf > 0.3 ? `f=${tok.mayaFeature.toFixed(2)}` : 'tok state',
          tx,
          30,
          26,
          inSpan && sp > 0.3 ? COSMOS.emerald : COSMOS.muted,
          'mono',
        ),
      );
    }

    const arcNodes =
      sf > 0.3
        ? [
            glowingArc([-331, -48], [93, -48], -58, {
              color: COSMOS.gold,
              width: 2.8,
              glow: 8,
              opacity: 0.78,
            }),
            glowingArc([-331, -48], [729, -48], -78, {
              color: COSMOS.cyan,
              width: 2.6,
              glow: 8,
              opacity: 0.72,
            }),
          ]
        : [];

    const nodes = [
      // Top comparison: Isolated encoding vs Late chunking pooled representation
      glassCell(-465, -172, 780, 140, si > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: '#26111a',
        glow: si > 0.3 ? 8 : 2,
      }),
      txt('ISOLATED 4-WORD ENCODE', -825, -208, 26, COSMOS.rose, 'mono', 'left'),
      txt('"page the service owner" alone', -825, -164, 26, COSMOS.ink, 'mono', 'left'),
      txt(
        `Maya coordinate = ${LATE_FIXTURE.localOwnerFeature.toFixed(2)} (name invisible)`,
        -825,
        -122,
        26,
        COSMOS.amber,
        'mono',
        'left',
      ),

      glassCell(465, -172, 780, 140, sp > 0.3 ? COSMOS.emerald : COSMOS.cyan, {
        fill: sp > 0.3 ? '#0e2824' : '#101d35',
        glow: sp > 0.3 ? 9 : 3,
      }),
      txt('LATE CHUNKING (SHARED CONTEXT)', 105, -208, 26, COSMOS.emerald, 'mono', 'left'),
      txt('Pool contextual states [4..7] after encode', 105, -164, 26, COSMOS.ink, 'mono', 'left'),
      txt(
        `Pooled Maya feature = ${LATE_FIXTURE.pooledFeature.toFixed(2)} (carries link)`,
        105,
        -122,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),

      ...arcNodes,
      ...tokenNodes,

      // Bottom meter and return-text reminder
      glassCell(-465, 206, 780, 134, sp > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#101d35',
        glow: sp > 0.3 ? 7 : 2,
      }),
      txt(
        `MEAN(0.72, 0.68, 0.70, 0.74) = ${LATE_FIXTURE.pooledFeature.toFixed(2)}`,
        -825,
        176,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      meterBar(-825, 224, 690, 24, LATE_FIXTURE.pooledFeature, COSMOS.emerald),

      glassCell(465, 206, 780, 134, sr > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#231c10',
        glow: sr > 0.3 ? 9 : 2,
      }),
      txt('STILL CHECK RETURNED TEXT!', 105, 174, 26, COSMOS.gold, 'mono', 'left'),
      txt(
        '4 words alone still lack "Maya" -> send naming line',
        105,
        220,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.cyan }),
      txt(
        'Late chunking helps retrieval find the span, but generation still needs permitted text naming Maya',
        -812,
        360,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('semantic-and-late-beat-1-focus-1', () => s.play(showIsolated.to(1, { duration: 0.4 })));
  c.on('semantic-and-late-beat-2-focus-2', () => s.play(showFull.to(1, { duration: 0.4 })));
  c.on('semantic-and-late-beat-2-focus-1', () => s.play(showPooled.to(1, { duration: 0.45 })));
  c.on('semantic-and-late-beat-3-focus-1', () =>
    s.play(
      showReturn.to(1, {
        duration: remainDuration(c, 'semantic-and-late-beat-3-focus-1', 0.45),
      }),
    ),
  );
}
