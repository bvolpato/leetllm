// Scene 18: private-boundary: Local process vs on-prem vs outside cloud; forwarding hop past local endpoint; HIPAA/GDPR vs product contract.
import {
  COSMOS,
  ROLE,
  arrow,
  aura,
  bindCueBeat,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  txt,
} from '../parts.mjs';

export default function privateBoundary(s, c) {
  const showHop = s.value(0);
  const showLegal = s.value(0);
  const accent = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(['Where Can the Incident', 'Log Actually Travel?'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.gold,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const hp = showHop.value;
    const lg = showLegal.value;

    const nodes = [
      txt(
        'DATA BOUNDARY AUDIT: LOCAL ENDPOINT != GUARANTEED LOCAL PROCESSING',
        -855,
        -220,
        26,
        ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha),

      chipPill('Laptop / Local API', -625, -95, {
        w: 430,
        h: 82,
        color: ROLE.ok,
        size: 28,
        opacity: alpha,
      }),
      arrow([-400, -95], [-265, -95], { stroke: ROLE.vram, width: 3.5, head: 12 }).opacity(alpha),
      chipPill('On-Prem Service', -35, -95, {
        w: 430,
        h: 82,
        color: ROLE.vram,
        size: 28,
        opacity: alpha,
      }),
      arrow([190, -95], [325, -95], {
        stroke: hp > 0.3 ? ROLE.work : COSMOS.rule,
        width: 3.8,
        head: 12,
      }).opacity(alpha * (0.45 + 0.55 * hp)),
      chipPill('External Cloud Hop!', 590, -95, {
        w: 490,
        h: 82,
        color: hp > 0.3 ? ROLE.work : COSMOS.rule,
        fill: hp > 0.3 ? '#321420' : '#10182d',
        size: 28,
        glow: hp > 0.3 ? 12 : 0,
        opacity: alpha * (0.45 + 0.55 * hp),
      }),

      chipPill(
        'Air Gap = physical separation + controlled artifact transfer + per-caller retrieval ACLs',
        0,
        60,
        {
          w: 1580,
          h: 74,
          color: ROLE.gold,
          size: 26,
          opacity: alpha,
        },
      ),

      txt(
        lg > 0.3
          ? 'Hosting != legal status (HIPAA/GDPR depend on agreements & safeguards); product rule keeps logs internal even on failure!'
          : 'A server on localhost or on-prem can still forward prompts to an outside API if egress is unblocked',
        0,
        225,
        26,
        lg > 0.3 ? ROLE.ok : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'pl-private-boundary-0-1', (d) => s.play(showHop.to(1, { duration: d })));
  playCue(s, c, 'pl-private-boundary-1-0', (d) => s.play(showLegal.to(1, { duration: d })));
  bindCueBeat(s, c, accent, [
    'pl-private-boundary-0-0',
    'pl-private-boundary-0-2',
    'pl-private-boundary-0-3',
    'pl-private-boundary-0-4',
    'pl-private-boundary-1-1',
    'pl-private-boundary-1-2',
    'pl-private-boundary-1-3',
  ]);
}
