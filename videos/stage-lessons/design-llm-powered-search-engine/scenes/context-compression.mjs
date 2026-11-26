// Scene 13: context-compression - Preserve the original evidence through compression
// Full tokenizer budget allocation; Beat 0 duplicate policy crowding out exception;
// Beat 1 Lost-in-the-Middle position sweep; Beat 2 LLMLingua compression retaining original span map.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function contextCompression(s, c) {
  const pulse = s.value(0);
  const budgetOn = s.value(0);
  const beat1On = s.value(0);
  const posSweep = s.value(0);
  const beat2On = s.value(0);
  const compressCheck = s.value(0);

  const header = cinemaHeader(
    'CONTEXT & COMPRESSION',
    'Preserve original spans',
    'through compression',
    {
      accent: ROLE.query,
      size: 46,
    },
  );

  const stageAura = aura(0, 60, 700, '#5ce1e61a', '#6ee7b71a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const b1 = beat1On.value > 0.5;
      const sw = posSweep.value;
      const b2 = beat2On.value > 0.5;
      const cc = compressCheck.value > 0.5;
      const nodes = [];

      // Persistent top bar: Single target-tokenizer prompt allocation
      const segs = [
        { label: 'Instr.', w: 220, col: ROLE.policy },
        { label: 'Query', w: 200, col: ROLE.query },
        { label: 'Wrap', w: 180, col: ROLE.rewrite },
        { label: 'Evidence window', w: 760, col: ROLE.exception },
        { label: 'Output reserve', w: 280, col: ROLE.focus },
      ];
      nodes.push(
        txt('TARGET TOKENIZER PROMPT BUDGET', -840, -238, 26, COSMOS.muted, 'mono', 'left'),
      );
      let cx = -840;
      segs.forEach((seg, i) => {
        const isEv = i === 3;
        nodes.push(
          rect(seg.w - 8, 86, {
            fill: isEv ? '#0d1a26' : seg.col,
            stroke: seg.col,
            width: isEv ? 3 : 1.5,
            radius: 10,
          })
            .at(cx + seg.w * 0.5, -158)
            .opacity(isEv ? 0.96 : 0.85),
          txt(
            seg.label,
            cx + seg.w * 0.5,
            -158,
            26,
            isEv ? ROLE.exception : '#070910',
            'mono',
            'center',
          ),
        );
        cx += seg.w;
      });

      if (b2) {
        // Beat 2: LLMLingua compression + retained original span mapping
        nodes.push(
          rect(740, 210, { fill: '#0d1924', stroke: ROLE.exception, width: 2.8, radius: 14 })
            .at(-470, 125)
            .glow(8, ROLE.exception),
          txt('RETAINED ORIGINAL SOURCE', -805, 62, 26, ROLE.exception, 'mono', 'left'),
          txt('60 days ONLY WITH', -805, 124, 34, COSMOS.ink, 'mono', 'left'),
          txt('SECURITY APPROVAL', -805, 174, 34, ROLE.exception, 'mono', 'left'),

          beamWithPhotons(quadArcPts([-95, 125], [95, 125], -22), cc ? ROLE.ok : ROLE.focus, p, {
            width: 3.6,
            glow: 9,
            photonCount: 1,
          }),

          rect(740, 210, {
            fill: '#0e1527',
            stroke: cc ? ROLE.ok : ROLE.caution,
            width: 2.8,
            radius: 14,
          })
            .at(470, 125)
            .glow(8, cc ? ROLE.ok : ROLE.caution),
          txt(
            cc ? 'LLMLINGUA + VERIFIED SPAN MAP' : 'LLMLINGUA COMPRESSED PROMPT',
            135,
            62,
            26,
            cc ? ROLE.ok : ROLE.caution,
            'mono',
            'left',
          ),
          txt(
            cc ? '60d ONLY WITH SECURITY APPROVAL' : '60d w/ approval (check negation!)',
            135,
            134,
            28,
            cc ? COSMOS.ink : ROLE.caution,
            'mono',
            'left',
          ),
          txt('mapped -> exception@1 [0, 101)', 135, 192, 26, ROLE.query, 'mono', 'left'),

          txt(
            'Compress only AFTER auth & selection; verify claims against retained originals.',
            -840,
            356,
            30,
            ROLE.focus,
            'serif',
            'left',
          ),
        );
      } else if (b1) {
        // Beat 1: Lost in the Middle position sensitivity sweep
        const railL = -820;
        const railR = 820;
        const excX = -520 + sw * 1040;
        nodes.push(
          txt(
            'LOST IN THE MIDDLE: POSITION SENSITIVITY TEST',
            -840,
            4,
            28,
            ROLE.focus,
            'mono',
            'left',
          ),
          rect(railR - railL, 120, {
            fill: '#0b1222',
            stroke: '#354b78',
            width: 2.4,
            radius: 14,
          }).at(0, 128),
          txt('START', -760, 224, 26, COSMOS.dim, 'mono', 'left'),
          txt('MIDDLE (test distractors)', 0, 224, 26, ROLE.caution, 'mono', 'center'),
          txt('END', 760, 224, 26, COSMOS.dim, 'mono', 'right'),

          rect(310, 84, { fill: ROLE.exception, stroke: '#ffffff', width: 2, radius: 10 })
            .at(excX, 128)
            .glow(10, ROLE.exception),
          txt('exception@1', excX, 128, 30, '#070910', 'mono', 'center'),

          txt(
            'Measure ordering & distractors on YOUR model before moving or repeating passages.',
            -840,
            356,
            30,
            COSMOS.ink,
            'sans',
            'left',
          ),
        );
      } else {
        // Beat 0: Duplicate policy chunks crowding out exception
        for (let i = 0; i < 3; i++) {
          const x = -560 + i * 560;
          nodes.push(
            rect(500, 178, { fill: '#0d1528', stroke: ROLE.policy, width: 2.6, radius: 12 })
              .at(x, 120)
              .opacity(0.6 + 0.4 * budgetOn.value),
            txt(`REPEATED POLICY #${i + 1}`, x, 72, 26, ROLE.policy, 'mono', 'center'),
            txt('30 days after notice', x, 134, 30, COSMOS.ink, 'sans', 'center'),
            txt('duplicate chunk', x, 180, 26, COSMOS.dim, 'mono', 'center'),
          );
        }
        nodes.push(
          txt(
            'DUPLICATE CHUNKS CROWDED OUT exception@1 -> measure coverage & diversity!',
            -840,
            345,
            30,
            ROLE.deny,
            'mono',
            'left',
          ).glow(7, ROLE.deny),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.6, { startOffset: 0.1, endMargin: 0.5 });

  c.on('se-context-compression-0', () => {
    s.play(
      budgetOn.to(1, { duration: clampDur(c, c.cue('se-context-compression-0').start, 0.35) }),
    );
  });
  c.on('se-context-compression-1', () => {
    s.play(beat1On.to(1, { duration: clampDur(c, c.cue('se-context-compression-1').start, 0.25) }));
  });
  c.on('se-context-compression-position', () => {
    s.play(
      posSweep.to(1, {
        duration: clampDur(c, c.cue('se-context-compression-position').start, 1.2),
      }),
    );
  });
  c.on('se-context-compression-2', () => {
    s.play(beat2On.to(1, { duration: clampDur(c, c.cue('se-context-compression-2').start, 0.25) }));
  });
  c.on('se-context-compression-compress', () => {
    s.play(
      compressCheck.to(1, {
        duration: clampDur(c, c.cue('se-context-compression-compress').start, 0.35),
      }),
    );
  });
}
