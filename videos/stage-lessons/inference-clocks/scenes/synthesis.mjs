// Scene 07: synthesis: Same client pause (385 -> 470ms) diagnosed into Run 1 (downstream proxy 78ms) vs Run 2 (upstream worker 83ms)!
import {
  COSMOS,
  ROLE,
  alternateServerTimes,
  aura,
  bindCueBeat,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  tokenTimes,
  txt,
} from '../parts.mjs';

export default function synthesis(s, c) {
  const showRun1 = s.value(0);
  const showRun2 = s.value(0);
  const revealVerdict = s.value(0); // strictly withheld until AFTER `upstream`!

  const bgAura = aura(0, 0, 740, '#3a1a3626', '#16355e18');
  const title = heroTitle(['Same Client Pause,', 'Two Different Causes'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.wait,
  });

  const barX = -460;
  const maxW = 1040;
  const spanMs = 115; // 355ms -> 470ms
  const r1Server = tokenTimes[2] - tokenTimes[1]; // 392 - 355 = 37 ms
  const r1Wire = 470 - tokenTimes[2]; // 78 ms
  const r2Server = alternateServerTimes[2] - alternateServerTimes[1]; // 438 - 355 = 83 ms
  const r2Wire = 470 - alternateServerTimes[2]; // 32 ms

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const r1 = showRun1.value;
    const r2 = showRun2.value;
    const vd = revealVerdict.value;
    const nodes = [
      txt(
        'SHARED CLIENT VIEW:  T2 at 385 ms  →  T3+T4 at 470 ms (85 ms pause)',
        -855,
        -215,
        28,
        ROLE.stall,
        'mono',
        'left',
      ).opacity(alpha),
      txt('SERVER COMPUTE (T2 → T3)', barX, -145, 26, ROLE.clockA, 'mono', 'left').opacity(alpha),
      txt('DOWNSTREAM PROXY / WIRE', barX + 490, -145, 26, ROLE.stall, 'mono', 'left').opacity(
        alpha,
      ),
    ];

    // Quiet tracks visible from t=0; luminous bars fill as Run 1 and Run 2 are diagnosed!
    const aR1 = (0.3 + 0.7 * r1) * alpha;
    const w1a = (r1Server / spanMs) * maxW;
    const w2a = (r1Wire / spanMs) * maxW;
    nodes.push(
      txt(
        'Run 1 (T3 @ 392ms)',
        -855,
        -55,
        28,
        r1 > 0.2 ? COSMOS.ink : COSMOS.dim,
        'mono',
        'left',
      ).opacity(aR1),
      lumBar(barX, -55, w1a, 44, ROLE.clockA, { opacity: aR1 }),
      lumBar(barX + w1a, -55, w2a, 44, ROLE.stall, { opacity: aR1 }),
      txt(`${r1Server} ms`, barX + w1a * 0.5, -5, 26, ROLE.clockA, 'mono', 'center').opacity(aR1),
      txt(
        `${r1Wire} ms wire/proxy`,
        barX + w1a + w2a * 0.5,
        -5,
        26,
        ROLE.stall,
        'mono',
        'center',
      ).opacity(aR1),
    );

    const aR2 = (0.3 + 0.7 * r2) * alpha;
    const w1b = (r2Server / spanMs) * maxW;
    const w2b = (r2Wire / spanMs) * maxW;
    nodes.push(
      txt(
        'Run 2 (T3 @ 438ms)',
        -855,
        110,
        28,
        r2 > 0.2 ? COSMOS.ink : COSMOS.dim,
        'mono',
        'left',
      ).opacity(aR2),
      lumBar(barX, 110, w1b, 44, ROLE.wait, { opacity: aR2 }),
      lumBar(barX + w1b, 110, w2b, 44, ROLE.stall, { opacity: aR2 }),
      txt(`${r2Server} ms server`, barX + w1b * 0.5, 160, 26, ROLE.wait, 'mono', 'center').opacity(
        aR2,
      ),
      txt(`${r2Wire} ms`, barX + w1b + w2b * 0.5, 160, 26, ROLE.stall, 'mono', 'center').opacity(
        aR2,
      ),
    );
    if (r2 > 0.05 && vd < 0.2) {
      nodes.push(
        txt(
          'Which worker schedule would you inspect first for a prefill stall?',
          -855,
          285,
          34,
          ROLE.wait,
          'serif',
          'left',
        )
          .glow(8, ROLE.wait)
          .opacity(r2 * (1 - vd * 5) * alpha),
      );
    }

    if (vd > 0.2) {
      nodes.push(
        txt(
          'Open Worker 2 first: 83 ms server gap indicates upstream scheduler/prefill interference',
          -855,
          285,
          30,
          ROLE.wait,
          'mono',
          'left',
        )
          .glow(8, ROLE.wait)
          .opacity(vd * alpha),
      );
    }
    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'fast-source', (d) => s.play(showRun1.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'swap-source', (d) => s.play(showRun2.to(1, { duration: d })), { dur: 0.5 });
  // Strictly withhold Worker 2 verdict until AFTER `upstream`!
  playCue(s, c, 'upstream', (d) => s.play(revealVerdict.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  bindCueBeat(s, c, s.value(0), ['client-evidence', 'ask-source', 'downstream']);
}
