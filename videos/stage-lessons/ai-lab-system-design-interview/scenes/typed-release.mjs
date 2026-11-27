// Scene 24: typed-release - Who sets the passing score?
// Incoming metric tuples (observed, echoed_min) checked against host's own versioned policy (0.95),
// plus strict leak-count typing isolating None (blank) vs False (bool) vs 0 (int -> PASS!).
import { group, line } from 'vizmatic/stage';
import { COSMOS, ROLE, aura, cinemaHeader, clampDur, guardedDynamic, txt } from '../parts.mjs';

export default function typedRelease(s, c) {
  const editOn = s.value(0);
  const denyOn = s.value(0); // STRICT after packet-deny!
  const freshOn = s.value(0);
  const zeroPass = s.value(0); // STRICT after packet-zero!

  const header = cinemaHeader('TYPED RELEASE PACKET', 'Who sets the', 'passing score?', {
    x: -860,
    y: -445,
    accent: ROLE.policy,
    size: 48,
  });

  const bgAura = aura(40, 20, 680, '#a78bfa1a', '#6ee7b716');

  const view = guardedDynamic(
    () => 1,
    () => {
      const ed = editOn.value;
      const dn = denyOn.value;
      const fr = freshOn.value;
      const zp = zeroPass.value;
      const nodes = [];

      // Left panel: Metric Tuple & Host Policy Ruler
      const lx = -840;
      nodes.push(
        txt('1. METRIC TUPLE VERIFICATION', lx, -185, 26, ROLE.req, 'mono', 'left'),
        txt('Packet: (observed, echoed_min)', lx, -125, 26, COSMOS.ink, 'mono', 'left'),
        txt('  2-tuple · finite · [0, 1] · NOT bool', lx, -75, 26, COSMOS.muted, 'mono', 'left'),
        txt(
          ed > 0.4 ? 'Tampered packet: (0.93, 0.00)!' : 'Example: faithfulness = (0.93, 0.95)',
          lx,
          -5,
          26,
          ed > 0.4 ? ROLE.warn : ROLE.req,
          'mono',
          'left',
        ),
        txt('Host official policy: min = 0.95 (FIXED)', lx, 52, 26, ROLE.focus, 'mono', 'left'),
        txt(
          dn > 0.4
            ? 'VERDICT: HOLD (0.00 != 0.95 & 0.93 < 0.95)!'
            : 'Check echoed min vs host policy',
          lx,
          115,
          26,
          dn > 0.4 ? ROLE.fail : COSMOS.muted,
          'mono',
          'left',
        ).glow(dn > 0.4 ? 7 : 0, ROLE.fail),
      );

      // Right panel: Leak Count Type Isolation (None vs False vs int 0)
      const rx = 100;
      const fAlpha = 0.4 + fr * 0.6;
      nodes.push(
        line([45, -210], [45, 165], { stroke: '#2c3d66', width: 2.5 }),
        txt('2. STRICT LEAK-COUNT TYPING', rx, -185, 26, ROLE.ok, 'mono', 'left').opacity(fAlpha),
        txt('leaks = None   -> MISSING  -> HOLD', rx, -118, 26, ROLE.warn, 'mono', 'left').opacity(
          fAlpha,
        ),
        txt('leaks = False  -> BOOLEAN  -> REJECT', rx, -58, 26, ROLE.fail, 'mono', 'left').opacity(
          fAlpha,
        ),
        txt(
          zp > 0.4 ? 'leaks = 0 (int) -> MEASURED -> PASS!' : 'leaks = 0 (int) -> ?',
          rx,
          6,
          28,
          zp > 0.4 ? ROLE.ok : ROLE.focus,
          'mono',
          'left',
        )
          .glow(zp > 0.4 ? 8 : 0, ROLE.ok)
          .opacity(fAlpha),
        txt(
          'Zero leaks describes THIS sample only',
          rx,
          76,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(fAlpha),
      );

      nodes.push(
        txt('HOST OWNS POLICY', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt(
          'Loaded independently from versioned store',
          480,
          -378,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        line([-840, 225], [840, 225], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'Pin policy version, dataset version, sample sizes, critical slices & judge calibration before launch',
          0,
          298,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('packet-edit', () => {
    s.play(editOn.to(1, { duration: clampDur(c, c.cue('packet-edit').start, 0.35) }));
  });
  c.after('packet-deny', () => {
    s.play(denyOn.to(1, { duration: clampDur(c, c.cue('packet-deny').end, 0.35) }));
  });
  c.on('packet-fresh', () => {
    s.play(freshOn.to(1, { duration: clampDur(c, c.cue('packet-fresh').start, 0.35) }));
  });
  c.after('packet-zero', () => {
    s.play(zeroPass.to(1, { duration: clampDur(c, c.cue('packet-zero').end, 0.35) }));
  });
}
