// Scene 07: fim-training - Train the middle after its two preserved boundaries
// Contrasting PSM (<PRE> prefix <SUF> suffix <MID> middle) vs Joint-Training SPM
// (<PRE> <SUF> suffix <MID> prefix middle) and Qwen2.5-Coder trained sentinel IDs.
import { group, line, rect } from 'vizmatic/stage';
import { COSMOS, ROLE, aura, cinemaHeader, clampDur, guardedDynamic, txt } from '../parts.mjs';

export default function fimTraining(s, c) {
  const spmOn = s.value(0);
  const qwenOn = s.value(0);

  const header = cinemaHeader(
    'PSM VS SPM FIM FORMATS',
    'Train the middle after',
    'both boundaries',
    {
      x: -860,
      y: -445,
      accent: ROLE.model,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#a78bfa1a', '#5ce1e618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const sp = spmOn.value;
      const qw = qwenOn.value;
      const nodes = [];

      // Row 1: PSM Order
      const y1 = -120;
      nodes.push(
        txt('PSM (PREFIX - SUFFIX - MIDDLE)', -780, y1 - 62, 26, ROLE.ed, 'mono', 'left'),
        rect(450, 56, { fill: '#0b1428', stroke: ROLE.ed, width: 3, radius: 8 }).at(-555, y1),
        txt('<PRE>  prefix', -555, y1, 26, ROLE.ed, 'mono', 'center'),
        rect(450, 56, { fill: '#0b1428', stroke: ROLE.ok, width: 3, radius: 8 }).at(-75, y1),
        txt('<SUF>  suffix', -75, y1, 26, ROLE.ok, 'mono', 'center'),
        rect(540, 56, { fill: '#0b1428', stroke: ROLE.model, width: 3, radius: 8 }).at(450, y1),
        txt('<MID>  generated middle', 450, y1, 26, ROLE.model, 'mono', 'center'),
      );

      // Row 2: Joint-Training SPM Order (<PRE> <SUF> suffix <MID> prefix | middle)
      const y2 = 65;
      const spAlpha = 0.4 + sp * 0.6;
      nodes.push(
        txt(
          'JOINT-TRAINING SPM (SUFFIX FIRST -> CONTIGUOUS PREFIX + MIDDLE!)',
          -780,
          y2 - 62,
          26,
          ROLE.focus,
          'mono',
          'left',
        ).opacity(spAlpha),
        rect(510, 56, { fill: '#0b1428', stroke: ROLE.ok, width: 3, radius: 8 })
          .at(-525, y2)
          .opacity(spAlpha),
        txt('<PRE> <SUF>  suffix', -525, y2, 26, ROLE.ok, 'mono', 'center').opacity(spAlpha),
        rect(450, 56, { fill: '#0b1428', stroke: ROLE.ed, width: 3, radius: 8 })
          .at(-15, y2)
          .opacity(spAlpha),
        txt('<MID>  prefix', -15, y2, 26, ROLE.ed, 'mono', 'center').opacity(spAlpha),
        rect(480, 56, { fill: '#0b1428', stroke: ROLE.focus, width: 3.4, radius: 8 })
          .at(480, y2)
          .glow(8, ROLE.focus)
          .opacity(spAlpha),
        txt('-> generated middle', 480, y2, 26, ROLE.focus, 'mono', 'center').opacity(spAlpha),
      );

      nodes.push(
        txt('CHAR-BOUNDARY SPLITS', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('Trains edits inside tokenizer pieces', 480, -378, 26, COSMOS.muted, 'mono', 'center'),
        line([-840, 185], [840, 185], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          qw > 0.4
            ? 'Qwen2.5-Coder: use exact trained infill + repo token IDs (compare speed vs span quality!)'
            : 'Mixing FIM with standard text preserves left-to-right completion quality',
          0,
          262,
          26,
          qw > 0.4 ? ROLE.ok : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('cc-fim-spm', () => {
    s.play(spmOn.to(1, { duration: clampDur(c, c.cue('cc-fim-spm').start, 0.4) }));
  });
  c.on('cc-fim-training-2', () => {
    s.play(qwenOn.to(1, { duration: clampDur(c, c.cue('cc-fim-training-2').start, 0.35) }));
  });
}
