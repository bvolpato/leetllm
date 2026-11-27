// Scene 17: ledger-lifetime - "Preserve the original result through later balance changes"
// Stage 0: Rejected insufficient-credit debit leaves NO cached receipt (retry succeeds after funding)
//          while successful replay keeps original balance-after (100).
// Stage 1: Python dict key collision hazard (True == 1, hash(True) == hash(1)) prevented by strict str keys.
// Stage 2: Partial write crash gap (balance -> event -> receipt) vs single durable transaction + global key uniqueness.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  LEDGER,
  ROLE,
  cinemaAtmosphere,
  glowArcArrow,
  glowCross,
  glowPill,
  guardedDynamic,
  lowerFooter,
  playCue,
  sceneHeading,
  txt,
} from '../parts.mjs';

export default function ledgerLifetime(s, c) {
  const title = sceneHeading(['Preserve the original result', 'through later balance changes'], {
    accent: ROLE.record,
  });

  const stage = s.value(0); // 0=reject & replay, 1=True==1 dict collision, 2=3-write crash & atomic tx
  const s0Step = s.value(0); // 0=init, 1=reject absent, 2=retry after deposit, 3=replay 100
  const collided = s.value(0);
  const s2Step = s.value(0); // 0=replay start (bal 100), 1=bal drops to 70, 2=STOP gap!, 3=event written, 4=receipt saved, 5=global key

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const st = Math.round(stage.value);
      const nodes = [];

      if (st === 0) {
        const sub = Math.round(s0Step.value);
        nodes.push(
          txt(
            'CACHED SUCCESS VS UNCACHED REJECTION',
            0,
            -278,
            26,
            ROLE.workerB,
            'mono',
            'center',
          ).opacity(alpha),
          // Left: Rejected debit flow
          txt('INSUFFICIENT CREDIT REJECTION', -450, -185, 26, ROLE.fail, 'mono', 'center').opacity(
            alpha,
          ),
          glowPill(
            sub >= 1
              ? 'debit-9  ->  REJECTED (no cached receipt)'
              : 'debit-9  ->  testing balance...',
            -450,
            -90,
            sub >= 1 ? ROLE.fail : COSMOS.dim,
            { size: 26, fixedW: 720, alpha, glow: sub === 1 ? 12 : 5 },
          ),
          glowPill(
            sub >= 2 ? 'Later deposit -> same debit-9 CAN SUCCEED' : 'Waiting for funding...',
            -450,
            40,
            sub >= 2 ? ROLE.ok : COSMOS.dim,
            {
              size: 26,
              fixedW: 720,
              alpha: sub >= 2 ? alpha : 0.55 * alpha,
              glow: sub === 2 ? 12 : 0,
            },
          ),

          line([0, -210], [0, 190], { stroke: '#29375a', width: 2 }).opacity(alpha),

          // Right: Successful replay preserved through balance changes
          txt('SUCCESSFUL REPLAY', 450, -185, 26, ROLE.record, 'mono', 'center').opacity(alpha),
          glowPill('Live balance now:  70', 450, -90, ROLE.ok, { size: 28, fixedW: 540, alpha }),
          glowPill('replay deposit-1  ->  returns 100', 450, 40, ROLE.record, {
            size: 28,
            fixedW: 660,
            alpha,
            glow: sub >= 3 ? 14 : 7,
          }),

          txt(
            'Only committed operations cache a receipt; replays return their original balance-after.',
            0,
            325,
            27,
            COSMOS.ink,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else if (st === 1) {
        // Stage 1: Python dict collision True == 1
        const hit = collided.value > 0.5;
        nodes.push(
          txt(
            'PYTHON DICT KEY IDENTITY TRAP:  True == 1',
            0,
            -278,
            26,
            ROLE.fail,
            'mono',
            'center',
          ).opacity(alpha),
          glowPill('key = True  (bool)', -380, -140, ROLE.fail, {
            size: 29,
            fixedW: 410,
            alpha,
            glow: 9,
          }),
          glowPill('key = 1  (int)', 380, -140, ROLE.warn, {
            size: 29,
            fixedW: 410,
            alpha,
            glow: 9,
          }),
          glowArcArrow([-320, -96], [-95, 25], 25, {
            color: ROLE.fail,
            width: 3.6,
            alpha: hit ? alpha : 0.45 * alpha,
          }),
          glowArcArrow([320, -96], [95, 25], 25, {
            color: ROLE.warn,
            width: 3.6,
            alpha: hit ? alpha : 0.45 * alpha,
          }),
          glowPill(
            hit
              ? 'ONE DICT SLOT:  hash(True) == hash(1)  ->  COLLISION!'
              : 'dict slot:  results[key]',
            0,
            80,
            hit ? ROLE.fail : ROLE.record,
            { size: 28, fixedW: 960, alpha, glow: hit ? 14 : 7 },
          ),
          glowPill(
            'GUARD: require nonempty str keys & exact int (not bool) delta',
            0,
            215,
            ROLE.ok,
            {
              size: 26,
              fixedW: 1140,
              alpha,
              glow: 8,
            },
          ),
          txt(
            'Enforcing str-only keys and rejecting bool deltas blocks silent dictionary merging.',
            0,
            335,
            27,
            COSMOS.ink,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else {
        // Stage 2: 3-write crash gap -> single transaction -> global key uniqueness
        const s2 = Math.round(s2Step.value);
        const balVal = s2 >= 1 ? LEDGER[2].balance : LEDGER[1].balance;
        const gap = s2 === 2;
        const evDone = s2 >= 3;
        const recDone = s2 >= 4;
        const globalKey = s2 >= 5;

        nodes.push(
          txt(
            'THREE WRITES FOR withdraw-1 (-30): VOLATILE GAP VS ATOMIC TX',
            0,
            -278,
            26,
            gap ? ROLE.fail : ROLE.ok,
            'mono',
            'center',
          ).opacity(alpha),

          // Three sequential state boxes across canvas
          txt('1. BALANCE', -560, -165, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
          glowPill(`balance = ${balVal}`, -560, -80, s2 >= 1 ? ROLE.ok : ROLE.workerA, {
            size: 30,
            fixedW: 360,
            alpha,
            glow: s2 === 1 ? 13 : 7,
          }),

          txt('2. EVENT LOG', 0, -165, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
          glowPill(
            evDone ? 'withdraw-1 (-30) SAVED' : gap ? 'MISSING (STOPPED!)' : 'pending...',
            0,
            -80,
            evDone ? ROLE.ok : gap ? ROLE.fail : COSMOS.dim,
            { size: 27, fixedW: 420, alpha, glow: evDone || gap ? 12 : 0 },
          ),

          txt('3. RECEIPT', 560, -165, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
          glowPill(
            recDone ? 'withdraw-1 -> 70 SAVED' : gap ? 'MISSING (STOPPED!)' : 'pending...',
            560,
            -80,
            recDone ? ROLE.record : gap ? ROLE.fail : COSMOS.dim,
            { size: 27, fixedW: 420, alpha, glow: recDone || gap ? 12 : 0 },
          ),
        );

        if (gap) {
          nodes.push(
            glowCross(-285, -80, 34, ROLE.fail, alpha),
            glowPill(
              'CRASH BETWEEN WRITES: balance 70, event & receipt missing!',
              0,
              75,
              ROLE.fail,
              {
                size: 27,
                fixedW: 1080,
                alpha,
                glow: 13,
              },
            ),
          );
        } else if (globalKey) {
          nodes.push(
            glowPill('Commit debit + credit + receipt in ONE transaction', 0, 60, ROLE.ok, {
              size: 27,
              fixedW: 960,
              alpha,
              glow: 10,
            }),
            glowPill(
              'Enforce unique request key across ALL accounts + retention',
              0,
              175,
              ROLE.focus,
              {
                size: 27,
                fixedW: 1060,
                alpha,
                glow: 11,
              },
            ),
          );
        } else if (recDone) {
          nodes.push(
            glowPill('All 3 writes committed together -> consistent recovery', 0, 75, ROLE.ok, {
              size: 27,
              fixedW: 960,
              alpha,
              glow: 10,
            }),
          );
        }

        nodes.push(
          txt(
            globalKey
              ? 'Transfers A->B and C->D can collide on key; external payments need their own recovery rule.'
              : 'Never leave balance updated without its event and idempotency receipt.',
            0,
            335,
            27,
            COSMOS.ink,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      nodes.push(
        lowerFooter(
          'LEDGER LIFETIME  ·  TYPE SAFETY  ·  ATOMIC DURABILITY',
          st === 1
            ? 'True == 1 IN PYTHON DICTS -> REQUIRE str'
            : st === 2
              ? 'ONE TRANSACTION FOR DEBIT + CREDIT + RECEIPT'
              : 'REJECTIONS ARE NOT CACHED',
          { accent: st === 1 ? ROLE.fail : ROLE.record, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.record, ROLE.fail), title, layer);

  // Beat 0
  playCue(s, c, 'ci-ledger-lifetime-0-build', () => s.play(stage.to(0, { duration: 0.05 })), {
    dur: 0.1,
  });
  playCue(s, c, 'lifetime-reject', () => s.play(s0Step.to(1, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'lifetime-retry', () => s.play(s0Step.to(2, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'ci-ledger-lifetime-replay', () => s.play(s0Step.to(3, { duration: 0.05 })), {
    dur: 0.1,
  });

  // Beat 1
  playCue(
    s,
    c,
    'ci-ledger-lifetime-1-build',
    () => s.play(stage.to(1, { duration: 0.05 }), collided.to(0, { duration: 0.05 })),
    { dur: 0.1 },
  );
  playCue(s, c, 'lifetime-collision', () => s.play(collided.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });

  // Beat 2
  playCue(
    s,
    c,
    'ci-ledger-lifetime-2-build',
    () => s.play(stage.to(2, { duration: 0.05 }), s2Step.to(0, { duration: 0.05 })),
    { dur: 0.1 },
  );
  playCue(s, c, 'lifetime-balance', () => s.play(s2Step.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'lifetime-event', () => s.play(s2Step.to(2, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'lifetime-result', () => s.play(s2Step.to(3, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'lifetime-receipt', () => s.play(s2Step.to(4, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'lifetime-keys', () => s.play(s2Step.to(5, { duration: 0.05 })), { dur: 0.1 });
}
