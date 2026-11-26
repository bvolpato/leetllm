// Scene 16: outbound-contract - Authorize the complete outgoing resource
// Canonical 7-slot URL optical dissector backed directly by `linkResourceAllowed`:
// splits scheme/creds/host/port/path/query/fragment, fires live rejected probes
// (evil.test host, ?secret=PRIVATE query, #x fragment, http), then adds a redirect &
// DNS rebind arrow hitting a connection-time egress proxy shield.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  LINK_ALLOWED,
  LINK_EVIL_HOST,
  LINK_FRAGMENT,
  LINK_HTTP,
  LINK_QUERY,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  energyRail,
  guardedDynamic,
  hexGate,
  linkResourceAllowed,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function outboundContract(s, c) {
  const pulse = s.value(0);
  const slotsHi = s.value(0);
  const queryHi = s.value(0);
  const proxyHi = s.value(0);

  const probes = [
    { url: LINK_ALLOWED, slot: 'ALL 7 SLOTS MATCH', ok: linkResourceAllowed(LINK_ALLOWED) },
    {
      url: LINK_EVIL_HOST,
      slot: 'HOST MISMATCH (.evil.test)',
      ok: linkResourceAllowed(LINK_EVIL_HOST),
    },
    { url: LINK_QUERY, slot: 'NONEMPTY QUERY (?secret=...)', ok: linkResourceAllowed(LINK_QUERY) },
    { url: LINK_FRAGMENT, slot: 'FRAGMENT (#x) REJECTED', ok: linkResourceAllowed(LINK_FRAGMENT) },
    { url: LINK_HTTP, slot: 'PLAIN HTTP REJECTED', ok: linkResourceAllowed(LINK_HTTP) },
  ];

  const header = cinemaHeader(
    'OUTBOUND URL & EGRESS CONTRACT',
    'Authorize the complete',
    'outgoing resource',
    { accent: ROLE.host, size: 48 },
  );

  const stageAura = aura(100, 30, 620, '#5ce1e61a', '#ff6b8b18');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const sh = slotsHi.value;
      const qh = queryHi.value;
      const ph = proxyHi.value;
      const nodes = [];

      // Top: 7 Canonical URL Slots across full width
      const slots = [
        ['SCHEME', 'https', ROLE.ok, -745, 195],
        ['CREDS', 'none', ROLE.ok, -525, 185],
        ['HOST', 'evals.mlplatform', ROLE.host, -245, 315],
        ['PORT', '443', ROLE.ok, 15, 145],
        ['PATH', '/runs/R42', ROLE.host, 215, 200],
        ['QUERY', 'empty', qh > 0.3 ? ROLE.attack : ROLE.ok, 445, 200],
        ['FRAG', 'empty', qh > 0.3 ? ROLE.untrusted : ROLE.ok, 680, 210],
      ];

      const slotY = -165;
      slots.forEach(([k, v, col, cx, w]) => {
        nodes.push(
          rect(w, 92, { fill: '#0e1529', stroke: col, width: 2.4, radius: 8 })
            .at(cx, slotY)
            .glow(sh > 0.3 ? 6 : 2, col),
          txt(k, cx, slotY - 22, 26, COSMOS.muted, 'mono', 'center'),
          txt(v, cx, slotY + 20, 26, col, 'mono', 'center'),
        );
      });

      // Middle Left: 5 Live URL Probes evaluated by linkResourceAllowed()
      nodes.push(
        txt('CANONICAL URL CHECKS (ZERO NETWORK CALLS)', -855, -72, 26, ROLE.host, 'mono', 'left'),
      );
      probes.forEach((pr, i) => {
        const y = -10 + i * 64;
        const col = pr.ok ? ROLE.ok : ROLE.denied;
        const hiQuery = i === 2 && qh > 0.3;
        nodes.push(
          energyRail(-855, y - 18, y + 18, col, { width: 5, glow: hiQuery ? 12 : 5 }),
          txt(pr.slot, -825, y, 26, hiQuery ? ROLE.attack : COSMOS.ink, 'mono', 'left').glow(
            hiQuery ? 7 : 0,
            ROLE.attack,
          ),
          txt(pr.ok ? 'ALLOW' : 'BLOCK', 105, y, 26, col, 'mono', 'right').glow(
            hiQuery ? 8 : 3,
            col,
          ),
          line([-825, y + 30], [105, y + 30], { stroke: '#1d2948', width: 1.4 }),
        );
      });

      // Middle Right: Redirect & DNS Rebind -> Connection-Time Egress Proxy Shield
      const pAlpha = 0.45 + ph * 0.55;
      const gateX = 560;
      const gateY = 62;
      const redirArc = quadArcPts([145, gateY], [gateX - 95, gateY], 0, 18);
      nodes.push(
        beamWithPhotons(redirArc, ROLE.untrusted, p * 1.1, { width: 3.4, alpha: pAlpha }),
        txt('REDIRECT / DNS REBIND', 300, -10, 26, ROLE.untrusted, 'mono', 'center').opacity(
          pAlpha,
        ),
        hexGate(gateX, gateY, 60, ph > 0.3 ? ROLE.host : '#3a4e7c', {
          label: 'PROXY',
          sub: 'CONNECT-TIME IP CHECK',
          opacity: pAlpha,
          glow: ph > 0.3 ? 11 : 4,
        }),
        txt(
          'Enforce IPv4 + IPv6 + internal routes',
          525,
          240,
          26,
          COSMOS.ink,
          'sans',
          'center',
        ).opacity(pAlpha),
        txt(
          'Constrain method · headers · body · creds',
          525,
          290,
          26,
          ROLE.host,
          'mono',
          'center',
        ).opacity(pAlpha),
      );

      // Bottom rule
      nodes.push(
        line([-855, 342], [845, 342], { stroke: '#25355a', width: 2 }),
        txt(
          'BUILD FIXED URL FROM TRUSTED REPORT ID  ·  ALLOWED HOST ≠ WRITE PERMISSION',
          0,
          388,
          26,
          ROLE.ok,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('pi-outbound-contract-0', () => {
    s.play(slotsHi.to(1, { duration: clampDur(c, c.cue('pi-outbound-contract-0').start, 0.45) }));
  });
  c.on('pi-outbound-contract-1', () => {
    s.play(queryHi.to(0.6, { duration: clampDur(c, c.cue('pi-outbound-contract-1').start, 0.35) }));
  });
  c.on('pi-query-denied', () => {
    s.play(queryHi.to(1, { duration: clampDur(c, c.cue('pi-query-denied').start, 0.35) }));
  });
  c.on('pi-outbound-contract-2', () => {
    s.play(proxyHi.to(1, { duration: clampDur(c, c.cue('pi-outbound-contract-2').start, 0.45) }));
  });
}
