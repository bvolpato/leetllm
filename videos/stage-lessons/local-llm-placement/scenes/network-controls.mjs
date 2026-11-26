// Scene 19: network-controls: OLLAMA_NO_CLOUD scope, loopback auth/ACL, onward internal relay leak & controlled offline fallback test.
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  txt,
} from '../parts.mjs';

export default function networkControls(s, c) {
  const showRelay = s.value(0);
  const showFallback = s.value(0);
  const accent = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(['Network Controls:', 'Trace Caller & Last Hop'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.vram,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const rl = showRelay.value;
    const fb = showFallback.value;

    const nodes = [
      txt(
        '1. NO-CLOUD SCOPE & CALLER AUTHENTICATION',
        -855,
        -220,
        26,
        ROLE.vram,
        'mono',
        'left',
      ).opacity(alpha),
      chipPill(
        'no-cloud disables cloud/web-search (audit registry, telemetry & proxies too)',
        -120,
        -135,
        {
          w: 1380,
          h: 72,
          color: ROLE.vram,
          size: 26,
          opacity: alpha,
        },
      ),
      chipPill('Auth + ACL', 725, -135, {
        w: 250,
        h: 72,
        color: ROLE.ok,
        size: 26,
        opacity: alpha,
      }),

      txt(
        '2. END-TO-END EGRESS AUDIT (FIRST HOP OK != FULL ROUTE OK)',
        -855,
        -20,
        26,
        ROLE.work,
        'mono',
        'left',
      ).opacity(alpha * (0.45 + 0.55 * rl)),
      chipPill('Retrieval -> Model -> Tools -> Internal Relay -> BLOCKED OUTSIDE HOP!', 0, 65, {
        w: 1580,
        h: 74,
        color: rl > 0.3 ? ROLE.work : COSMOS.rule,
        fill: rl > 0.3 ? '#321420' : '#10182d',
        size: 26,
        glow: rl > 0.3 ? 10 : 0,
        opacity: alpha * (0.45 + 0.55 * rl),
      }),

      txt('3. CONTROLLED FAILURE & FALLBACK TEST', -855, 180, 26, ROLE.ok, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * fb),
      ),
      chipPill(
        'Disable worker / unknown runbook -> local docs or human (verify denied egress in net log!)',
        0,
        265,
        {
          w: 1620,
          h: 74,
          color: fb > 0.3 ? ROLE.ok : COSMOS.rule,
          fill: fb > 0.3 ? '#0f2d24' : '#10182d',
          size: 26,
          glow: fb > 0.3 ? 10 : 0,
          opacity: alpha * (0.45 + 0.55 * fb),
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'pl-network-controls-1-0', (d) => s.play(showRelay.to(1, { duration: d })));
  playCue(s, c, 'pl-network-controls-2-0', (d) => s.play(showFallback.to(1, { duration: d })));
  bindCueBeat(s, c, accent, [
    'pl-network-controls-0-0',
    'pl-network-controls-0-1',
    'pl-network-controls-0-2',
    'pl-network-controls-0-3',
    'pl-network-controls-0-4',
    'pl-network-controls-1-1',
    'pl-network-controls-1-2',
    'pl-network-controls-1-3',
    'pl-network-controls-2-1',
    'pl-network-controls-2-2',
    'pl-network-controls-2-3',
  ]);
}
