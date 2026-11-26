// Scene 11: arithmetic-controller-contract - Which next state belongs in the search?
// Two non-overlapping stages:
//   1. Host replay conservation check: Host takes [6, 4, 5, 7], replays 6 * 4 = 24 -> [24, 5, 7].
//      Two proposals sit below: [24] vs [24, 5, 7]. Prediction pause asks which to admit;
//      contract-verdict reveals Admit [24, 5, 7] / Reject [24] (dropped 5 and 7).
//   2. Canonical deduplication key: Path A (4+5=9 then 6+7=13) and Path B (6+7=13 then 4+5=9)
//      converge onto ONE canonical search key [9, 13] -> expand once + oracle & budget note.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  combine,
  driftValue,
  fadeInHalf,
  fadeOutHalf,
  guardedDynamic,
  initialItems,
  numberValue,
  orbNode,
  orbRadius,
  quadArcPts,
  stateKey,
  trimSeg,
  txt,
  valueLabel,
} from '../parts.mjs';

const ORIG = [6, 4, 5, 7];
const PROD = combine(numberValue(6), numberValue(4), '×');
const HOST_NEXT = [{ value: PROD }, ...initialItems([5, 7])];
const PROPOSALS = [[24], [24, 5, 7]];
const SUM_45 = valueLabel(combine(numberValue(4), numberValue(5), '+'));
const SUM_67 = valueLabel(combine(numberValue(6), numberValue(7), '+'));

