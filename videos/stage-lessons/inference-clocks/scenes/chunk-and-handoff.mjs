// Scene 12: chunk-and-handoff: Monolithic prefill stall (200 + 35 = 235 ms) -> 4-chunk SARATHI interleaving -> disaggregated KV link floor (10.7 vs 172 ms).
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  swapVis,
  txt,
} from '../parts.mjs';

export default function chunkAndHandoff(s, c) {
  const view1Vis = s.value(1);
  const view2Vis = s.value(0);
  const reveal235 = s.value(0); // strictly withheld until AFTER `stall-total`!
  const showChunked = s.value(0);
  const showLongLink = s.value(0);

  const bgAura = aura(0, 0, 740, '#16355e28', '#3c251218');
  const title = heroTitle(['Chunked Prefill', '& Disaggregated Handoff'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.prefill,
  });

  // View 1: Monolithic 200ms prefill stalls chat (235ms gap) vs 4-chunk interleaved schedule
  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const r235 = reveal235.value;
    const chk = showChunked.value;
    const x0 = -560;
    const scale = 4.2; // 235 ms = 987 px
    const nodes = [
      txt(
        'MONOLITHIC PREFILL (200 ms) + CHAT DECODE (35 ms)',
        -855,
        -215,
        26,
        ROLE.stall,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(x0, -135, 200 * scale, 48, ROLE.prefill, { opacity: alpha }),
      lumBar(x0 + 200 * scale, -135, 35 * scale, 48, ROLE.clockA, { opacity: alpha }),
      txt(
        'New Prompt Prefill (200 ms)',
        x0 + 420,
        -190,
        26,
        ROLE.prefill,
        'mono',
        'center',
      ).opacity(alpha),
      txt('Decode (35)', x0 + 915, -190, 26, ROLE.clockA, 'mono', 'center').opacity(alpha),
    ];

    if (r235 < 0.2) {
      nodes.push(
        txt(
          'How long does the live chat wait between tokens?',
          -855,
          10,
          36,
          ROLE.wait,
          'serif',
          'left',
        )
          .glow(8, ROLE.wait)
          .opacity((1 - r235 * 5) * alpha),
      );
    } else {
      nodes.push(
        txt(
          'Wait = 200 + 35 = 235 ms stall on the live chat!',
          -855,
          -25,
          34,
          ROLE.stall,
          'mono',
          'left',
        )
          .glow(8, ROLE.stall)
          .opacity(r235 * alpha),
      );
    }

    // 4-chunk interleaved schedule below (always quiet skeleton, illuminates on `split-prompt`)
    const aC = (0.25 + 0.75 * chk) * alpha;
    nodes.push(
      txt(
        'CHUNKED PREFILL (4 × 2,048 TOKENS INTERLEAVED WITH DECODE)',
        -855,
        105,
        26,
        ROLE.decode,
        'mono',
        'left',
      ).opacity(aC),
    );
    let cx = x0;
    for (let i = 0; i < 4; i++) {
      const pw = 50 * scale;
      const dw = 35 * scale;
      nodes.push(
        lumBar(cx, 185, pw, 44, ROLE.prefill, { opacity: aC }),
        lumBar(cx + pw + 6, 185, dw, 44, ROLE.decode, { opacity: aC }),
      );
      cx += pw + dw + 14;
    }
    nodes.push(
      txt(
        'Chat streams steadily after each 50 ms chunk; check new prompt TTFT trade-off',
        -855,
        295,
        28,
        ROLE.decode,
        'sans',
        'left',
      ).opacity(aC),
    );
    return group(...nodes);
  });

  // View 2: Disaggregated KV handoff on 200 Gbps (25 GB/s) link: 4k -> 10.7 ms vs 64k -> 172 ms
  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const lng = showLongLink.value;
    const maxW = 920;
    const barX = -420;
    const nodes = [
      txt(
        'DISAGGREGATED KV TRANSFER FLOOR AT 200 Gbps (25 GB/s)',
        -855,
        -215,
        28,
        ROLE.clockA,
        'mono',
        'left',
      ).opacity(alpha),
      txt('4,096 pos (0.25 GiB)', -855, -100, 30, ROLE.clockA, 'mono', 'left').opacity(alpha),
      lumBar(barX, -100, (10.7 / 180) * maxW, 42, ROLE.clockA, { opacity: alpha, maxTrackW: maxW }),
      txt('≈ 10.7 ms floor', barX + maxW + 30, -100, 32, ROLE.clockA, 'mono', 'left').opacity(
        alpha,
      ),

      txt(
        '65,536 pos (16×)',
        -855,
        35,
        30,
        lng > 0.2 ? ROLE.stall : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(barX, 35, (172 / 180) * maxW * Math.max(0.06, lng), 42, ROLE.stall, {
        opacity: (0.28 + 0.72 * lng) * alpha,
        maxTrackW: maxW,
      }),
      txt(
        lng > 0.2 ? '≈ 172 ms floor' : 'long prefix',
        barX + maxW + 30,
        35,
        34,
        lng > 0.2 ? ROLE.stall : COSMOS.dim,
        'mono',
        'left',
      )
        .glow(lng > 0.2 ? 8 : 0, ROLE.stall)
        .opacity(alpha),

      txt(
        'Compare both clocks (TTFT + TPOT), goodput, and cost on realistic burst arrivals',
        -855,
        235,
        30,
        ROLE.wait,
        'serif',
        'left',
      ).opacity(alpha),
    ];
    return group(...nodes);
  });

  s.add(bgAura, title, view1, view2);
  // Strictly withhold 235 ms until AFTER `stall-total`!
  playCue(s, c, 'stall-total', (d) => s.play(reveal235.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'split-prompt', (d) => s.play(showChunked.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'send-short', (d) => s.play(swapVis(view1Vis, view2Vis, d)), { dur: 0.6 });
  playCue(s, c, 'long-floor', (d) => s.play(showLongLink.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  bindCueBeat(s, c, s.value(0), [
    'exclusive-work',
    'decode-turn',
    'interleave-decode',
    'short-floor',
    'send-long',
  ]);
}
