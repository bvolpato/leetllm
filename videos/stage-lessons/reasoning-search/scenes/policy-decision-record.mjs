// Scene 1: policy-decision-record - Merge requires three passing checks
// Side-by-side optical alignment of the trusted release service vs model proposal:
// tests, scan, and review connect across glowing comparison rails; prediction pause
// withholds highlighting the scan mismatch until record-locate, flips it to true on
// record-flip, then swaps to the partial 1/3 record on record-partial.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  cleanRelease,
  guardedDynamic,
  orbNode,
  orbRadius,
  reasoningRecordScore,
  scanFields,
  trimSeg,
  txt,
} from '../parts.mjs';

const MISTAKEN = {
  checks: { ...cleanRelease, security_scan_clear: false },
  final_action: 'merge_release',
};
const REPAIRED = {
  checks: cleanRelease,
  final_action: 'merge_release',
};
const PARTIAL = {
  checks: { tests_passed: true },
  final_action: 'manual_review',
};

export default function policyDecisionRecord(s, c) {
  const pulse = s.value(0);
  const located = s.value(0);
  const flipped = s.value(0);
  const matched = s.value(0);
  const partialOn = s.value(0);
  const gradePartial = s.value(0);

  const header = cinemaHeader('POLICY DECISION RECORD', 'Merge requires three', 'passing checks', {
    accent: ROLE.service,
    size: 48,
  });

  const stageAura = aura(120, 30, 680, '#60a5fa1c', '#a78bfa18');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const loc = located.value;
      const flp = flipped.value;
      const mch = matched.value;
      const prt = partialOn.value;
      const gpr = gradePartial.value;
      const nodes = [];

      const isPartial = prt > 0.5;
      const isFlipped = flp > 0.5 && !isPartial;
      const record = isPartial ? PARTIAL : isFlipped ? REPAIRED : MISTAKEN;
      const score = reasoningRecordScore(record, cleanRelease);

      // Left column: trusted release service; Right column: model proposal
      const leftX = -370;
      const rightX = 370;
      const labelX = -760;
      const rowYs = [-125, 25, 175];

      nodes.push(
        txt('RELEASE SERVICE', leftX, -245, 28, ROLE.service, 'mono', 'center'),
        txt('ACTION: MERGE', leftX, -205, 26, ROLE.ok, 'mono', 'center'),
        txt(
          isPartial ? 'SHORTER MODEL RECORD' : 'MODEL PROPOSAL',
          rightX,
          -245,
          28,
          ROLE.model,
          'mono',
          'center',
        ),
        txt(
          record.final_action === 'merge_release' ? 'ACTION: MERGE' : 'ACTION: MANUAL REVIEW',
          rightX,
          -205,
          26,
          record.final_action === 'merge_release' ? ROLE.ok : ROLE.caution,
          'mono',
          'center',
        ),
      );

      scanFields.forEach(([key, label], i) => {
        const y = rowYs[i];
        const svcVal = cleanRelease[key];
        const modVal = record.checks[key];
        const hasMod = typeof modVal === 'boolean';
        const isScan = key === 'security_scan_clear';
        const isMismatch = hasMod && svcVal !== modVal;

        // Withhold scan highlight before record-locate!
        const highlightMismatch = isScan && loc > 0.45 && !isFlipped && !isPartial;
        const highlightMatch = isScan && (isFlipped || mch > 0.45) && !isPartial;
        const highlightMissing = !hasMod && isPartial;

        const leftText = svcVal ? 'TRUE' : 'FALSE';
        const rightText = hasMod ? (modVal ? 'TRUE' : 'FALSE') : 'OMITTED';

        const leftCol = highlightMismatch ? ROLE.focus : ROLE.service;
        const rightCol = highlightMissing
          ? ROLE.fail
          : highlightMismatch
            ? ROLE.fail
            : highlightMatch
              ? ROLE.ok
              : hasMod && modVal
                ? ROLE.model
                : ROLE.model;

        const rL = orbRadius(leftText, 44);
        const rR = orbRadius(rightText, 44);
        const [aPt, bPt] = trimSeg([leftX, y], [rightX, y], rL + 10, rR + 10);

        const railCol = highlightMissing
          ? ROLE.fail
          : highlightMismatch
            ? ROLE.fail
            : highlightMatch
              ? ROLE.ok
              : '#3b4e7a';
        const railAlpha = highlightMismatch || highlightMatch || highlightMissing ? 0.95 : 0.45;

        nodes.push(
          txt(label.toUpperCase(), labelX, y, 26, COSMOS.ink, 'mono', 'left'),
          orbNode(leftX, y, leftText, leftCol, {
            radius: 44,
            glow: highlightMismatch ? 12 : 7,
          }),
          beamWithPhotons([aPt, bPt], railCol, p * 0.9 + i * 0.27, {
            width: highlightMismatch || highlightMatch || highlightMissing ? 4.0 : 2.6,
            glow: highlightMismatch || highlightMatch ? 10 : 5,
            photonCount: highlightMismatch || highlightMatch ? 2 : 1,
            alpha: railAlpha,
          }),
          orbNode(rightX, y, rightText, rightCol, {
            radius: 44,
            glow: highlightMismatch || highlightMatch || highlightMissing ? 12 : 7,
          }),
        );

        // Status readout on far right only once graded or revealed
        if (isScan && loc > 0.45 && !isPartial) {
          nodes.push(
            txt(
              isMismatch ? 'MISMATCH' : 'AGREE',
              rightX + rR + 34,
              y,
              26,
              isMismatch ? ROLE.fail : ROLE.ok,
              'mono',
              'left',
            ).glow(7, isMismatch ? ROLE.fail : ROLE.ok),
          );
        } else if (highlightMissing && gpr > 0.35) {
          nodes.push(
            txt('MISSING', rightX + rR + 34, y, 26, ROLE.fail, 'mono', 'left').opacity(gpr),
          );
        }
      });

      // Bottom rule and scorer readout (strictly withheld before record-locate!)
      nodes.push(line([-840, 278], [840, 278], { stroke: '#25355a', width: 2 }).opacity(0.65));

      const showScore = (!isPartial && loc > 0.45) || (isPartial && gpr > 0.35);
      if (showScore) {
        const fieldsVal = `${Math.round(score.coverage * 3)} / 3`;
        const valuesVal = score.valuesMatch ? 'MATCH' : 'MISMATCH';
        const actionVal = score.actionMatches ? 'MATCH' : 'MISMATCH';
        const cols = [
          [-520, 'FIELDS SUPPLIED', fieldsVal, score.coverage === 1],
          [0, 'CHECK VALUES', valuesVal, score.valuesMatch],
          [520, 'ACTION RULE', actionVal, score.actionMatches],
        ];
        for (const [cx, cap, val, ok] of cols) {
          const col = ok ? ROLE.ok : ROLE.fail;
          nodes.push(
            txt(cap, cx, 326, 26, COSMOS.muted, 'mono', 'center'),
            txt(val, cx, 384, 38, col, 'mono', 'center').glow(8, col),
          );
        }
      } else if (!isPartial) {
        nodes.push(
          txt(
            'Which check did the model copy wrong?',
            0,
            360,
            36,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      } else {
        nodes.push(
          txt(
            'Scoring shorter record against all three required fields...',
            0,
            360,
            30,
            ROLE.caution,
            'mono',
            'center',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('record-compare', () => {
    s.play(pulse.to(0.35, { duration: clampDur(c, c.cue('record-compare').start, 0.25) }));
  });
  c.after('record-locate', () => {
    s.play(located.to(1, { duration: clampDur(c, c.cue('record-locate').end, 0.35) }));
  });
  c.on('record-flip', () => {
    s.play(flipped.to(1, { duration: clampDur(c, c.cue('record-flip').start, 0.35) }));
  });
  c.on('record-matches', () => {
    s.play(matched.to(1, { duration: clampDur(c, c.cue('record-matches').start, 0.3) }));
  });
  c.on('record-partial', () => {
    s.play(partialOn.to(1, { duration: clampDur(c, c.cue('record-partial').start, 0.35) }));
  });
  c.on('record-grade-partial', () => {
    s.play(
      gradePartial.to(1, { duration: clampDur(c, c.cue('record-grade-partial').start, 0.35) }),
    );
  });
}
