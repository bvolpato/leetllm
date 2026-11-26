// Scene 08: prefill: Chunked prefill sharing a 12-token pass budget (3 live decodes + chunks of 9, 9, and 2).
import {
  COSMOS,
  ROLE,
  aura,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function prefill(s, c) {
  const passNum = s.value(0); // 0=overview, 1=pass1 (9), 2=pass2 (9), 3=pass3 (2), 4=tradeoff

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a1d1422');
  const title = heroTitle(['Chunked Prefill:', 'Sharing a 12-Token Pass Budget'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.prefill,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const p = Math.round(passNum.value);
    const chunkSizes = [0, 9, 9, 2, 2];
    const doneTokens = [0, 9, 18, 20, 20][Math.min(4, p)];
    const curChunk = chunkSizes[Math.min(4, p)];

    const nodes = [
      txt(
        'PASS WORK BUDGET = 12 INPUT POSITIONS (3 LIVE DECODES + UP TO 9 PREFILL)',
        -855,
        -220,
        26,
        ROLE.a,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    // 12 work-slot tiles across x = -790 .. +790
    for (let i = 0; i < 12; i++) {
      const cx = -785 + i * 142;
      const isDecode = i < 3;
      const isChunk = !isDecode && i - 3 < curChunk;
      const col = isDecode ? ROLE.a : isChunk ? ROLE.prefill : COSMOS.rule;
      const fill = isDecode ? '#11304a' : isChunk ? '#352410' : '#0e1526';
      nodes.push(
        rect(128, 92, { fill, stroke: col, width: 2.6, radius: 10 }).at(cx, -105).opacity(alpha),
        txt(
          isDecode ? `Dec ${i + 1}` : isChunk ? `P${i - 2}` : 'free',
          cx,
          -105,
          26,
          isDecode || isChunk ? col : COSMOS.dim,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }

    // 20-token waiting prompt progress strip
    nodes.push(
      txt(
        `WAITING 20-TOKEN PROMPT:  ${doneTokens} / 20 PROCESSED  (CHUNKS: 9 -> 9 -> 2)`,
        -855,
        30,
        26,
        ROLE.prefill,
        'mono',
        'left',
      ).opacity(alpha),
    );
    for (let i = 0; i < 20; i++) {
      const cx = -815 + i * 85;
      const processed = i < doneTokens;
      const chunkCol = i < 9 ? ROLE.prefill : i < 18 ? ROLE.d : ROLE.ok;
      nodes.push(
        rect(74, 58, {
          fill: processed ? '#1a2c24' : '#0f1628',
          stroke: processed ? chunkCol : COSMOS.rule,
          width: 2.2,
          radius: 7,
        })
          .at(cx, 105)
          .opacity(alpha * (processed ? 1 : 0.45)),
        txt(`${i + 1}`, cx, 105, 26, processed ? chunkCol : COSMOS.dim, 'mono', 'center').opacity(
          alpha,
        ),
      );
    }

    nodes.push(
      txt(
        p >= 4
          ? 'Smaller chunks protect live inter-token gaps (ITL); larger chunks lower new-prompt TTFT'
          : 'Every pass advances all 3 live streams by 1 token while building prefix KV incrementally',
        0,
        265,
        28,
        p >= 4 ? ROLE.ok : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'long-prompt', (d) => s.play(passNum.to(0, { duration: d })));
  playCue(s, c, 'one-per-stream', (d) => s.play(passNum.to(0, { duration: d })));
  playCue(s, c, 'input-budget', (d) => s.play(passNum.to(0, { duration: d })));
  playCue(s, c, 'chunk-prompt', (d) => s.play(passNum.to(1, { duration: d })));
  playCue(s, c, 'prefill-second', (d) => s.play(passNum.to(2, { duration: d })));
  playCue(s, c, 'later-chunks', (d) => s.play(passNum.to(3, { duration: d })));
  playCue(s, c, 'input-work', (d) => s.play(passNum.to(4, { duration: d })));
  playCue(s, c, 'per-user-gaps', (d) => s.play(passNum.to(4, { duration: d })));
}
