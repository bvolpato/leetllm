// Scene 5: url-policy - "Which links share a fetch?"
// Luminous URL normalization funnel: two raw aliases converge to one canonical claim identity
// after lowercasing host and stripping fragments/default port, while ?q=2 forks a distinct key,
// paired with admission policy gates and separate network authorization checks.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowArcArrow,
  glowPill,
  guardedDynamic,
  hexAlpha,
  lowerFooter,
  playCue,
  sceneHeading,
  txt,
} from '../parts.mjs';

export default function urlPolicy(s, c) {
  const title = sceneHeading(['Which links share a fetch?'], { accent: ROLE.workerB });

  const originFocus = s.value(0);
  const hostLowered = s.value(0);
  const stripped = s.value(0);
  const queryFocus = s.value(0);
  const queryTwo = s.value(0);
  const policyFocus = s.value(0);
  const badPort = s.value(0);
  const foreignSkip = s.value(0);
  const netFocus = s.value(0);
  const netCheck = s.value(0);

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const lowHost = hostLowered.value > 0.5;
      const isStripped = stripped.value > 0.5;
      const hasQ2 = queryTwo.value > 0.5;
      const nodes = [];

      // Left hemisphere: Normalization Funnel (x = -850 .. 110)
      const lx = -380;
      nodes.push(
        txt(
          'START ORIGIN:  https://repo.example (port 443)',
          lx,
          -288,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
        // Two raw link aliases
        glowPill(
          'https://REPO.example:443/api?q=1#auth',
          lx,
          -185,
          isStripped ? COSMOS.dim : ROLE.workerB,
          {
            size: 26,
            fixedW: 850,
            alpha: isStripped ? 0.65 * alpha : alpha,
            glow: isStripped ? 0 : 8,
          },
        ),
        glowPill(
          'https://repo.example/api?q=1#usage',
          lx,
          -100,
          isStripped ? COSMOS.dim : ROLE.workerA,
          {
            size: 26,
            fixedW: 850,
            alpha: isStripped ? 0.65 * alpha : alpha,
            glow: isStripped ? 0 : 8,
          },
        ),
      );

      // Converging glowing arcs down into canonical claim identity #1
      if (isStripped) {
        nodes.push(
          glowArcArrow([lx - 260, -64], [lx - 210, 32], 14, {
            color: ROLE.ok,
            width: 3.4,
            alpha,
          }),
          glowArcArrow([lx + 260, -64], [lx + 210, 32], 14, {
            color: ROLE.ok,
            width: 3.4,
            alpha,
          }),
        );
      }

      // Claim identity 1 (shared)
      nodes.push(
        txt('CLAIM IDENTITIES', lx, -18, 26, ROLE.focus, 'mono', 'center').opacity(alpha),
        glowPill(
          isStripped ? 'https://repo.example/api?q=1' : 'normalizing...',
          lx,
          82,
          isStripped ? (queryFocus.value > 0.5 ? ROLE.focus : ROLE.ok) : COSMOS.dim,
          {
            size: 28,
            fixedW: 760,
            alpha: isStripped ? alpha : 0.55 * alpha,
            glow: queryFocus.value > 0.5 ? 14 : isStripped ? 10 : 0,
          },
        ),
      );

      // Claim identity 2 (?q=2 distinct)
      nodes.push(
        glowPill(
          hasQ2 ? 'https://repo.example/api?q=2   (distinct!)' : 'Change ?q=1 -> ?q=2 ?',
          lx,
          190,
          hasQ2 ? ROLE.workerB : COSMOS.dim,
          {
            size: 27,
            fixedW: 760,
            alpha: hasQ2 ? alpha : 0.6 * alpha,
            glow: hasQ2 ? 11 : 0,
          },
        ),
      );

      // Subtle vertical divider between funnel and right-hand policy ledger
      nodes.push(
        line([115, -280], [115, 275], { stroke: hexAlpha('#2b3b60', 0.7 * alpha), width: 2 }),
      );

      // Right hemisphere: Origin check + Admission & Network Safety Gates (x = 165 .. 855)
      const rxLabel = 170;
      const rxVal = 665;
      nodes.push(
        txt('ORIGIN & POLICY GATES', 505, -288, 26, ROLE.focus, 'mono', 'center').opacity(
          Math.max(0.75, originFocus.value) * alpha,
        ),
      );

      const gates = [
        {
          y: -195,
          name: 'host case',
          val: lowHost ? 'repo.example == match' : 'REPO.example vs repo',
          col: lowHost ? ROLE.ok : ROLE.focus,
          active: originFocus.value > 0.2,
        },
        {
          y: -102,
          name: 'bad port / auth',
          val: badPort.value > 0.5 ? 'REJECT' : 'pending',
          col: badPort.value > 0.5 ? ROLE.fail : COSMOS.dim,
          active: policyFocus.value > 0.2,
        },
        {
          y: -9,
          name: 'other origin',
          val: foreignSkip.value > 0.5 ? 'SKIP' : 'pending',
          col: foreignSkip.value > 0.5 ? ROLE.warn : COSMOS.dim,
          active: policyFocus.value > 0.2,
        },
        {
          y: 96,
          name: 'DNS & redirects',
          val: netCheck.value > 0.5 ? 'CHECK BEFORE FETCH' : 'separate layer',
          col: netCheck.value > 0.5 ? ROLE.record : COSMOS.dim,
          active: netFocus.value > 0.2,
        },
        {
          y: 190,
          name: 'request limits',
          val: netCheck.value > 0.5 ? 'TIMEOUT + MAX BYTES' : 'separate layer',
          col: netCheck.value > 0.5 ? ROLE.record : COSMOS.dim,
          active: netFocus.value > 0.2,
        },
      ];

      gates.forEach((g) => {
        nodes.push(
          txt(
            g.name,
            rxLabel,
            g.y,
            26,
            g.active ? COSMOS.ink : COSMOS.muted,
            'mono',
            'left',
          ).opacity(alpha),
          glowPill(g.val, rxVal, g.y, g.col, {
            size: 26,
            fixedW: 365,
            alpha: g.col === COSMOS.dim ? 0.6 * alpha : alpha,
            glow: g.col === COSMOS.dim ? 0 : 8,
          }),
        );
      });

      // Bottom takeaway
      const capY = 345;
      const capText =
        netCheck.value > 0.5
          ? 'URL normalization owns claim keys; destination checks guard the network fetch.'
          : foreignSkip.value > 0.5
            ? 'Reject credentials, control chars, backslashes, and bad ports; skip foreign origins.'
            : 'Drop #fragments and default ports; keep path percent-encoding and ?query.';
      nodes.push(
        txt(
          capText,
          0,
          capY,
          27,
          netCheck.value > 0.5 ? ROLE.record : COSMOS.ink,
          'sans',
          'center',
        ).opacity(alpha),
        lowerFooter(
          'SCHEME + LOWER(HOST) + PORT + PATH + QUERY',
          netCheck.value > 0.5
            ? 'SEPARATE PARSING FROM NETWORK AUTH'
            : 'KEEP QUERY  ·  DROP FRAGMENT',
          { accent: netCheck.value > 0.5 ? ROLE.record : ROLE.workerB, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.workerB, ROLE.record), title, layer);

  playCue(s, c, 'ci-url-policy-0-build', (d) => s.play(originFocus.to(1, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'url-origin', (d) => s.play(hostLowered.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'url-strip', (d) => s.play(stripped.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'url-query', (d) => s.play(queryFocus.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'url-changed-query', (d) => s.play(queryTwo.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'ci-url-policy-1-build', (d) => s.play(policyFocus.to(1, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'url-invalid', (d) => s.play(badPort.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'url-foreign', (d) => s.play(foreignSkip.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'ci-url-policy-2-build', (d) => s.play(netFocus.to(1, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'url-network', (d) => s.play(netCheck.to(1, { duration: d })), { dur: 0.4 });
}
