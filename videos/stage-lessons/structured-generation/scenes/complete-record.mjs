// Scene 8: complete-record - Will this call return a record?
// 4-slot glowing token pipeline comparing decode(max_steps=3) vs decode(max_steps=4).
// STRICT prediction withholding during Beat 0 hold (3.0s): text looks complete after 3 draws,
// yet the budget error is withheld until c.after('stop-budget')!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  DECODER_STEPS_3,
  DECODER_STEPS_4,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  decode,
  driftValue,
  fsmNode,
  guardedDynamic,
  quadArcPts,
  tokenChip,
  txt,
} from '../parts.mjs';

const RESULT_4 = decode(DECODER_STEPS_4);

export default function completeRecord(s, c) {
  const pulse = s.value(0);
  const threeProg = s.value(0);
  const budgetErr = s.value(0);
  const extraSlot = s.value(0);
  const eosDone = s.value(0);

  const header = cinemaHeader(
    'COMPLETION & END-OF-SEQUENCE',
    'Will this call return',
    'a complete record?',
    { accent: ROLE.prefix, size: 50 },
  );

  const stageAura = aura(200, 40, 640, '#5ce1e61d', '#ff6b8b16');

  const stageView = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const tp = threeProg.value;
      const be = budgetErr.value;
      const ex = extraSlot.value;
      const eo = eosDone.value;
      const nodes = [];

      const count3 = Math.max(1, Math.min(3, Math.ceil(tp * 3)));
      const emitted = DECODER_STEPS_3.slice(0, tp > 0.05 ? count3 : 1).join('');

      nodes.push(txt('DECODER TOKEN SLOTS', -840, -225, 26, COSMOS.muted, 'mono', 'left'));

      // Four glowing token slots across the horizontal conduit
      const xs = [-630, -255, 65, 455];
      const ws = [365, 195, 290, 290];
      const slotY = -120;

      for (let i = 0; i < 4; i++) {
        if (i === 3 && ex < 0.05) {
          // Dim locked 4th slot silhouette showing budget limit = 3
          nodes.push(
            tokenChip('LOCKED', xs[3], slotY, {
              w: ws[3],
              h: 92,
              color: '#2c3a5c',
              textColor: COSMOS.dim,
              size: 26,
              glow: 0,
              dash: [8, 8],
            }),
            txt('Step 4 (beyond budget)', xs[3], slotY + 74, 26, COSMOS.dim, 'mono', 'center'),
          );
          continue;
        }
        const filled = i < 3 ? (tp > 0.05 ? i < count3 : i === 0) : eo > 0.45;
        const isEos = i === 3;
        const col = isEos ? (eo > 0.45 ? ROLE.legal : ROLE.prefix) : filled ? ROLE.fsm : COSMOS.dim;
        nodes.push(
          tokenChip(filled ? DECODER_STEPS_4[i] : '...', xs[i], slotY, {
            w: ws[i],
            h: 92,
            color: col,
            size: 34,
            glow: filled ? 9 : 2,
            opacity: i === 3 ? ex : 1,
          }),
          txt(
            `Step ${i + 1}`,
            xs[i],
            slotY + 74,
            26,
            filled ? col : COSMOS.dim,
            'mono',
            'center',
          ).opacity(i === 3 ? ex : 1),
        );
        if (i > 0 && filled) {
          const prevRight = xs[i - 1] + ws[i - 1] * 0.5 + 8;
          const curLeft = xs[i] - ws[i] * 0.5 - 8;
          nodes.push(
            beamWithPhotons(
              quadArcPts([prevRight, slotY], [curLeft, slotY], 0),
              col,
              p * 1.2 + i * 0.3,
              {
                width: 3,
                photonCount: 1,
              },
            ),
          );
        }
      }

      // Live accepting-state emblem on far right
      nodes.push(
        fsmNode(760, slotY, 64, eo > 0.45 ? 'DONE' : 'WAIT', {
          color: eo > 0.45 ? ROLE.legal : be > 0.45 ? ROLE.prune : ROLE.prefix,
          accepting: eo > 0.45,
          size: 26,
        }),
      );

      // Text in buffer (identical in both runs!)
      nodes.push(
        txt('TEXT IN BUFFER (IDENTICAL IN BOTH RUNS)', -840, 35, 26, COSMOS.muted, 'mono', 'left'),
        txt(emitted, -840, 102, 50, COSMOS.ink, 'mono', 'left').glow(6, ROLE.fsm),
        line([-840, 152], [840, 152], { stroke: '#25355a', width: 2 }),
      );

      // Comparison rows: max_steps=3 vs max_steps=4
      nodes.push(txt('decode(max_steps = 3)', -840, 228, 34, COSMOS.ink, 'mono', 'left'));
      if (be < 0.05) {
        nodes.push(
          txt(
            'Text looks complete. Will it return a record?',
            -280,
            228,
            34,
            ROLE.prefix,
            'serif',
            'left',
          ).glow(6, ROLE.prefix),
        );
      } else {
        nodes.push(
          txt('BUDGET ERROR  (EOS NOT SAMPLED)', -280, 228, 34, ROLE.prune, 'mono', 'left')
            .glow(10, ROLE.prune)
            .opacity(be),
        );
      }

      if (ex > 0.05) {
        nodes.push(
          txt('decode(max_steps = 4)', -840, 326, 34, COSMOS.ink, 'mono', 'left').opacity(ex),
          txt(
            eo > 0.45 ? `RETURNS: ${RESULT_4}` : 'awaiting <eos> draw...',
            -280,
            326,
            34,
            eo > 0.45 ? ROLE.legal : ROLE.prefix,
            'mono',
            'left',
          )
            .glow(eo > 0.45 ? 10 : 0, ROLE.legal)
            .opacity(ex),
        );
      } else {
        nodes.push(
          txt(
            'Legal syntax alone does not guarantee completion before the token cap',
            -840,
            330,
            28,
            COSMOS.muted,
            'serif',
            'left',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, stageView);
  driftValue(s, c, pulse, 4.4, { startOffset: 0.1, endMargin: 0.5 });

  c.on('stop-three', () => {
    s.play(threeProg.to(1, { duration: clampDur(c, c.cue('stop-three').start, 1.1) }));
  });
  // Strict prediction withholding: reveal budget error AFTER spoken clause!
  c.after('stop-budget', () => {
    s.play(budgetErr.to(1, { duration: clampDur(c, c.cue('stop-budget').end, 0.4) }));
  });
  c.on('stop-extra', () => {
    s.play(extraSlot.to(1, { duration: clampDur(c, c.cue('stop-extra').start, 0.4) }));
  });
  c.on('stop-eos', () => {
    s.play(eosDone.to(1, { duration: clampDur(c, c.cue('stop-eos').start, 0.45) }));
  });
}
