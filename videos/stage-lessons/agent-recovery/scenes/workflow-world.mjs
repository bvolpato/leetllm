// Scene 10: workflow-world - "A crash between two writes"
// Three dynamic stages with 2 strict prediction holds:
// (1) Two-disk crash between controller commit and local receipt save (withholds "None" until 'no-receipt'),
// (2) LangGraph Sync vs Async vs Exit checkpoint durability at the red crash line,
// (3) Temporal deterministic replay of two event histories (withholds upper completion until 'history-read').
import { line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  OP,
  ROLE,
  actorOrb,
  ambientClock,
  cinemaAtmosphere,
  glowArrow,
  glowCross,
  glowDot,
  glowPill,
  guardedDynamic,
  heroTitle,
  hexAlpha,
  lowerFooter,
  playCue,
  txt,
} from '../parts.mjs';

export default function workflowWorld(s, c) {
  const title = heroTitle(['A crash between two writes'], {
    x: -855,
    y: -440,
    size: 52,
    accent: ROLE.violet,
  });

  const amb = ambientClock(s, c);
  const stage = s.value(0); // 0 = two disks, 1 = LangGraph schedules, 2 = Temporal histories
  const diskKey = s.value(0);
  const diskSent = s.value(0);
  const diskCommit = s.value(0);
  const diskCrash = s.value(0);
  const askJournal = s.value(0);
  const revealEmpty = s.value(0); // STRICTLY AFTER 'no-receipt'!
  const showReplayOk = s.value(0);
  const showSavedReceipt = s.value(0);

  const lgSync = s.value(0);
  const lgAsync = s.value(0);
  const lgExit = s.value(0);
  const lgDurable = s.value(0);

  const askHistory = s.value(0);
  const revealHistory = s.value(0); // STRICTLY AFTER 'history-read'!
  const showRerun = s.value(0);

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const pulse = 0.5 + 0.5 * Math.sin(amb.value * Math.PI * 10);
      const st = Math.round(stage.value);
      const nodes = [];

      if (st === 0) {
        // Stage 1: Two separate disks (Workflow Disk left, Controller Disk right)
        const lx = -585;
        const rx = 585;
        nodes.push(
          actorOrb(lx, -175, 68, ROLE.violet, 'Workflow', 'Local Disk A', { alpha, active: true }),
          actorOrb(rx, -175, 68, ROLE.controller, 'Controller', 'Remote Disk B', {
            alpha,
            active: diskCommit.value > 0.3,
          }),
          glowArrow(lx + 115, -195, rx - 115, -195, ROLE.agent, { width: 3.5, alpha }),
          glowArrow(rx - 115, -150, lx + 115, -150, ROLE.sure, {
            width: 3.5,
            alpha,
            dash: [8, 6],
          }),
        );

        // Workflow journal slots below Disk A
        nodes.push(
          glowPill(
            diskKey.value > 0.3 ? `key: ${OP.key} (durable)` : 'journal: saving key...',
            lx,
            68,
            ROLE.op,
            { size: 26, alpha },
          ),
        );

        // Receipt slot (strictly withholds "None" until revealEmpty > 0.5!)
        const recText =
          showSavedReceipt.value > 0.5
            ? `receipt: ${OP.job} SAVED`
            : revealEmpty.value > 0.5
              ? 'receipt: None (empty)'
              : askJournal.value > 0.5
                ? 'receipt: ?'
                : 'receipt: pending';
        const recCol =
          showSavedReceipt.value > 0.5
            ? ROLE.sure
            : revealEmpty.value > 0.5
              ? ROLE.fail
              : ROLE.mark;
        nodes.push(glowPill(recText, lx, 165, recCol, { size: 26, alpha }));

        // Controller durable slot below Disk B
        nodes.push(
          glowPill(
            diskCommit.value > 0.3 ? `${OP.job} COMMITTED` : 'queue: empty',
            rx,
            68,
            diskCommit.value > 0.3 ? ROLE.sure : COSMOS.muted,
            { size: 26, alpha },
          ),
          txt(
            showReplayOk.value > 0.5 ? 'unchanged in place' : 'separate disk',
            rx,
            165,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ).opacity(alpha),
        );

        // Center crash marker or replay arc
        if (showReplayOk.value > 0.5) {
          nodes.push(
            glowPill(`replay ${OP.key} -> ${OP.job}`, 0, -25, ROLE.sure, {
              size: 27,
              alpha: showReplayOk.value * alpha,
            }),
          );
        } else if (diskCrash.value > 0.4) {
          nodes.push(
            glowCross(-180, -150, 38, ROLE.fail, diskCrash.value * alpha),
            txt('PROCESS CRASH', -180, -82, 26, ROLE.fail, 'mono', 'center').opacity(
              diskCrash.value * alpha,
            ),
          );
        } else if (diskSent.value > 0.2) {
          const px = lx + 115 + (rx - 115 - (lx + 115)) * ((amb.value * 3) % 1);
          nodes.push(glowDot(px, -195, { radius: 9, color: ROLE.agent, glow: 12, opacity: alpha }));
        }

        // Bottom question / answer caption
        const capY = 305;
        if (showSavedReceipt.value > 0.5) {
          nodes.push(
            txt(
              'Replay returns existing job-1; save receipt locally without duplicating work.',
              0,
              capY,
              27,
              ROLE.sure,
              'sans',
              'center',
            ).opacity(alpha),
          );
        } else if (revealEmpty.value > 0.5) {
          nodes.push(
            glowPill('Journal job ID: None · Saved key guides reconciliation', 0, capY, ROLE.fail, {
              size: 27,
              alpha: revealEmpty.value * alpha,
            }),
          );
        } else if (askJournal.value > 0.5) {
          nodes.push(
            txt(
              'After restart, which job ID can the workflow read from its own journal?',
              0,
              capY,
              30,
              ROLE.mark,
              'serif',
              'center',
            )
              .glow(7, ROLE.mark)
              .opacity(askJournal.value * alpha * (0.8 + 0.2 * pulse)),
          );
        } else {
          nodes.push(
            txt(
              'Persist the operation key on Disk A before dispatching across the network.',
              0,
              capY,
              27,
              COSMOS.muted,
              'sans',
              'center',
            ).opacity(alpha),
          );
        }
      } else if (st === 1) {
        // Stage 2: LangGraph persistence modes (Sync vs Async vs Exit) against the red crash line
        const crashX = 215;
        const rows = [
          {
            y: -150,
            name: 'SYNC',
            col: ROLE.sure,
            saveEnd: 140,
            dispatchX: 350,
            note: 'Key durable BEFORE dispatch',
            show: Math.max(0.5, lgSync.value),
          },
          {
            y: 15,
            name: 'ASYNC',
            col: ROLE.mark,
            saveEnd: -80,
            dispatchX: 70,
            note: 'Dispatches while save in flight',
            show: Math.max(0.35, lgAsync.value),
          },
          {
            y: 180,
            name: 'EXIT',
            col: ROLE.fail,
            saveEnd: -340,
            dispatchX: 70,
            note: 'Skips mid checkpoints -> no key',
            show: Math.max(0.35, lgExit.value),
          },
        ];

        nodes.push(
          txt(
            'LANGGRAPH SUPER-STEP PERSISTENCE AT CRASH LINE',
            0,
            -292,
            27,
            ROLE.agent,
            'mono',
            'center',
          ).opacity(alpha),
          line([crashX, -215], [crashX, 255], {
            stroke: ROLE.fail,
            width: 4.5,
            dash: [10, 7],
          }).glow(10, ROLE.fail),
          txt('CRASH', crashX, -245, 26, ROLE.fail, 'mono', 'center').opacity(alpha),
        );

        for (const r of rows) {
          const ra = r.show * alpha;
          nodes.push(txt(r.name, -745, r.y, 30, r.col, 'mono', 'left').opacity(ra));
          // Save bar
          if (r.saveEnd > -300) {
            const w = r.saveEnd - -520;
            nodes.push(
              rect(w, 42, {
                radius: 8,
                fill: hexAlpha(r.col, 0.28 * ra),
                stroke: r.col,
                width: 2.6,
              }).at(-520 + w / 2, r.y),
              txt('save key', -520 + w / 2, r.y, 26, COSMOS.ink, 'mono', 'center').opacity(ra),
            );
          } else {
            nodes.push(
              txt('(no mid save)', -380, r.y, 26, ROLE.fail, 'mono', 'center').opacity(ra),
            );
          }
          // Dispatch pill cleanly clear of crashX = 215
          nodes.push(
            glowPill('dispatch', r.dispatchX, r.y, r.col, { size: 26, alpha: ra }),
            txt(r.note, 845, r.y, 26, r.col, 'sans', 'right').opacity(ra),
          );
        }

        nodes.push(
          txt(
            lgDurable.value > 0.5
              ? 'Synchronous persistence confirms the key is on disk before dispatch runs.'
              : 'Pending writes can also preserve sibling node results within a super-step.',
            0,
            325,
            27,
            ROLE.sure,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else {
        // Stage 3: Temporal deterministic replay of two event histories (strict withholding!)
        const topY = -115;
        const botY = 125;
        nodes.push(
          txt(
            'TEMPORAL EVENT HISTORIES FOR THE SAME JOB',
            0,
            -285,
            27,
            ROLE.violet,
            'mono',
            'center',
          ).opacity(alpha),
        );

        // Upper history: Scheduled -> Started -> Completed(job-1)
        const upCol = revealHistory.value > 0.5 ? ROLE.sure : ROLE.agent;
        nodes.push(
          txt('HISTORY A', -770, topY, 28, upCol, 'mono', 'left').opacity(alpha),
          glowPill('Scheduled', -430, topY, upCol, { size: 26, alpha }),
          glowArrow(-310, topY, -180, topY, upCol, { width: 3, alpha }),
          glowPill('Started', -60, topY, upCol, { size: 26, alpha }),
          glowArrow(55, topY, 185, topY, upCol, { width: 3, alpha }),
          glowPill(`Completed (${OP.job})`, 415, topY, upCol, { size: 26, alpha }),
        );
        if (revealHistory.value > 0.5) {
          nodes.push(
            txt(
              'Read job-1 directly from history',
              415,
              topY - 62,
              26,
              ROLE.sure,
              'mono',
              'center',
            ).opacity(revealHistory.value * alpha),
          );
        }

        // Lower history: Scheduled -> Started -> (missing completion!)
        const lowCol = showRerun.value > 0.5 ? ROLE.mark : ROLE.violet;
        nodes.push(
          txt('HISTORY B', -770, botY, 28, lowCol, 'mono', 'left').opacity(alpha),
          glowPill('Scheduled', -430, botY, lowCol, { size: 26, alpha }),
          glowArrow(-310, botY, -180, botY, lowCol, { width: 3, alpha }),
          glowPill('Started', -60, botY, lowCol, { size: 26, alpha }),
          glowArrow(55, botY, 185, botY, ROLE.fail, { width: 3, alpha, dash: [7, 6] }),
          glowPill(
            showRerun.value > 0.5 ? `Re-run w/ ${OP.key} -> ${OP.job}` : 'completion missing',
            415,
            botY,
            showRerun.value > 0.5 ? ROLE.sure : ROLE.fail,
            { size: 26, alpha },
          ),
        );

        const capY = 310;
        if (showRerun.value > 0.5) {
          nodes.push(
            txt(
              'Two attempts lead back to one job because the destination recognizes the saved key.',
              0,
              capY,
              27,
              ROLE.sure,
              'sans',
              'center',
            ).opacity(alpha),
          );
        } else if (revealHistory.value > 0.5) {
          nodes.push(
            glowPill(
              'History A recovers from event log · History B re-runs Activity',
              0,
              capY,
              ROLE.sure,
              {
                size: 27,
                alpha: revealHistory.value * alpha,
              },
            ),
          );
        } else if (askHistory.value > 0.5) {
          nodes.push(
            txt(
              'Which workflow can recover its result entirely from history?',
              0,
              capY,
              32,
              ROLE.mark,
              'serif',
              'center',
            )
              .glow(7, ROLE.mark)
              .opacity(askHistory.value * alpha * (0.8 + 0.2 * pulse)),
          );
        }
      }

      nodes.push(
        lowerFooter(
          'TWO DISKS · SYNC CHECKPOINT · DETERMINISTIC HISTORY',
          st === 0
            ? 'DURABLE KEY BEFORE DISPATCH'
            : st === 1
              ? 'SYNC BEATS ASYNC/EXIT'
              : 'IDEMPOTENT ACTIVITY REPLAY',
          { accent: ROLE.violet, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.violet, ROLE.controller), title, layer);

  playCue(s, c, 'save-key', (d) => s.play(diskKey.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'dispatch', (d) => s.play(diskSent.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'commit', (d) => s.play(diskCommit.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'crash', (d) => s.play(diskCrash.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'own-journal', (d) => s.play(askJournal.to(1, { duration: d })), { dur: 0.45 });
  // Strict prediction withholding #1: reveal None ONLY AFTER 'no-receipt'!
  playCue(s, c, 'no-receipt', (d) => s.play(revealEmpty.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'key-survived', (d) => s.play(diskKey.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'permission', (d) => s.play(showReplayOk.to(0.45, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'same-dispatch', (d) => s.play(showReplayOk.to(0.8, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'same-job', (d) => s.play(showReplayOk.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'save-receipt', (d) => s.play(showSavedReceipt.to(1, { duration: d })), {
    dur: 0.45,
  });

  playCue(
    s,
    c,
    'graph',
    (d) => s.play(stage.to(1, { duration: 0.15 }), lgSync.to(0.5, { duration: d })),
    {
      dur: 0.4,
    },
  );
  playCue(s, c, 'sync-save', (d) => s.play(lgSync.to(0.8, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'sync-send', (d) => s.play(lgSync.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'async-save', (d) => s.play(lgAsync.to(0.6, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'async-send', (d) => s.play(lgAsync.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'exit-send', (d) => s.play(lgExit.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'durable-first', (d) => s.play(lgDurable.to(1, { duration: d })), { dur: 0.45 });

  playCue(s, c, 'temporal', (d) => s.play(stage.to(2, { duration: 0.15 })), { dur: 0.3 });
  playCue(s, c, 'which-history', (d) => s.play(askHistory.to(1, { duration: d })), { dur: 0.45 });
  // Strict prediction withholding #2: reveal History A ONLY AFTER 'history-read'!
  playCue(s, c, 'history-read', (d) => s.play(revealHistory.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'missing-result', (d) => s.play(showRerun.to(0.45, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'rerun', (d) => s.play(showRerun.to(0.75, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'original-job', (d) => s.play(showRerun.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'one-job', (d) => s.play(showRerun.to(1, { duration: d })), { dur: 0.35 });
}
