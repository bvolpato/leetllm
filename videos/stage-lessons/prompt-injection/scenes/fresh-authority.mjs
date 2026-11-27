// Scene 28: fresh-authority - One more release request
// Grand Finale Synthesis backed directly by `FRESH_REQUEST`, `FRESH_PREV_GRANT`,
// `FRESH_RUN1`, `FRESH_RUN2_ONCE`, and `FRESH_RUN2_REPLAY`:
//   Act 0 (Beats 0-2): C26 / R73 / staging / OP12 with cached untrusted note & trusted
//     grant OP11. Strict prediction pause until AFTER `pi-fresh-zero` (0 writes!), then
//     Run 2 swaps grant to OP12 -> appends 1 entry -> replay adds 0 (strictly gated on
//     `c.after('pi-fresh-replay')`).
//   Act 1 (Beat 3): Returns to Run 1 pairing the useful emerald summary ("C26 passed R73")
//     beside the inspectable cyan denial record for the policy owner.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  FRESH_EVALUATION,
  FRESH_PREV_GRANT,
  FRESH_REQUEST,
  FRESH_RUN1,
  FRESH_RUN2_ONCE,
  FRESH_RUN2_REPLAY,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  energyRail,
  fadeInHalf,
  fadeOutHalf,
  guardedDynamic,
  hexGate,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function freshAuthority(s, c) {
  const pulse = s.value(0);
  const noteHi = s.value(0);
  const grantHi = s.value(0);
  const questionHi = s.value(0);
  const zeroReveal = s.value(0);
  const run2Start = s.value(0);
  const matchGrant = s.value(0);
  const appendOne = s.value(0);
  const retrySent = s.value(0);
  const replayZero = s.value(0);
  const finaleMode = s.value(0); // 0 = live runs, 1 = closing diptych (Run 1 summary + denial)
  const summaryHi = s.value(0);
  const reviewHi = s.value(0);

  const header = cinemaHeader('FINALE SYNTHESIS · FRESH AUTHORITY', 'One more', 'release request', {
    accent: ROLE.ok,
    size: 50,
  });

  const stageAura = aura(150, 30, 640, '#6ee7b71e', '#5ce1e61a');

  // Act 0: Run 1 (OP11 mismatch -> 0) & Run 2 (OP12 match -> 1 -> replay -> 0)
  const act0 = guardedDynamic(
    () => fadeOutHalf(finaleMode.value),
    (a) => {
      const p = 0;
      const nh = noteHi.value;
      const gh = grantHi.value;
      const qh = questionHi.value;
      const zr = zeroReveal.value;
      const r2 = run2Start.value;
      const mg = matchGrant.value;
      const a1 = appendOne.value;
      const rt = retrySent.value;
      const rz = replayZero.value;
      const nodes = [];

      const isRun2 = r2 > 0.4;
      const curGrantOp = mg > 0.4 ? FRESH_REQUEST.operation : FRESH_PREV_GRANT.operation;
      const grantConsumed = a1 > 0.4;

      // Left: Request & Cached Untrusted Note (held fixed across both runs!)
      nodes.push(
        energyRail(-855, -205, 220, ROLE.host, { width: 6, opacity: a }),
        txt(
          isRun2 ? 'RUN 2 · SAME REQUEST (EMPTY LEDGER)' : 'RUN 1 · RELEASE REQUEST',
          -825,
          -182,
          26,
          ROLE.host,
          'mono',
          'left',
        ).opacity(a),
        txt(
          `user      : ${FRESH_REQUEST.user} (owner)`,
          -825,
          -124,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(a),
        txt(
          `candidate : ${FRESH_EVALUATION.candidate} · suite ${FRESH_EVALUATION.suite} (passed)`,
          -825,
          -72,
          26,
          ROLE.ok,
          'mono',
          'left',
        ).opacity(a),
        txt(
          `target    : ${FRESH_REQUEST.target} (allowed)`,
          -825,
          -20,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(a),
        txt(`operation : ${FRESH_REQUEST.operation}`, -825, 34, 30, ROLE.focus, 'mono', 'left')
          .glow(6, ROLE.focus)
          .opacity(a),
        rect(545, 92, { fill: '#171525', stroke: ROLE.untrusted, width: 2.4, radius: 8 })
          .at(-552, 148)
          .opacity(a),
        txt('CACHED REPORT NOTE (EXTERNAL)', -552, 126, 26, ROLE.untrusted, 'mono', 'center')
          .glow(nh > 0.3 ? 6 : 0, ROLE.untrusted)
          .opacity(a),
        txt(
          '“approved” · same untrusted authority',
          -552,
          172,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(a),
      );

      // Center: Trusted Grant Store Gate
      const gateX = 50;
      const gateY = 8;
      const gateCol =
        grantConsumed && rz > 0.4
          ? ROLE.denied
          : grantConsumed
            ? ROLE.ok
            : mg > 0.4
              ? ROLE.ok
              : zr > 0.4
                ? ROLE.denied
                : ROLE.approval;
      const gateLabel = grantConsumed ? 'CONSUMED' : `GRANT ${curGrantOp}`;

      nodes.push(
        hexGate(gateX, gateY, 76, gateCol, {
          label: gateLabel,
          sub: grantConsumed
            ? 'STORE NOW EMPTY'
            : mg > 0.4
              ? 'OP12 MATCHES OP12!'
              : 'user/C26/R73/staging match',
          opacity: a,
          glow: 10,
        }),
      );

      const inArc = quadArcPts([-265, 8], [gateX - 122, gateY], 0, 16);
      const outArc = quadArcPts([gateX + 122, gateY], [340, 8], 0, 16);
      nodes.push(
        beamWithPhotons(inArc, rt > 0.3 ? ROLE.focus : ROLE.host, p * 1.1, {
          width: 3.4,
          alpha: a * Math.max(0.5, gh),
        }),
        beamWithPhotons(outArc, a1 > 0.4 ? ROLE.ok : gateCol, p * 1.1 + 0.5, {
          width: 3.4,
          alpha: a * (a1 > 0.4 ? 1 : 0.4),
        }),
      );

      // Right: Local Write Ledger Counter (strict prediction withholding on Beat 0 AND replay!)
      const rx = 600;
      const preZero = fadeOutHalf(zr);
      const postZero = fadeInHalf(zr);

      const ledgerEntries = !isRun2
        ? FRESH_RUN1.entries.length
        : rz > 0.4
          ? FRESH_RUN2_REPLAY.entries.length
          : a1 > 0.4
            ? FRESH_RUN2_ONCE.entries.length
            : 0;
      const ledgerCol =
        !isRun2 && postZero < 0.3 ? ROLE.question : ledgerEntries === 1 ? ROLE.ok : ROLE.denied;

      nodes.push(
        rect(480, 290, { fill: '#0e1529', stroke: ledgerCol, width: 3, radius: 12 })
          .at(rx, 8)
          .glow(8, ledgerCol)
          .opacity(a),
        txt('LOCAL WRITE LEDGER', rx, -98, 26, COSMOS.muted, 'mono', 'center').opacity(a),
      );

      if (!isRun2) {
        if (preZero > 0.02) {
          nodes.push(
            txt('?', rx, -6, 74, ROLE.question, 'mono', 'center')
              .glow(10, ROLE.question)
              .opacity(a * preZero),
            txt('Writes added by OP12?', rx, 86, 26, ROLE.focus, 'serif', 'center').opacity(
              a * preZero,
            ),
          );
        }
        if (postZero > 0.02) {
          nodes.push(
            txt('0', rx, -10, 74, ROLE.denied, 'mono', 'center')
              .glow(12, ROLE.denied)
              .opacity(a * postZero),
            txt('OP11 ≠ OP12 · GRANT UNUSED', rx, 78, 26, ROLE.denied, 'mono', 'center').opacity(
              a * postZero,
            ),
          );
        }
      } else {
        nodes.push(
          txt(
            String(ledgerEntries),
            rx,
            -16,
            74,
            ledgerEntries === 1 ? ROLE.ok : ROLE.host,
            'mono',
            'center',
          )
            .glow(10, ledgerEntries === 1 ? ROLE.ok : ROLE.host)
            .opacity(a),
          txt(
            rz > 0.4
              ? `REPLAY ADDS ${FRESH_RUN2_REPLAY.added[1]} · TOTAL = ${FRESH_RUN2_REPLAY.entries.length}`
              : rt > 0.3
                ? 'REPLAY SENT -> CHECK STORE...'
                : a1 > 0.4
                  ? 'APPENDED 1 · GRANT CONSUMED'
                  : 'READY WITH MATCHING OP12',
            rx,
            78,
            26,
            rz > 0.4 ? ROLE.host : a1 > 0.4 ? ROLE.ok : ROLE.focus,
            'mono',
            'center',
          ).opacity(a),
        );
      }

      // Bottom band: Non-overlapping prediction question -> Run 1/Run 2 takeaway
      if (!isRun2 && preZero > 0.02) {
        nodes.push(
          txt(
            qh > 0.3
              ? 'Grant names OP11: how many writes can OP12 add?'
              : 'Inspect operation ID, cached note provenance, and trusted grant binding...',
            0,
            345,
            30,
            ROLE.question,
            'serif',
            'center',
          )
            .glow(qh > 0.3 ? 8 : 4, ROLE.question)
            .opacity(a * preZero),
        );
      }
      if ((!isRun2 && postZero > 0.02) || isRun2) {
        const bAlpha = isRun2 ? a : a * postZero;
        nodes.push(
          txt(
            rz > 0.4
              ? 'SINGLE ENTRY IS THE ENTIRE RELEASE HISTORY · REPLAY FINDS EMPTY LOOKUP'
              : isRun2
                ? 'RUN 2: MATCHING GRANT OP12 EXECUTES ONCE & CONSUMES ITSELF'
                : 'ZERO · GRANT BELONGS TO OP11 · CACHED NOTE KEEPS EXTERNAL AUTHORITY',
            0,
            345,
            28,
            rz > 0.4 || a1 > 0.4 ? ROLE.ok : ROLE.host,
            'mono',
            'center',
          )
            .glow(7, rz > 0.4 || a1 > 0.4 ? ROLE.ok : ROLE.host)
            .opacity(bAlpha),
        );
      }

      return group(...nodes);
    },
  );

  // Act 1: Closing Return-to-Run-1 Diptych (Useful Summary + Inspectable Denial Record)
  const act1 = guardedDynamic(
    () => fadeInHalf(finaleMode.value),
    (a) => {
      const sh = summaryHi.value;
      const rh = reviewHi.value;
      const nodes = [];

      nodes.push(
        txt(
          'RETURN TO RUN 1 (THE DENIED REQUEST)',
          0,
          -210,
          26,
          ROLE.source,
          'mono',
          'center',
        ).opacity(a),
      );

      // Left Panel: Useful Authorized Summary (Emerald)
      nodes.push(
        rect(780, 380, { fill: '#0d1924', stroke: ROLE.ok, width: 3, radius: 14 })
          .at(-430, 35)
          .glow(sh > 0.3 ? 12 : 6, ROLE.ok)
          .opacity(a),
        txt('USEFUL ANSWER (READ ALLOWED)', -430, -96, 26, ROLE.ok, 'mono', 'center').opacity(a),
        txt('“C26 passed evaluation R73.”', -430, -8, 36, COSMOS.ink, 'serif', 'center')
          .glow(6, ROLE.ok)
          .opacity(a),
        line([-750, 56], [-110, 56], { stroke: '#244542', width: 2 }).opacity(a),
        txt(
          'User can still read accessible evaluation',
          -430,
          108,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(a),
        txt(
          'Evidence informed the answer safely',
          -430,
          158,
          26,
          ROLE.ok,
          'mono',
          'center',
        ).opacity(a),
      );

      // Right Panel: Inspectable Denial Record (Cyan)
      nodes.push(
        rect(780, 380, { fill: '#0e1529', stroke: ROLE.host, width: 3, radius: 14 })
          .at(430, 35)
          .glow(rh > 0.3 ? 12 : 6, ROLE.host)
          .opacity(a),
        txt('INSPECTABLE OPERATION RECORD', 430, -96, 26, ROLE.host, 'mono', 'center').opacity(a),
        txt(
          'requested : OP12 (user-26 · C26 · staging)',
          430,
          -26,
          26,
          COSMOS.ink,
          'mono',
          'center',
        ).opacity(a),
        txt(
          'found     : grant OP11 (operation mismatch)',
          430,
          30,
          26,
          ROLE.denied,
          'mono',
          'center',
        ).opacity(a),
        txt('decision  : DENIED · 0 writes added', 430, 86, 28, ROLE.host, 'mono', 'center')
          .glow(6, ROLE.host)
          .opacity(a),
        txt(
          'Hand directly to policy owner if disputed',
          430,
          158,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(a),
      );

      nodes.push(
        txt(
          'KEEP INSTRUCTIONS AND EVIDENCE APART  ·  VERIFY EVERY PROTECTED EFFECT',
          0,
          345,
          28,
          ROLE.ok,
          'mono',
          'center',
        )
          .glow(8, ROLE.ok)
          .opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, act0, act1);

  c.on('fresh-input', () => {
    s.play(pulse.to(0.4, { duration: clampDur(c, c.cue('fresh-input').start, 0.25) }));
  });
  c.on('fresh-note', () => {
    s.play(noteHi.to(1, { duration: clampDur(c, c.cue('fresh-note').start, 0.35) }));
  });
  c.on('fresh-grant', () => {
    s.play(grantHi.to(1, { duration: clampDur(c, c.cue('fresh-grant').start, 0.35) }));
  });
  // Strict prediction boundary cue
  c.after('fresh-question', () => {
    s.play(questionHi.to(1, { duration: clampDur(c, c.cue('fresh-question').end, 0.25) }));
  });
  // Strict prediction withholding #1: reveal 0 writes ONLY AFTER `pi-fresh-zero`!
  c.after('pi-fresh-zero', () => {
    s.play(zeroReveal.to(1, { duration: clampDur(c, c.cue('pi-fresh-zero').end, 0.35) }));
  });
  c.on('fresh-compare', () => {
    s.play(run2Start.to(1, { duration: clampDur(c, c.cue('fresh-compare').start, 0.35) }));
  });
  c.on('pi-fresh-matching', () => {
    s.play(matchGrant.to(1, { duration: clampDur(c, c.cue('pi-fresh-matching').start, 0.35) }));
  });
  c.on('pi-fresh-one', () => {
    s.play(appendOne.to(1, { duration: clampDur(c, c.cue('pi-fresh-one').start, 0.35) }));
  });
  c.on('fresh-retry', () => {
    s.play(retrySent.to(1, { duration: clampDur(c, c.cue('fresh-retry').start, 0.35) }));
  });
  // Strict prediction withholding #2: reveal replay adds 0 ONLY AFTER `pi-fresh-replay`!
  c.after('pi-fresh-replay', () => {
    s.play(replayZero.to(1, { duration: clampDur(c, c.cue('pi-fresh-replay').end, 0.35) }));
  });
  c.on('fresh-return', () => {
    s.play(finaleMode.to(1, { duration: clampDur(c, c.cue('fresh-return').start, 0.45) }));
  });
  c.on('fresh-summary', () => {
    s.play(summaryHi.to(1, { duration: clampDur(c, c.cue('fresh-summary').start, 0.35) }));
  });
  c.on('fresh-review', () => {
    s.play(reviewHi.to(1, { duration: clampDur(c, c.cue('fresh-review').start, 0.35) }));
  });
}
