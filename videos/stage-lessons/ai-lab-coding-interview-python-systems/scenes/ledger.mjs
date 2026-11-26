// Scene 16: ledger - "An idempotency key names one stored effect"
// Glowing append-only credit event chain (deposit-1 +100, withdraw-1 -30) + live balance gauge (70)
// + idempotency receipt vault returning original result 100 on replay and rejecting delta=+200 conflict!
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  LEDGER,
  ROLE,
  ambientClock,
  cinemaAtmosphere,
  glowArrow,
  glowCross,
  glowDot,
  glowPill,
  guardedDynamic,
  lowerFooter,
  playCue,
  sceneHeading,
  txt,
} from '../parts.mjs';

export default function ledger(s, c) {
  const title = sceneHeading(['An idempotency key names', 'one stored effect'], {
    accent: ROLE.ok,
  });

  const amb = ambientClock(s, c);
  // Step 0=empty, 1=deposit-1 (+100), 2=withdraw-1 (-30 -> 70), 3=focus balance 70,
  // 4=replay deposit-1 returns 100 (balance stays 70!), 5=preserved balance spotlight, 6=conflict (+200 rejected!)
  const step = s.value(0);

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const pulse = 0.5 + 0.5 * Math.sin(amb.value * Math.PI * 10);
      const st = Math.round(step.value);
      const hasDep = st >= 1;
      const hasWd = st >= 2;
      const isReplay = st >= 4;
      const isConflict = st >= 6;
      const bal = hasWd ? LEDGER[2].balance : hasDep ? LEDGER[1].balance : 0;
      const evCount = hasWd ? LEDGER[2].events.length : hasDep ? LEDGER[1].events.length : 0;

      const nodes = [
        // Left: Append-Only Event Log (x = -460)
        txt('APPEND-ONLY EVENT LOG', -460, -275, 26, ROLE.workerB, 'mono', 'center').opacity(alpha),
      ];

      if (!hasDep) {
        nodes.push(
          glowPill('events: [] (empty)', -460, -140, COSMOS.dim, {
            size: 27,
            fixedW: 660,
            alpha: 0.6 * alpha,
            glow: 0,
            textColor: COSMOS.muted,
          }),
        );
      } else {
        nodes.push(
          glowPill('1.  deposit-1   |   +100   ->   bal 100', -460, -155, ROLE.ok, {
            size: 27,
            fixedW: 720,
            alpha,
            glow: st === 1 ? 13 : 7,
          }),
        );
      }

      if (hasWd) {
        nodes.push(
          glowArrow(-460, -118, -460, -56, ROLE.focus, { width: 3.5, alpha }),
          glowPill('2.  withdraw-1  |    -30   ->   bal  70', -460, -18, ROLE.focus, {
            size: 27,
            fixedW: 720,
            alpha,
            glow: st === 2 ? 13 : 7,
          }),
        );
      }

      // Incoming replay / conflict probe below events
      if (isConflict) {
        nodes.push(
          glowPill('deposit-1  (delta = +200)  ->  CONFLICT!', -460, 145, ROLE.fail, {
            size: 27,
            fixedW: 720,
            alpha,
            glow: 14,
          }),
          glowCross(-845, 145, 28, ROLE.fail, alpha),
        );
      } else if (isReplay) {
        nodes.push(
          glowPill('replay deposit-1 (+100)  ->  returns 100', -460, 145, ROLE.record, {
            size: 27,
            fixedW: 720,
            alpha,
            glow: 12,
          }),
        );
      }

      // Center vertical hairline
      nodes.push(line([15, -265], [15, 240], { stroke: '#29375a', width: 2 }).opacity(alpha));

      // Right top: Live Account Balance & Event Count
      const rx = 445;
      nodes.push(
        txt('LIVE ACCOUNT STATE (org-a)', rx, -275, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
        glowPill(`Current Balance:  ${bal}`, rx, -160, ROLE.ok, {
          size: 32,
          fixedW: 540,
          alpha,
          glow: st === 3 || st === 5 ? 15 : 8,
        }),
        glowPill(`Stored Events:  ${evCount}`, rx, -55, ROLE.workerB, {
          size: 29,
          fixedW: 540,
          alpha,
          glow: st === 3 || st === 5 ? 12 : 6,
        }),

        // Right bottom: Cached Idempotency Receipt Vault
        txt('IDEMPOTENCY RECEIPT VAULT', rx, 65, 26, ROLE.record, 'mono', 'center').opacity(alpha),
        glowPill(
          hasDep ? 'deposit-1  ->  original result: 100' : 'deposit-1  ->  absent',
          rx,
          145,
          hasDep ? ROLE.record : COSMOS.dim,
          {
            size: 27,
            fixedW: 690,
            alpha: hasDep ? alpha : 0.55 * alpha,
            glow: isReplay ? 14 : 6,
          },
        ),
      );

      const capText = isConflict
        ? 'Reusing deposit-1 with +200 raises conflict: one idempotency key names one effect.'
        : isReplay
          ? 'Replay returns 100 while balance stays 70 and events stay 2.'
          : 'Each accepted mutation updates balance, appends one event, and caches its key receipt.';

      nodes.push(
        txt(
          capText,
          0,
          340,
          27,
          isConflict ? ROLE.fail : isReplay ? ROLE.record : COSMOS.ink,
          'sans',
          'center',
        ).opacity(alpha),
        glowDot(-855 + ((amb.value * 400) % 240), 422, {
          radius: 4.5 + 1.5 * pulse,
          color: isConflict ? ROLE.fail : ROLE.ok,
          glow: 8,
          opacity: 0.65 * alpha,
        }),
        lowerFooter(
          'IDEMPOTENCY KEY -> ONE STORED EFFECT',
          `BALANCE: ${bal}  ·  EVENTS: ${evCount}  ·  RECEIPT(deposit-1): ${hasDep ? 100 : '?'}`,
          { accent: isConflict ? ROLE.fail : ROLE.ok, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.ok, ROLE.record), title, layer);

  playCue(s, c, 'ledger-deposit', () => s.play(step.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'ledger-withdraw', () => s.play(step.to(2, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'ledger-beat-1-focus-1', () => s.play(step.to(3, { duration: 0.05 })), {
    dur: 0.1,
  });
  playCue(s, c, 'ledger-beat-2-focus-2', () => s.play(step.to(4, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'ledger-preserved-balance', () => s.play(step.to(5, { duration: 0.05 })), {
    dur: 0.1,
  });
  playCue(s, c, 'ledger-beat-2-focus-1', () => s.play(step.to(6, { duration: 0.05 })), {
    dur: 0.1,
  });
}
