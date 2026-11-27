// Scene 14: output-and-retries - How short can a useful reply be?
// 3-slot luminous reply structure (Decision, Citation, Next step) + animated rose output token gauge.
// Beat 0 `short-reply`: 220 -> 130 tokens keeping all 3 slots.
// Beat 1 `cut-reply`: drops to 55 tokens, emptying Citation & Next step during prediction hold.
// Beat 2 `keep-citation`: restores 130 tokens & reveals $0.00135 x 500 = $0.675 saved.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  conciseMicro,
  glowBar,
  guardedDynamic,
  txt,
  usd,
  verboseMicro,
} from '../parts.mjs';

export default function outputAndRetries(s, c) {
  const pulseT = s.value(0);
  const tokensVal = s.value(220); // 220 -> 130 -> 55 -> 130
  const phaseState = s.value(0); // 0 = verbose, 1 = concise, 2 = cut-55, 3 = restored

  const savingMicro = verboseMicro - conciseMicro; // 1350 -> $0.00135

  const header = cinemaHeader('OUTPUT COMPRESSION', 'How short can a', 'useful reply be?', {
    x: -860,
    y: -415,
    accent: ROLE.output,
    size: 52,
  });

  const sceneAura = aura(320, 40, 620, '#ff6b8b22', '#6ee7b71a');

  const stageCanvas = guardedDynamic(
    () => 1,
    () => {
      const tok = Math.round(tokensVal.value);
      const st = phaseState.value;
      const isCompact = st >= 0.5;
      const isCut = st >= 1.5 && st < 2.5;
      const isRestored = st >= 2.5;

      const slots = [
        {
          label: '1. DECISION',
          text: isCompact ? 'Refund eligible.' : 'Your refund is eligible.',
          present: true,
        },
        {
          label: '2. POLICY CITATION',
          text: isCompact ? 'Returns policy §3.' : 'See section 3 of the returns policy.',
          present: !isCut,
        },
        {
          label: '3. NEXT STEP',
          text: isCompact ? 'Confirm your order ID.' : 'Please confirm your order ID to proceed.',
          present: !isCut,
        },
      ];

      const nodes = [txt('REQUIRED CUSTOMER FIELDS', -860, -195, 26, COSMOS.muted, 'mono', 'left')];

      slots.forEach((slot, i) => {
        const y = -105 + i * 150;
        const border = slot.present ? (isRestored || isCompact ? ROLE.ok : ROLE.input) : ROLE.fail;
        const fill = slot.present ? '#101d2c' : '#24101a';
        nodes.push(
          txt(slot.label, -860, y - 54, 26, border, 'mono', 'left'),
          rect(940, 70, {
            fill,
            stroke: border,
            width: 2.4,
            radius: 12,
            ...(slot.present ? {} : { dash: [8, 6] }),
          })
            .at(-390, y + 12)
            .glow(slot.present ? 7 : 9, border),
          txt(
            slot.present ? slot.text : '[ TRUNCATED · MISSING ]',
            -825,
            y + 12,
            30,
            slot.present ? COSMOS.ink : ROLE.fail,
            slot.present ? 'sans' : 'mono',
            'left',
          ),
        );
      });

      // Right column: Live output token gauge & cost impact
      const gx = 195;
      const gaugeColor = isCut ? ROLE.fail : isRestored ? ROLE.ok : ROLE.output;
      nodes.push(
        txt('OUTPUT TOKENS IN FULL REPLY', gx, -195, 26, COSMOS.muted, 'mono', 'left'),
        txt(`${tok}`, gx, -85, 92, gaugeColor, 'mono', 'left').glow(10, gaugeColor),
        txt('tokens', gx + 235, -70, 32, COSMOS.muted, 'sans', 'left'),
        glowBar(gx, 10, 640, 38, tok / 220, { fill: gaugeColor, glow: 10 }),
        txt('55', gx, 64, 26, ROLE.fail, 'mono', 'left'),
        txt('130', gx + 378, 64, 26, ROLE.ok, 'mono'),
        txt('220', gx + 640, 64, 26, COSMOS.muted, 'mono', 'right'),

        txt('Same 2,200 input tokens', gx, 152, 28, ROLE.input, 'mono', 'left'),
        txt('1,280 reported cache reads', gx, 206, 28, ROLE.cached, 'mono', 'left'),
      );

      // Bottom prompt / savings readout
      if (isRestored) {
        nodes.push(
          txt(
            `90 output tokens cut x $15/M = ${usd(savingMicro, 5)}/attempt x 500 = ${usd(savingMicro * 500, 3)}`,
            -860,
            365,
            30,
            ROLE.ok,
            'mono',
            'left',
          ).glow(8, ROLE.ok),
          txt(
            'Check policy accuracy, then count attempts needed per resolved case',
            -860,
            422,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );
      } else if (isCut) {
        nodes.push(
          txt(
            'Could the customer verify the decision and act on this reply?',
            -860,
            378,
            34,
            ROLE.fail,
            'serif',
            'left',
          ).glow(6, ROLE.fail),
        );
      } else {
        nodes.push(
          txt(
            isCompact
              ? 'Concise wording keeps Decision, Citation & Next step at 130 tokens'
              : 'All three fields fit in the 220-token baseline reply',
            -860,
            378,
            30,
            isCompact ? ROLE.ok : COSMOS.muted,
            'sans',
            'left',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(sceneAura, header, stageCanvas);

  c.on('short-reply', () => {
    const t = c.cue('short-reply').start;
    const d = clampDur(c, t, 0.55);
    s.play(tokensVal.to(130, { duration: d }), phaseState.to(1, { duration: d }));
  });
  c.on('cut-reply', () => {
    const t = c.cue('cut-reply').start;
    const d = clampDur(c, t, 0.5);
    s.play(tokensVal.to(55, { duration: d }), phaseState.to(2, { duration: d }));
  });
  c.on('keep-citation', () => {
    const t = c.cue('keep-citation').start;
    const d = clampDur(c, t, 0.5);
    s.play(tokensVal.to(130, { duration: d }), phaseState.to(3, { duration: d }));
  });
}
