// Scene 05: api-receipt - The response and support lookup name the same request
// POST /v1/responses + GET /v1/requests/{id} sharing server-minted request_id, redacted secrets,
// documented 429 vs 503 split, and circuit-breaker fallback requiring approved policy + budget.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function apiReceipt(s, c) {
  const phase = s.value(0);
  const logOn = s.value(0);
  const statusOn = s.value(0);
  const fallbackOn = s.value(0);

  const header = cinemaHeader(
    'CONCRETE GATEWAY API',
    'Response & support',
    'share one request ID',
    {
      x: -860,
      y: -445,
      accent: ROLE.req,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#5ce1e61a', '#ffd16618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const lg = logOn.value;
      const st = statusOn.value;
      const fb = fallbackOn.value;
      const nodes = [];

      // Left: API Endpoints + Control Join
      const lx = -840;
      nodes.push(
        txt('DATA-PLANE & SUPPORT ENDPOINTS', lx, -185, 26, ROLE.req, 'mono', 'left'),
        txt('POST /v1/responses  -> mints request_id', lx, -125, 26, COSMOS.ink, 'mono', 'left'),
        txt('GET  /v1/requests/{id} -> authorized lookup', lx, -70, 26, ROLE.ok, 'mono', 'left'),
        txt('Org · Workspace · Key ->', lx, 5, 26, ROLE.policy, 'mono', 'left'),
        txt('  entitlement_id + route_id + quota_bucket', lx, 55, 26, COSMOS.muted, 'mono', 'left'),
        txt('Request ID alone grants ZERO access!', lx, 125, 26, ROLE.fail, 'mono', 'left').opacity(
          0.45 + lg * 0.55,
        ),
        txt(
          'Redact all raw secrets before logging',
          lx,
          175,
          26,
          ROLE.warn,
          'mono',
          'left',
        ).opacity(0.45 + lg * 0.55),
      );

      // Right: Structured Receipt + 429/503 + Breaker Fallback
      const rx = 120;
      nodes.push(
        line([65, -210], [65, 210], { stroke: '#2c3d66', width: 2.5 }),
        txt('RECEIPT FIELDS & ERROR POLICY', rx, -185, 26, ROLE.focus, 'mono', 'left'),
        txt(
          'policy_ver · token_est · queue_wait',
          rx,
          -125,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(0.45 + lg * 0.55),
        txt('provider_ms · result · stable_cause', rx, -72, 26, COSMOS.ink, 'mono', 'left').opacity(
          0.45 + lg * 0.55,
        ),
        txt('HTTP 429: exhausted caller quota', rx, 5, 26, ROLE.warn, 'mono', 'left').opacity(
          0.4 + st * 0.6,
        ),
        txt('HTTP 503: shared capacity overload', rx, 58, 26, ROLE.fail, 'mono', 'left').opacity(
          0.4 + st * 0.6,
        ),
        txt(
          'Breaker -> approved fallback + budget',
          rx,
          130,
          26,
          fb > 0.4 ? ROLE.ok : COSMOS.muted,
          'mono',
          'left',
        ).opacity(0.4 + fb * 0.6),
        txt(
          'Retry-After needs a defensible estimate',
          rx,
          180,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(0.4 + st * 0.6),
      );

      nodes.push(
        txt('ADMIN PLANE SEPARATE', 480, -425, 26, ROLE.policy, 'mono', 'center'),
        txt('Manage keys & limits off the hot path', 480, -378, 26, COSMOS.muted, 'mono', 'center'),
        line([-840, 260], [840, 260], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'Keep upstream provider errors internally; return stable, explainable receipts externally',
          0,
          330,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.req,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.2);

  c.on('sd-api-receipt-1-operation', () => {
    s.play(logOn.to(1, { duration: clampDur(c, c.cue('sd-api-receipt-1-operation').start, 0.35) }));
  });
  c.on('sd-api-receipt-2-operation', () => {
    s.play(
      statusOn.to(1, { duration: clampDur(c, c.cue('sd-api-receipt-2-operation').start, 0.35) }),
    );
  });
  c.on('sd-api-receipt-2-result', () => {
    s.play(
      fallbackOn.to(1, { duration: clampDur(c, c.cue('sd-api-receipt-2-result').start, 0.35) }),
    );
  });
}
