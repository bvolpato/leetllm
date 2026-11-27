// Scene 26: mcp-exposure - Review what crosses the remote and local server boundaries
// Three Trust Airlocks:
//   1. Remote Outbound Firewall (explicit disclosure boundary + steering defense)
//   2. Local One-Click Command Approval Airlock (exact command shown + sandboxed privileges)
//   3. Token Audience & Scope Gate (reject wrong-audience pass-through tokens)
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  circuitBreaker,
  clampDur,
  energyRail,
  guardedDynamic,
  hexGate,
  txt,
} from '../parts.mjs';

export default function mcpExposure(s, c) {
  const pulse = s.value(0);
  const remoteOn = s.value(0);
  const outboundOn = s.value(0);
  const localOn = s.value(0);
  const cmdApproveOn = s.value(0);
  const tokenOn = s.value(0);
  const audienceOn = s.value(0);

  const header = cinemaHeader(
    'MCP TRUST BOUNDARIES',
    'Review what crosses remote',
    'and local server boundaries',
    { accent: ROLE.caution, size: 46 },
  );

  const stageAura = aura(120, 40, 620, '#fb923c1a', '#a78bfa1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const rm = remoteOn.value;
      const ob = outboundOn.value;
      const lc = localOn.value;
      const ca = cmdApproveOn.value;
      const tk = tokenOn.value;
      const au = audienceOn.value;
      const nodes = [];

      const lanes = [
        {
          y: -145,
          title: '1. REMOTE SERVER BOUNDARY',
          line1: 'Remote server sees every outbound argument · hostile replies can steer next call',
          line2:
            'Review outbound payloads · prefer trusted operators · enforce app policy on hosted MCP',
          gate: 'EGRESS',
          col: ROLE.caution,
          op: 0.45 + Math.max(rm, ob) * 0.55,
          glow: ob > 0.35,
          tripped: false,
        },
        {
          y: 45,
          title: '2. LOCAL STDIO LAUNCH AIRLOCK',
          line1: 'Show EXACT command & obtain user approval before one-click launch',
          line2: 'Sandbox filesystem, network & process privileges (distinct from tool choice)',
          gate: 'LAUNCH',
          col: ROLE.proposal,
          op: 0.35 + Math.max(lc, ca) * 0.65,
          glow: ca > 0.35,
          tripped: false,
        },
        {
          y: 235,
          title: '3. TOKEN AUDIENCE & SCOPE GATE',
          line1: 'Reject tokens not issued for THIS server (never pass broad client creds through)',
          line2:
            'Verify audience + minimize scopes · test protocol & security checks independently',
          gate: 'AUD',
          col: ROLE.denied,
          op: 0.35 + Math.max(tk, au) * 0.65,
          glow: au > 0.35,
          tripped: au > 0.35,
        },
      ];

      lanes.forEach((ln, i) => {
        nodes.push(
          energyRail(-855, ln.y - 46, ln.y + 52, ln.col, { opacity: ln.op }),
          txt(ln.title, -825, ln.y - 26, 28, ln.col, 'mono', 'left')
            .glow(ln.glow ? 7 : 0, ln.col)
            .opacity(ln.op),
          txt(ln.line1, -825, ln.y + 18, 26, COSMOS.ink, 'sans', 'left').opacity(ln.op),
          txt(ln.line2, -825, ln.y + 58, 26, COSMOS.muted, 'sans', 'left').opacity(ln.op),
          beamWithPhotons(
            [
              [440, ln.y + 6],
              [550, ln.y + 6],
            ],
            ln.col,
            p * 1.1 + i * 0.3,
            { alpha: ln.op, width: 3.4 },
          ),
          ln.tripped
            ? circuitBreaker(685, ln.y + 6, 110, 1, ROLE.ok, { opacity: ln.op })
            : hexGate(715, ln.y + 6, 60, ln.col, {
                label: ln.gate,
                opacity: ln.op,
                glow: ln.glow ? 12 : 5,
              }),
        );
      });

      nodes.push(
        line([-855, 345], [840, 345], { stroke: '#25355a', width: 2 }),
        txt(
          'A reviewed tool list never settles credential authority, data access, or execution safety',
          0,
          400,
          26,
          au > 0.35 ? ROLE.focus : COSMOS.muted,
          'serif',
          'center',
        ).glow(au > 0.35 ? 6 : 0, ROLE.focus),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('tu-mcp-exposure-1', () => {
    s.play(remoteOn.to(1, { duration: clampDur(c, c.cue('tu-mcp-exposure-1').start, 0.3) }));
  });
  c.on('tu-mcp-outbound', () => {
    s.play(outboundOn.to(1, { duration: clampDur(c, c.cue('tu-mcp-outbound').start, 0.35) }));
  });
  c.on('tu-mcp-exposure-2', () => {
    s.play(localOn.to(1, { duration: clampDur(c, c.cue('tu-mcp-exposure-2').start, 0.35) }));
  });
  c.on('tu-mcp-command-approval', () => {
    s.play(
      cmdApproveOn.to(1, { duration: clampDur(c, c.cue('tu-mcp-command-approval').start, 0.35) }),
    );
  });
  c.on('tu-mcp-exposure-3', () => {
    s.play(tokenOn.to(1, { duration: clampDur(c, c.cue('tu-mcp-exposure-3').start, 0.35) }));
  });
  c.on('tu-mcp-audience', () => {
    s.play(audienceOn.to(1, { duration: clampDur(c, c.cue('tu-mcp-audience').start, 0.35) }));
  });
}
