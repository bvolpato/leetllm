// Scene 15: scorer-repair - What changes when you edit one record?
// Live perturbation console over the 6-request Benchmark Receipt Clock with glowing CLI exit-code
// beacon (Exit 1 malformed on missing r06 -> Exit 0 restored -> 4/6 on r05 edit -> Exit 2 lag on r04).
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  SERVING_COHORT,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  radialGauge,
  receiptClockNodes,
  servingReceipt,
  txt,
} from '../parts.mjs';

export default function scorerRepair(s, c) {
  const phase = s.value(0);
  const auditGlow = s.value(0);
  // State index: 0=baseline, 1=r06 deleted(exit1), 2=restored(exit0), 3=r05 quality=true(4/6),
  //              4=restored baseline, 5=r04 delayed to 800(exit2), 6=retries & raw log hashes
  const expState = s.value(0);

  const header = cinemaHeader('PERTURBATION AUDIT', 'Edit one record,', 'watch the exit code', {
    x: -860,
    y: -435,
    accent: ROLE.burst,
    size: 50,
  });

  const stageAura = aura(120, 20, 680, '#fb923c1a', '#5ce1e618');

  const stageView = guardedDynamic(
    () => 1,
    () => {
      const st = Math.round(expState.value);
      const isMissing = st === 1;
      const isQualFlip = st === 3;
      const isDelayed = st === 5;
      const isRetry = st >= 6;

      const rows = SERVING_COHORT.map((r) => ({ ...r, tokens: [...r.tokens] }));
      if (isQualFlip) rows[4].quality = true;
      if (isDelayed) rows[3].sent = 800;

      const shownRows = isMissing ? rows.filter((r) => r.id !== 'r06') : rows;
      const receipt = isMissing ? null : servingReceipt(rows);

      // Beacon state (concise strings so every rapid edit remains comfortably readable!)
      let exitCode = 'EXIT 0';
      let exitSub = '3 / 6';
      let exitCol = ROLE.qualified;
      let summary = '3/6 qualify · valid';
      let hiId = auditGlow.value > 0.2 && st === 0 ? 'r06' : null;

      if (isMissing) {
        exitCode = 'EXIT 1';
        exitSub = 'ABORT';
        exitCol = ROLE.fail;
        summary = 'r06 deleted -> 5 / 6 outcomes -> EXIT 1 (malformed)';
      } else if (isQualFlip) {
        exitCode = 'EXIT 0';
        exitSub = '4 / 6';
        exitCol = ROLE.focus;
        summary = 'r05 quality -> true: 4 / 6 qualify (same answers)';
        hiId = 'r05';
      } else if (isDelayed) {
        exitCode = 'EXIT 2';
        exitSub = 'LAG 40ms';
        exitCol = ROLE.fail;
        summary = 'r04 sent 800 ms -> TTFT 250, lag 40 ms (>20) -> EXIT 2';
        hiId = 'r04';
      } else if (isRetry) {
        exitCode = 'EXIT 0';
        exitSub = 'LOGGED';
        exitCol = ROLE.open;
        summary = 'Retries: separate attempt records + 1 logical outcome';
      } else if (receipt) {
        summary = `${receipt.qualified}/${receipt.offered} qualify · valid`;
      }

      const nodes = [
        // Top-right CLI exit code beacon
        radialGauge(700, -325, 96, isMissing ? 0.3 : isDelayed ? 0.65 : 1.0, exitCol, {
          width: 10,
          glow: 11,
        }),
        txt(exitCode, 700, -338, 34, exitCol, 'mono').glow(8, exitCol),
        txt(exitSub, 700, -290, 26, COSMOS.muted, 'mono'),

        // Benchmark Receipt Clock keeping fixed 6-slot geometry even when r06 is deleted!
        ...receiptClockNodes(shownRows, {
          xLeft: -680,
          xRight: 440,
          topY: -165,
          spacing: 64,
          windowEnd: 2000,
          horizon: 2500,
          until: 2500,
          showOutcomes: true,
          highlightId: hiId,
          slotCount: 6,
        }),
      ];

      // Ghost slot in row 6 cleanly above the fixed 6-slot bottom axis
      if (isMissing) {
        const r06Y = -165 + 5 * 64;
        nodes.push(
          txt('r06 MISSING FROM OUTCOMES FILE!', -120, r06Y, 30, ROLE.fail, 'mono').glow(
            7,
            ROLE.fail,
          ),
        );
      }

      // Live diagnostic footer
      nodes.push(
        txt(summary, 0, 342, 30, exitCol, 'mono').glow(6, exitCol),
        txt(
          isRetry
            ? 'Scorer rejects duplicate request IDs  ·  Keep original logs beside SHA hashes'
            : 'Exit 0 = valid accounting & schedule  ·  Exit 2 = lag/unsent  ·  Exit 1 = malformed',
          0,
          412,
          26,
          COSMOS.muted,
          'sans',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, stageView);
  driftValue(s, c, phase, 8, { startOffset: 0.1, endMargin: 0.5 });

  c.on('scorer-repair-beat-0', () => {
    const t = c.cue('scorer-repair-beat-0').start;
    s.play(auditGlow.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.after('scorer-delete', () => {
    const t = c.cue('scorer-delete').end;
    s.play(expState.to(1, { duration: clampDur(c, t, 0.2) }));
  });
  c.on('scorer-restore', () => {
    const t = c.cue('scorer-restore').start;
    s.play(expState.to(2, { duration: clampDur(c, t, 0.25) }));
  });
  c.on('scorer-quality-change', () => {
    const t = c.cue('scorer-quality-change').start;
    s.play(expState.to(3, { duration: clampDur(c, t, 0.3) }));
  });
  c.on('scorer-repair-beat-1', () => {
    const t = c.cue('scorer-repair-beat-1').start;
    s.play(expState.to(4, { duration: clampDur(c, t, 0.25) }));
  });
  c.on('scorer-delay', () => {
    const t = c.cue('scorer-delay').start;
    s.play(expState.to(5, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('scorer-repair-beat-2', () => {
    const t = c.cue('scorer-repair-beat-2').start;
    s.play(expState.to(6, { duration: clampDur(c, t, 0.35) }));
  });
}
