// Scene 18: fresh-library - Which reservation can you verify?
// Grand Finale Transfer Synthesis in 2 non-overlapping modes:
//   Mode 0 (Beats 0-1): Lena's op-17 receipt (B7 · v3) vs stale/wrong-book read (B8 · v2).
//     Withholds repair decision during Beat 0 question; updates read query strictly after
//     `fresh-repair` and confirms 1 hold strictly after `fresh-outcome`.
//   Mode 1 (Beats 2-6): Mira's B9 account (v8 commit -> v9 read showing 2 duplicate rows),
//     strictly withholding FAIL verdict until `mira-verdict`, exposing retry key `op-42` on
//     `mira-trace`, replaying with `op-41` -> 1 hold strictly after `mira-replay`, filing as
//     regression, withholding `0 untouched trials` until `untouched-count`, and closing with
//     the full frozen-version holdout protocol.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  MIRA_DUP,
  MIRA_SAME,
  ROLE,
  aura,
  autoNode,
  cinemaHeader,
  clampDur,
  driftValue,
  fadeInHalf,
  fadeOutHalf,
  guardedDynamic,
  railBar,
  river,
  garden,
  segmentWithPhoton,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function freshLibrary(s, c) {
  const pulse = s.value(0);
  // Mode 0 (Lena, Beats 0-1)
  const lenaBad = s.value(0);
  const lenaFixed = s.value(0);
  const lenaPass = s.value(0);

  // Mode 1 (Mira, Beats 2-6)
  const miraMode = s.value(0);
  const mReceipt = s.value(0);
  const mRead = s.value(0);
  const mAsk = s.value(0);
  const mFail = s.value(0);
  const mTrace = s.value(0);
  const mReset = s.value(0);
  const mKey41 = s.value(0);
  const mReplay = s.value(0);
  const mRegFile = s.value(0);
  const mZeroUntouched = s.value(0);
  const mFreshTrials = s.value(0);
  const mPayoff = s.value(0);

  const header = cinemaHeader('FINAL SYNTHESIS', 'Which reservation', 'can you verify?', {
    accent: ROLE.pass,
    size: 50,
  });

  const stageAura = aura(0, 40, 680, '#6ee7b71a', '#5ce1e616');

  // Mode 0 (Beats 0-1): Lena's receipt vs wrong-book/stale read
  const mode0 = guardedDynamic(
    () => fadeOutHalf(miraMode.value),
    (a) => {
      const p = pulse.value;
      const lb = lenaBad.value;
      const lf = lenaFixed.value;
      const lp = lenaPass.value;
      const nodes = [];

      // Left rail: Intact write receipt op-17
      nodes.push(
        railBar(-840, -175, 240, ROLE.host, { width: 5, glow: 9, opacity: a }),
        txt('WRITE RECEIPT (INTACT)', -810, -155, 26, ROLE.host, 'mono', 'left').opacity(a),
        txt(`${river.reader} · ${river.title}`, -810, -90, 36, COSMOS.ink, 'serif', 'left').opacity(
          a,
        ),
        txt('op-17  ·  book B7  ·  version 3', -810, -24, 30, ROLE.trace, 'mono', 'left').opacity(
          a,
        ),
        line([-810, 26], [-230, 26], { stroke: '#29385f', width: 2 }).opacity(a),
        txt(
          'Chat still says: “Your book is reserved.”',
          -810,
          86,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
        txt(
          lf > 0.35 ? 'KEEP THIS RECEIPT' : 'Should we change the write or the read?',
          -810,
          156,
          26,
          lf > 0.35 ? ROLE.pass : ROLE.focus,
          'mono',
          'left',
        ).opacity(a),
      );

      // Center optical decision node
      const midCol = lp > 0.35 ? ROLE.pass : lf > 0.35 ? ROLE.trace : ROLE.focus;
      const midNode = autoNode(-15, 25, lp > 0.35 ? '1 HOLD' : lf > 0.35 ? 'FIX READ' : 'FIX?', {
        radius: 66,
        color: midCol,
        glow: 11,
        opacity: a,
      });
      const [mL0, mL1] = trimSeg([-215, 25], [-15, 25], 0, midNode.r);
      const [mR0, mR1] = trimSeg([-15, 25], [215, 25], midNode.r, 0);
      nodes.push(
        segmentWithPhoton(mL0, mL1, ROLE.host, p, { width: 3.2, alpha: a }),
        segmentWithPhoton(mR0, mR1, midCol, p + 0.4, { width: 3.2, alpha: a }),
        midNode.node,
      );

      // Right rail: Verifier read (B8 v2 -> repaired to Lena, B7, v >= 3)
      const rCol =
        lp > 0.35 ? ROLE.pass : lf > 0.35 ? ROLE.trace : lb > 0.3 ? ROLE.fail : ROLE.warn;
      nodes.push(
        railBar(230, -175, 240, rCol, { width: 5, glow: 10, opacity: a }),
        txt(
          lf > 0.35 ? 'REPAIRED INDEPENDENT READ' : 'VERIFIER READ RETURNED',
          260,
          -155,
          26,
          rCol,
          'mono',
          'left',
        ).opacity(a),
      );

      if (lf < 0.35) {
        const preA = Math.max(0, 1 - lf * 2.5);
        nodes.push(
          txt('Book: B8  (WRONG BOOK)', 260, -82, 32, ROLE.fail, 'mono', 'left')
            .glow(lb * 9, ROLE.fail)
            .opacity(a * preA),
          txt('Version: v2  (STALE < v3)', 260, -14, 32, ROLE.fail, 'mono', 'left')
            .glow(lb * 9, ROLE.fail)
            .opacity(a * preA),
          line([260, 36], [850, 36], { stroke: '#4d2638', width: 2 }).opacity(a * preA),
          txt('Does NOT verify op-17 on B7', 260, 102, 26, ROLE.warn, 'mono', 'left').opacity(
            a * preA,
          ),
        );
      } else {
        const postA = Math.min(1, (lf - 0.35) * 2.2);
        nodes.push(
          txt('Query: Lena · B7 · v >= 3', 260, -82, 30, ROLE.trace, 'mono', 'left')
            .glow(8, ROLE.trace)
            .opacity(a * postA),
          txt(
            'Returned: hold-17 (only match)',
            260,
            -14,
            30,
            lp > 0.35 ? ROLE.pass : COSMOS.ink,
            'mono',
            'left',
          )
            .glow(lp * 9, ROLE.pass)
            .opacity(a * postA),
          line([260, 36], [850, 36], { stroke: '#214c45', width: 2 }).opacity(a * postA),
          txt(
            lp > 0.35 ? 'VERIFIED: 1 INTENDED HOLD ON B7' : 'Checking returned match count...',
            260,
            102,
            28,
            lp > 0.35 ? ROLE.pass : ROLE.trace,
            'mono',
            'left',
          ).opacity(a * postA),
          txt(
            'Keep B8 & v2 reads as regression cases',
            260,
            166,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ).opacity(a * postA),
        );
      }

      nodes.push(
        txt(
          lp > 0.35
            ? 'KEEP THE WRITE RECEIPT · FIX THE INDEPENDENT READ QUERY TO B7 AT v >= 3'
            : lf > 0.35
              ? 'FIX THE VERIFIER READ FIRST · QUERY LENA ON B7 AT v >= 3'
              : 'Which should you change first: Lena’s write or the verifier’s read?',
          0,
          395,
          28,
          lp > 0.35 ? ROLE.pass : lf > 0.35 ? ROLE.trace : ROLE.focus,
          'mono',
          'center',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  // Mode 1 (Beats 2-6): Mira's duplicate B9 retry -> op-41 repair -> 0 untouched -> fresh holdout
  const mode1 = guardedDynamic(
    () => fadeInHalf(miraMode.value),
    (a) => {
      const p = pulse.value;
      const rc = mReceipt.value;
      const rd = mRead.value;
      const aq = mAsk.value;
      const fl = mFail.value;
      const tr = mTrace.value;
      const rs = mReset.value;
      const k41 = mKey41.value;
      const rp = mReplay.value;
      const rf = mRegFile.value;
      const zu = mZeroUntouched.value;
      const ft = mFreshTrials.value;
      const py = mPayoff.value;
      const nodes = [];

      // Left rail: Mira's Receipt & Runtime Trace (switches cleanly when reset/replayed!)
      const isReplayed = rp > 0.35;
      const isResetting = rs > 0.35 && !isReplayed;
      const leftCol = isReplayed ? ROLE.pass : tr > 0.35 ? ROLE.fail : ROLE.host;

      nodes.push(
        railBar(-840, -180, 250, leftCol, { width: 5, glow: 9, opacity: a }),
        txt('MIRA · RUNTIME TRACE', -810, -160, 26, leftCol, 'mono', 'left').opacity(a),
        txt(
          `${garden.reader} · ${garden.title} (${garden.book})`,
          -810,
          -96,
          34,
          COSMOS.ink,
          'serif',
          'left',
        ).opacity(a),
        txt(
          isReplayed
            ? 'op-41 committed at v8 (replay safe)'
            : rc > 0.3
              ? 'Permitted write op-41 -> commits v8'
              : 'Request: 1 hold on B9',
          -810,
          -34,
          28,
          ROLE.trace,
          'mono',
          'left',
        ).opacity(a),
        line([-810, 14], [-110, 14], { stroke: '#29385f', width: 2 }).opacity(a),
      );

      if (isReplayed) {
        nodes.push(
          txt('Retry reused key op-41 -> saved receipt!', -810, 74, 28, ROLE.pass, 'mono', 'left')
            .glow(8, ROLE.pass)
            .opacity(a),
          txt(
            rf > 0.3 ? 'Filed in regression suite' : 'Known duplicate case repaired',
            -810,
            138,
            26,
            ROLE.trace,
            'mono',
            'left',
          ).opacity(a),
        );
      } else if (isResetting) {
        nodes.push(
          txt(
            'Test account reset · repeating lost reply...',
            -810,
            74,
            28,
            ROLE.focus,
            'mono',
            'left',
          ).opacity(a),
          txt(
            k41 > 0.3 ? 'Retry keeps original key op-41' : 'Choosing retry key...',
            -810,
            138,
            28,
            k41 > 0.3 ? ROLE.trace : COSMOS.muted,
            'mono',
            'left',
          ).opacity(a),
        );
      } else if (tr > 0.3) {
        nodes.push(
          txt('CAUSE FOUND IN TRACE:', -810, 72, 26, ROLE.fail, 'mono', 'left').opacity(a),
          txt('Timeout -> retry used NEW key op-42!', -810, 130, 28, ROLE.fail, 'mono', 'left')
            .glow(9, ROLE.fail)
            .opacity(a),
        );
      } else {
        nodes.push(
          txt(
            'Lost reply occurred after v8 commit',
            -810,
            74,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ).opacity(a),
        );
      }

      // Untouched trials badge on lower-left (withheld during Beat 5 question!)
      if (rf > 0.25) {
        nodes.push(
          txt(
            zu > 0.35 ? 'UNTOUCHED TRIALS RUN: 0' : 'UNTOUCHED TRIALS RUN: ?',
            -810,
            214,
            30,
            zu > 0.35 ? ROLE.focus : COSMOS.muted,
            'mono',
            'left',
          )
            .glow(zu > 0.35 ? 10 : 0, ROLE.focus)
            .opacity(a * rf),
        );
      }

      // Right rail: Mira's Independent Read Snapshot (2 rows v9 -> reset -> 1 row v8)
      const accCol = isReplayed
        ? ROLE.pass
        : fl > 0.35
          ? ROLE.fail
          : rd > 0.3
            ? ROLE.trace
            : COSMOS.dim;
      const activeAcc = isReplayed ? MIRA_SAME.account : MIRA_DUP.account;

      nodes.push(
        railBar(80, -180, 250, accCol, { width: 5, glow: 10, opacity: a }),
        txt('INDEPENDENT READ SNAPSHOT', 110, -160, 26, accCol, 'mono', 'left').opacity(a),
        txt(garden.reader, 110, -96, 42, COSMOS.ink, 'serif', 'left').opacity(a),
        txt(
          rd > 0.3 ? `version ${activeAcc.version}` : 'pending read',
          850,
          -96,
          30,
          accCol,
          'mono',
          'right',
        ).opacity(a),
        line([110, -44], [850, -44], { stroke: '#29385f', width: 2 }).opacity(a),
      );

      if (rd > 0.25) {
        if (isReplayed) {
          nodes.push(
            txt('hold-41', 110, 24, 34, ROLE.pass, 'mono', 'left').glow(9, ROLE.pass).opacity(a),
            txt('op-41', 480, 24, 30, ROLE.trace, 'mono', 'center').opacity(a),
            txt('B9', 850, 24, 34, ROLE.pass, 'mono', 'right').opacity(a),
            line([110, 66], [850, 66], { stroke: '#214c45', width: 2 }).opacity(a),
            txt('1 HOLD FOUND -> REPAIR VERIFIED', 110, 134, 30, ROLE.pass, 'mono', 'left')
              .glow(10, ROLE.pass)
              .opacity(a),
          );
        } else {
          nodes.push(
            txt('hold-41', 110, 14, 32, COSMOS.ink, 'mono', 'left').opacity(a),
            txt(tr > 0.3 ? 'op-41' : 'Mira', 480, 14, 28, ROLE.trace, 'mono', 'center').opacity(a),
            txt('B9', 850, 14, 32, COSMOS.ink, 'mono', 'right').opacity(a),
            line([110, 50], [850, 50], { stroke: '#29385f', width: 2 }).opacity(a),
            txt('hold-42', 110, 98, 32, fl > 0.35 ? ROLE.fail : COSMOS.ink, 'mono', 'left')
              .glow(fl > 0.35 ? 10 : 0, ROLE.fail)
              .opacity(a),
            txt(
              tr > 0.3 ? 'op-42 !' : 'Mira',
              480,
              98,
              28,
              tr > 0.3 ? ROLE.fail : ROLE.trace,
              'mono',
              'center',
            ).opacity(a),
            txt('B9', 850, 98, 32, fl > 0.35 ? ROLE.fail : COSMOS.ink, 'mono', 'right').opacity(a),
            line([110, 134], [850, 134], { stroke: '#4d2638', width: 2 }).opacity(a),
            txt(
              fl > 0.35
                ? 'FAIL OUTCOME CHECK: 2 DUPLICATE B9 HOLDS'
                : aq > 0.3
                  ? '2 rows returned · does this verify 1 hold?'
                  : 'Fresh read at v9 (>= v8)',
              110,
              198,
              28,
              fl > 0.35 ? ROLE.fail : ROLE.focus,
              'mono',
              'left',
            )
              .glow(fl > 0.35 ? 9 : 0, ROLE.fail)
              .opacity(a),
          );
        }
      }

      // Final Holdout Release Protocol bar (Beats 6 `fresh-trials` & `fresh-payoff`)
      if (ft > 0.1) {
        const c1 = autoNode(-580, 340, 'FREEZE', {
          radius: 42,
          color: ROLE.host,
          glow: 8,
          opacity: a * ft,
        });
        const c2 = autoNode(-195, 340, 'UNTOUCHED', {
          radius: 48,
          color: ROLE.focus,
          glow: 9,
          opacity: a * ft,
        });
        const c3 = autoNode(210, 340, 'ALL FAILS', {
          radius: 46,
          color: ROLE.fail,
          glow: 8,
          opacity: a * ft,
        });
        const c4 = autoNode(615, 340, 'RATE + CI', {
          radius: 48,
          color: ROLE.pass,
          glow: 10,
          opacity: a * Math.max(ft, py),
        });
        const [f1a, f1b] = trimSeg([-580, 340], [-195, 340], c1.r, c2.r);
        const [f2a, f2b] = trimSeg([-195, 340], [210, 340], c2.r, c3.r);
        const [f3a, f3b] = trimSeg([210, 340], [615, 340], c3.r, c4.r);
        nodes.push(
          segmentWithPhoton(f1a, f1b, ROLE.focus, p, { width: 3, alpha: a * ft }),
          segmentWithPhoton(f2a, f2b, ROLE.fail, p + 0.33, { width: 3, alpha: a * ft }),
          segmentWithPhoton(f3a, f3b, ROLE.pass, p + 0.66, {
            width: 3,
            alpha: a * Math.max(ft, py),
          }),
          c1.node,
          c2.node,
          c3.node,
          c4.node,
        );
      } else {
        const foot =
          zu > 0.35
            ? '0 UNTOUCHED TRIALS'
            : rf > 0.3
              ? 'Mira’s case is now a regression test · how many untouched trials ran?'
              : isReplayed
                ? 'REPLAY WITH op-41 RETURNS SAVED RECEIPT -> 1 HOLD ON B9'
                : fl > 0.35
                  ? 'DUPLICATE HOLD CAUGHT BY FRESH v9 READ · TRACE REVEALS RETRY KEY op-42'
                  : 'Count the rows in Mira’s fresh v9 read: does it verify one B9 hold?';
        nodes.push(
          txt(
            foot,
            0,
            395,
            28,
            isReplayed ? ROLE.pass : fl > 0.35 ? ROLE.fail : ROLE.focus,
            'mono',
            'center',
          ).opacity(a),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, mode0, mode1);
  driftValue(s, c, pulse, 6.0, { startOffset: 0.1, endMargin: 0.5 });

  // Mode 0 (Lena)
  c.on('fresh-premises', () => {
    s.play(lenaBad.to(1, { duration: clampDur(c, c.cue('fresh-premises').start, 0.4) }));
  });
  c.after('fresh-repair', () => {
    s.play(lenaFixed.to(1, { duration: clampDur(c, c.cue('fresh-repair').end, 0.35) }));
  });
  c.after('fresh-outcome', () => {
    s.play(lenaPass.to(1, { duration: clampDur(c, c.cue('fresh-outcome').end, 0.3) }));
  });

  // Mode 1 (Mira, Beat 2 onward)
  c.onBeat(2, () => {
    s.play(miraMode.to(1, { duration: clampDur(c, c.beats[2].start, 0.6) }));
  });
  c.on('mira-receipt', () => {
    s.play(mReceipt.to(1, { duration: clampDur(c, c.cue('mira-receipt').start, 0.35) }));
  });
  c.on('mira-read', () => {
    s.play(mRead.to(1, { duration: clampDur(c, c.cue('mira-read').start, 0.4) }));
  });
  c.on('mira-question', () => {
    s.play(mAsk.to(1, { duration: clampDur(c, c.cue('mira-question').start, 0.35) }));
  });
  c.after('mira-verdict', () => {
    s.play(mFail.to(1, { duration: clampDur(c, c.cue('mira-verdict').end, 0.3) }));
  });
  c.on('mira-trace', () => {
    s.play(mTrace.to(1, { duration: clampDur(c, c.cue('mira-trace').start, 0.35) }));
  });
  c.on('mira-reset', () => {
    s.play(mReset.to(1, { duration: clampDur(c, c.cue('mira-reset').start, 0.35) }));
  });
  c.on('mira-retry-key', () => {
    s.play(mKey41.to(1, { duration: clampDur(c, c.cue('mira-retry-key').start, 0.35) }));
  });
  c.after('mira-replay', () => {
    s.play(mReplay.to(1, { duration: clampDur(c, c.cue('mira-replay').end, 0.35) }));
  });
  c.on('file-regression', () => {
    s.play(mRegFile.to(1, { duration: clampDur(c, c.cue('file-regression').start, 0.35) }));
  });
  c.after('untouched-count', () => {
    s.play(mZeroUntouched.to(1, { duration: clampDur(c, c.cue('untouched-count').end, 0.3) }));
  });
  c.on('fresh-trials', () => {
    s.play(mFreshTrials.to(1, { duration: clampDur(c, c.cue('fresh-trials').start, 0.4) }));
  });
  c.on('fresh-payoff', () => {
    s.play(mPayoff.to(1, { duration: clampDur(c, c.cue('fresh-payoff').start, 0.35) }));
  });
}