export default function arithmeticControllerContract(s, c) {
  const pulse = s.value(0);
  const replayOn = s.value(0);
  const verdictOn = s.value(0);
  const stage2 = s.value(0);
  const addTwoOn = s.value(0);
  const keyOn = s.value(0);
  const expandOnceOn = s.value(0);
  const oracleOn = s.value(0);

  const header = cinemaHeader('CONTROLLER CONTRACT', 'Which next state belongs', 'in the search?', {
    accent: ROLE.service,
    size: 46,
  });

  const stageAura = aura(100, 40, 680, '#60a5fa1a', '#ffd16616');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const rp = replayOn.value;
      const vd = verdictOn.value;
      const s2 = stage2.value;
      const a2 = addTwoOn.value;
      const ky = keyOn.value;
      const ex = expandOnceOn.value;
      const oc = oracleOn.value;

      const vis1 = fadeOutHalf(s2);
      const vis2 = fadeInHalf(s2);
      const nodes = [];

      // Stage 1: Host replay & proposal admission
      if (vis1 > 0.02) {
        const xs = [-270, -70, 150, 350];
        const topY = -195;
        const prodPos = [-170, -25];

        nodes.push(txt('HOST TRAY', -680, topY, 28, ROLE.service, 'mono', 'left').opacity(vis1));

        ORIG.forEach((n, i) => {
          const isPair = i < 2;
          if (isPair && rp > 0.1) {
            const [aPt, bPt] = trimSeg([xs[i], topY], prodPos, 42, 48);
            nodes.push(
              beamWithPhotons([aPt, bPt], ROLE.path, p * 1.1 + i * 0.3, {
                alpha: rp * vis1,
                width: 3.0,
                photonCount: 1,
              }),
            );
          }
          nodes.push(
            orbNode(xs[i], topY, String(n), isPair && rp > 0.2 ? ROLE.path : ROLE.service, {
              radius: 38,
              size: 30,
              opacity: vis1,
            }),
          );
        });

        if (rp > 0.15) {
          nodes.push(
            orbNode(prodPos[0], prodPos[1], '6*4 = 24', ROLE.path, {
              radius: 44,
              size: 26,
              opacity: rp * vis1,
            }),
            txt('Host computes [24, 5, 7]', 250, -25, 28, ROLE.path, 'mono', 'center').opacity(
              rp * vis1,
            ),
          );
        }

        nodes.push(
          line([-820, 58], [820, 58], { stroke: '#25355a', width: 2 }).opacity(0.65 * vis1),
        );

        PROPOSALS.forEach((vals, idx) => {
          const y = 135 + idx * 110;
          const legal = stateKey(initialItems(vals)) === stateKey(HOST_NEXT);
          const col = vd > 0.45 ? (legal ? ROLE.ok : ROLE.fail) : COSMOS.ink;
          nodes.push(
            txt(`PROPOSAL ${idx + 1}`, -680, y, 28, COSMOS.muted, 'mono', 'left').opacity(vis1),
            txt(`[ ${vals.join(',  ')} ]`, -120, y, 40, col, 'mono', 'center').opacity(vis1),
          );
          if (vd > 0.45) {
            nodes.push(
              txt(
                legal ? 'ADMIT (CONSERVES 5 & 7)' : 'REJECT (DROPPED 5 & 7)',
                310,
                y,
                28,
                legal ? ROLE.ok : ROLE.fail,
                'mono',
                'left',
              )
                .glow(7, legal ? ROLE.ok : ROLE.fail)
                .opacity(vd * vis1),
            );
          }
        });

        nodes.push(
          txt(
            vd > 0.45
              ? 'Exact fractions + operand conservation rule out dropped inputs & div-by-zero'
              : 'Which proposal should the host admit for scoring?',
            0,
            372,
            30,
            vd > 0.45 ? ROLE.ok : ROLE.focus,
            vd > 0.45 ? 'mono' : 'serif',
            'center',
          ).opacity(vis1),
        );
      }

      // Stage 2: Commutative deduplication onto one search key [9, 13]
      if (vis2 > 0.02) {
        const yA = -115;
        const yB = 115;
        const x1 = -520;
        const x2 = -70;
        const keyPos = [470, 0];

        const labelA1 = `4+5=${SUM_45}`;
        const labelA2 = `6+7=${SUM_67}`;
        const labelB1 = `6+7=${SUM_67}`;
        const labelB2 = `4+5=${SUM_45}`;

        const r1 = orbRadius(labelA1, 56);
        const r2 = orbRadius(labelA2, 56);
        const rK = orbRadius('[9, 13]', 68);

        nodes.push(
          txt('COMMUTATIVE PATH DEDUPLICATION', 0, -230, 28, ROLE.focus, 'mono', 'center').opacity(
            vis2,
          ),
          txt('PATH A', -770, yA, 28, ROLE.service, 'mono', 'left').opacity(vis2),
          orbNode(x1, yA, labelA1, ROLE.service, { radius: 56, opacity: vis2 }),
          beamWithPhotons(trimSeg([x1, yA], [x2, yA], r1 + 10, r2 + 10), ROLE.service, p * 1.1, {
            alpha: vis2,
            width: 3.4,
          }),
          orbNode(x2, yA, labelA2, ROLE.service, { radius: 56, opacity: vis2 }),
        );

        if (a2 > 0.05) {
          nodes.push(
            txt('PATH B', -770, yB, 28, ROLE.path, 'mono', 'left').opacity(a2 * vis2),
            orbNode(x1, yB, labelB1, ROLE.path, { radius: 56, opacity: a2 * vis2 }),
            beamWithPhotons(
              trimSeg([x1, yB], [x2, yB], r1 + 10, r2 + 10),
              ROLE.path,
              p * 1.1 + 0.4,
              { alpha: a2 * vis2, width: 3.4 },
            ),
            orbNode(x2, yB, labelB2, ROLE.path, { radius: 56, opacity: a2 * vis2 }),
          );
        }

        if (ky > 0.05) {
          nodes.push(
            beamWithPhotons(
              quadArcPts([x2 + r2 + 10, yA], [keyPos[0] - rK - 10, keyPos[1] - 18], -20),
              ROLE.service,
              p * 1.2,
              { alpha: ky * vis2, width: 3.6 },
            ),
            beamWithPhotons(
              quadArcPts([x2 + r2 + 10, yB], [keyPos[0] - rK - 10, keyPos[1] + 18], 20),
              ROLE.path,
              p * 1.2 + 0.5,
              { alpha: ky * vis2, width: 3.6 },
            ),
            orbNode(keyPos[0], keyPos[1], '[9, 13]', ROLE.focus, {
              radius: 68,
              size: 32,
              glow: 12,
              sub: ex > 0.35 ? 'EXPAND ONCE' : 'SAME SEARCH KEY',
              opacity: ky * vis2,
            }),
          );
        }

        nodes.push(
          line([-820, 265], [820, 265], { stroke: '#25355a', width: 2 }).opacity(0.65 * vis2),
          txt(
            oc > 0.35
              ? 'Exhaustive oracle verifies search; production also caps proposals, RAM & time'
              : ex > 0.35
                ? 'Keep one history per canonical key; starting tray counts toward state budget'
                : 'Reversed addition order yields the exact same remaining multiset',
            0,
            345,
            26,
            oc > 0.35 ? ROLE.ok : ROLE.focus,
            'mono',
            'center',
          ).opacity(vis2),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('contract-replay', () => {
    s.play(replayOn.to(1, { duration: clampDur(c, c.cue('contract-replay').start, 0.45) }));
  });
  // Strict prediction withholding!
  c.after('contract-verdict', () => {
    s.play(verdictOn.to(1, { duration: clampDur(c, c.cue('contract-verdict').end, 0.35) }));
  });
  c.on('contract-add-one', () => {
    s.play(stage2.to(1, { duration: clampDur(c, c.cue('contract-add-one').start, 0.55) }));
  });
  c.on('contract-add-two', () => {
    s.play(addTwoOn.to(1, { duration: clampDur(c, c.cue('contract-add-two').start, 0.4) }));
  });
  c.on('contract-key', () => {
    s.play(keyOn.to(1, { duration: clampDur(c, c.cue('contract-key').start, 0.4) }));
  });
  c.on('contract-expand-once', () => {
    s.play(
      expandOnceOn.to(1, { duration: clampDur(c, c.cue('contract-expand-once').start, 0.35) }),
    );
  });
  c.on('contract-oracle', () => {
    s.play(oracleOn.to(1, { duration: clampDur(c, c.cue('contract-oracle').start, 0.35) }));
  });
}
