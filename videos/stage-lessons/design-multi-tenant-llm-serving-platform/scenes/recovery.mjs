// Scene 28: recovery - What happened to attempt one?
// Beats 0-1: Lost dispatch ACK on A-1 (700 held of 1,000). Usage receipt (300+120) arrives while
//            device read is still outstanding. Strictly withholds "BLOCKED / Keep 700 held" until
//            `c.after('recovery-retry-fence')`, quiescence until `c.after('recovery-quiescence')`,
//            and 420 settled / 580 available until `c.after('recovery-release-unused')`.
// Beats 2-3: Delivered stream ["The", "review"] with no resume checkpoint -> withholds
//            "Partial-result error" strictly until `c.after('recovery-partial-error')`!
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  buildLedgerNodes,
  cinemaHeader,
  guardedDynamic,
  stepAfter,
  stepOn,
  txt,
} from '../parts.mjs';

export default function recovery(s, c) {
  const oldOn = s.value(0);
  const usageOn = s.value(0);
  const fenceOn = s.value(0);
  const reconOn = s.value(0);
  const quiesceOn = s.value(0);
  const settleOn = s.value(0);
  const streamOn = s.value(0);
  const partialErrOn = s.value(0);

  const stageAura = aura(0, 20, 760, '#ffd1661c', '#60a5fa18');
  const header = cinemaHeader(
    'FAILURE RECOVERY & STREAM TERMINATION',
    'What happened to',
    'attempt one?',
    { x: -860, y: -450, accent: ROLE.held, size: 46 },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const usage = usageOn.value > 0.5;
      const fenced = fenceOn.value > 0.5;
      const recon = reconOn.value > 0.5;
      const quiesced = quiesceOn.value > 0.5;
      const settled = settleOn.value > 0.5;
      const showStream = streamOn.value > 0.5;
      const partialErr = partialErrOn.value > 0.5;

      const nodes = [];

      // Top right persistent attempt ownership bar
      nodes.push(
        rect(430, 88, {
          fill: quiesced ? '#0b201b' : '#1f190b',
          stroke: quiesced ? ROLE.ok : ROLE.held,
          width: 2.8,
          radius: 14,
        })
          .at(135, -395)
          .glow(7, quiesced ? ROLE.ok : ROLE.held),
        txt('attempt-1', 135, -418, 26, COSMOS.muted, 'mono', 'center'),
        txt(
          quiesced ? 'RETIRED' : oldOn.value > 0.5 ? 'MAY STILL RUN' : 'ACK LOST',
          135,
          -372,
          28,
          quiesced ? ROLE.ok : ROLE.held,
          'mono',
          'center',
        ),

        rect(430, 88, {
          fill: fenced && !quiesced ? '#240f19' : '#0b1224',
          stroke: fenced && !quiesced ? ROLE.fail : '#31426b',
          width: 2.8,
          radius: 14,
        })
          .at(615, -395)
          .glow(fenced && !quiesced ? 8 : 0, ROLE.fail),
        txt('attempt-2', 615, -418, 26, COSMOS.muted, 'mono', 'center'),
        txt(
          quiesced ? 'NOT DISPATCHED' : fenced ? 'BLOCKED' : 'READY / PROPOSED',
          615,
          -372,
          28,
          quiesced ? COSMOS.muted : fenced ? ROLE.fail : ROLE.warn,
          'mono',
          'center',
        ),
      );

      if (!showStream) {
        // Beats 0 & 1: Two separate evidence records + 1,000-unit conservation ledger
        nodes.push(
          rect(790, 178, {
            fill: '#0b1628',
            stroke: usage ? ROLE.shared : '#31426b',
            width: 2.8,
            radius: 16,
          })
            .at(-430, -145)
            .glow(usage ? 8 : 2, ROLE.shared),
          txt('EVIDENCE 1:  WORKER USAGE RECEIPT', -790, -196, 26, ROLE.shared, 'mono', 'left'),
          txt(
            usage ? '300 input + 120 output = 420' : 'Awaiting usage receipt...',
            -790,
            -136,
            34,
            usage ? COSMOS.ink : COSMOS.dim,
            'mono',
            'left',
          ),
          txt(
            'Trusted count does not prove device stopped',
            -790,
            -86,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ),

          rect(790, 178, {
            fill: quiesced ? '#0b201b' : '#21180b',
            stroke: quiesced ? ROLE.ok : ROLE.warn,
            width: 2.8,
            radius: 16,
          })
            .at(430, -145)
            .glow(9, quiesced ? ROLE.ok : ROLE.warn),
          txt(
            'EVIDENCE 2:  DEVICE RETIREMENT',
            70,
            -196,
            26,
            quiesced ? ROLE.ok : ROLE.warn,
            'mono',
            'left',
          ),
          txt(
            quiesced ? 'Last read FINISHED (retired)' : 'Device read OUTSTANDING',
            70,
            -136,
            34,
            quiesced ? ROLE.ok : ROLE.warn,
            'mono',
            'left',
          ),
          txt(
            quiesced ? 'attempt-1 cannot continue' : 'Must confirm before releasing hold',
            70,
            -86,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );

        const held = settled ? 0 : 700;
        const setVal = settled ? 420 : 0;
        const avail = 1000 - held - setVal;

        nodes.push(
          ...buildLedgerNodes({
            available: avail,
            held,
            settled: setVal,
            total: 1000,
            xLeft: -820,
            yBar: 170,
            width: 1640,
            height: 70,
            showEquation: true,
            equationY: 282,
          }),
        );

        let bottom = usage
          ? 'Usage receipt arrived, but a device read is live. Can we release 700 and start attempt 2?'
          : 'Dispatch ACK lost: attempt-1 may still be running on the 700-unit reservation.';
        let bCol = usage ? ROLE.focus : COSMOS.muted;
        if (settled) {
          bottom =
            'Settled 420 units and released 280 unused -> 580 available. Replacement needs its own owner.';
          bCol = ROLE.ok;
        } else if (quiesced) {
          bottom = 'Both records are in (usage + retirement). Ready to settle 420 once.';
          bCol = ROLE.ok;
        } else if (recon) {
          bottom = 'Keep 700 held. Reconcile the same request, reservation, and attempt-1.';
          bCol = ROLE.held;
        } else if (fenced) {
          bottom = 'Keep 700 held! Block attempt-2 from double-spending.';
          bCol = ROLE.fail;
        }
        nodes.push(txt(bottom, 0, 410, 29, bCol, 'sans', 'center'));
      } else {
        // Beats 2 & 3: Delivered stream events -> partial-result error (strictly withheld!)
        nodes.push(
          txt('STREAM ALREADY DELIVERED TO ALICE', -820, -185, 30, COSMOS.ink, 'mono', 'left'),
          txt(
            'Resume checkpoint for this prefix: UNAVAILABLE',
            820,
            -185,
            28,
            ROLE.warn,
            'mono',
            'right',
          ),
        );

        const delivered = [
          ['SEQ 01', '"The"', -560],
          ['SEQ 02', '"review"', 0],
        ];
        delivered.forEach(([seq, word, cx]) => {
          nodes.push(
            rect(480, 210, { fill: '#0b1428', stroke: ROLE.A, width: 3.0, radius: 16 })
              .at(cx, -10)
              .glow(7, ROLE.A),
            txt(seq, cx - 200, -76, 26, COSMOS.muted, 'mono', 'left'),
            txt(word, cx, 10, 48, COSMOS.ink, 'serif', 'center'),
            txt('Delivered to client', cx, 66, 26, ROLE.A, 'sans', 'center'),
          );
        });

        // Event 3: strictly `?` until after recovery-partial-error!
        nodes.push(
          rect(480, 210, {
            fill: partialErr ? '#24140b' : '#0b1224',
            stroke: partialErr ? ROLE.focus : '#3c507a',
            width: 3.0,
            radius: 16,
          })
            .at(560, -10)
            .glow(partialErr ? 10 : 3, ROLE.focus),
          txt(
            partialErr ? 'TERMINAL EVENT' : 'NEXT EVENT',
            360,
            -76,
            26,
            partialErr ? ROLE.focus : COSMOS.muted,
            'mono',
            'left',
          ),
          txt(
            partialErr ? 'Partial-result error' : '?',
            560,
            10,
            partialErr ? 36 : 58,
            partialErr ? ROLE.focus : COSMOS.ink,
            'mono',
            'center',
          ),
          txt(
            partialErr ? 'Alice keeps events 01 & 02' : 'What should Alice receive?',
            560,
            66,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ),

          rect(1660, 118, {
            fill: '#0b1526',
            stroke: partialErr ? ROLE.ok : ROLE.focus,
            width: 2.6,
            radius: 16,
          }).at(0, 260),
          txt(
            partialErr
              ? 'End cleanly with partial-result error. Resuming at seq 03 needs verified prefix + checkpoint.'
              : 'No compatible checkpoint exists for "The review". What should Alice receive next?',
            0,
            260,
            29,
            partialErr ? ROLE.ok : ROLE.focus,
            'sans',
            'center',
          ),
          txt(
            'Ledger settled: A-1  ·  420 charged  ·  580 available',
            0,
            412,
            28,
            COSMOS.muted,
            'mono',
            'center',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  stepOn(s, c, 'recovery-old-attempt', oldOn, 1);
  stepAfter(s, c, 'recovery-usage', usageOn, 1);
  // Strict prediction withholding: fence attempt-2 ONLY after "Keep the seven hundred units held"!
  stepAfter(s, c, 'recovery-retry-fence', fenceOn, 1);
  stepAfter(s, c, 'recovery-beat-1-focus-1', reconOn, 1);
  stepAfter(s, c, 'recovery-quiescence', quiesceOn, 1);
  stepAfter(s, c, 'recovery-release-unused', settleOn, 1);
  stepOn(s, c, 'recovery-stream-prefix', streamOn, 1);
  // Strict prediction withholding: reveal partial-result error ONLY after "End the stream with a partial-result error"!
  stepAfter(s, c, 'recovery-partial-error', partialErrOn, 1);
}
