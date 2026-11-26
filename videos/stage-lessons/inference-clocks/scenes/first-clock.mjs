// Scene 04: first-clock: Decompose 320 ms TTFT (Queue 70 + Tok 10 + Prefill 230 + Logit 10) -> remove queue -> add client +60 ms!
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
  txt,
} from '../parts.mjs';

export default function firstClock(s, c) {
  const queueMs = s.value(70); // 70 -> 0 -> 70
  const clientExtra = s.value(0); // 0 -> 30 (each way = +60 ms total!)

  const bgAura = aura(0, 0, 740, '#16355e28', '#3c251218');
  const title = heroTitle(['Decompose TTFT:', 'where the first wait goes'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.wait,
  });

  const scale = 3.2; // px per ms (400ms = 1280px)
  const originX = -620;

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const q = queueMs.value;
    const cx = clientExtra.value;
    const serverTotal = Math.round(q + 10 + 230 + 10); // 320 or 250
    const clientTotal = Math.round(serverTotal + 2 * cx); // 320 or 380

    const spans = [
      { name: 'Queue', ms: q, col: ROLE.wait },
      { name: 'Tok', ms: 10, col: ROLE.clockB },
      { name: 'Prefill', ms: 230, col: ROLE.prefill },
      { name: 'Logit', ms: 10, col: ROLE.decode },
    ];

    const nodes = [
      txt(`SERVER TTFT = ${serverTotal} ms`, -855, -210, 34, ROLE.clockA, 'mono', 'left')
        .glow(8, ROLE.clockA)
        .opacity(alpha),
    ];

    // Stacked server timeline bar at y = -80
    let cursorX = originX;
    spans.forEach((sp) => {
      if (sp.ms > 1) {
        const w = sp.ms * scale;
        nodes.push(lumBar(cursorX, -80, w, 54, sp.col, { opacity: alpha, glow: 8 }));
        if (w >= 95) {
          nodes.push(
            txt(
              `${sp.name} ${Math.round(sp.ms)}ms`,
              cursorX + w * 0.5,
              -145,
              26,
              sp.col,
              'mono',
              'center',
            ).opacity(alpha),
          );
        }
        cursorX += w;
      }
    });

    // Legend for tiny 10ms spans
    nodes.push(
      txt(
        'Tokenization: 10 ms   ·   First-logit work: 10 ms   ·   Prefill: 230 ms (unchanged)',
        -855,
        25,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
    );

    // Client-observed clock below (when clientExtra > 0)
    if (cx > 1) {
      const aC = Math.min(1, cx / 25) * alpha;
      const sendX = originX - cx * scale;
      const totalW = clientTotal * scale;
      nodes.push(
        txt(
          `CLIENT-OBSERVED TTFT = ${clientTotal} ms  (+${Math.round(cx)} ms send, +${Math.round(cx)} ms recv)`,
          -855,
          145,
          30,
          ROLE.stall,
          'mono',
          'left',
        )
          .glow(8, ROLE.stall)
          .opacity(aC),
        lumBar(sendX, 235, cx * scale, 48, ROLE.network, { opacity: aC }),
        lumBar(originX, 235, serverTotal * scale, 48, ROLE.clockA, { opacity: aC }),
        lumBar(originX + serverTotal * scale, 235, cx * scale, 48, ROLE.network, { opacity: aC }),
        txt(
          'Always name the observation point (server vs client, proxy, or hidden reasoning)',
          -855,
          355,
          28,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(aC),
      );
      void totalW;
    } else {
      nodes.push(
        txt(
          q < 35 ? 'Zero queue trims TTFT 320 → 250 ms' : 'Queue waits before GPU prefill',
          -855,
          200,
          32,
          ROLE.wait,
          'serif',
          'left',
        ).opacity(alpha),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'remove-queue', (d) => s.play(queueMs.to(0, { duration: d })), { dur: 0.75 });
  playCue(s, c, 'restore-queue', (d) => s.play(queueMs.to(70, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'client-boundaries', (d) => s.play(clientExtra.to(30, { duration: d })), {
    dur: 0.65,
  });
  bindCueBeat(s, c, s.value(0), [
    'construct-first-clock',
    'first-token-endpoint',
    'fixed-prefill',
    'observation-point',
  ]);
}
