import { column, dynamic, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { allocation, receipt } from '../parts.mjs';
import { fresh, packRequest, freshNote, freshRecent, excerpt, citedAnswer, source } from '../packet.mjs';

export default function exercise(s, c) {
  const [question, records, comparison, rail, amount] = area.rows([1.15, 2.8, 1, 1.15, 0.85], 'normal');
  const [left, right] = records.columns(2, 'wide');
  const phase = s.value(0), load = s.value(0);
  const shift = s.value(0);
  const base = packRequest(fresh);
  const withNote = packRequest(fresh, [freshNote, freshRecent]);
  const attempted = packRequest(fresh, [freshNote, freshRecent, excerpt]);
  const withExcerpt = packRequest(fresh, [excerpt, freshRecent]);
  s.add(heading(c.title), dynamic(() => {
    const k = phase.value;
    const packed = [base, packRequest(fresh, [freshNote]), withNote, packRequest(fresh, [freshRecent]), withExcerpt][load.value];
    const prompt = k < 2 ? 'How much optional input fits?' : k < 4 ? 'Who approved the rollback?' :
      k >= 5 && k < 8 ? 'How can the excerpt fit with E3 and 12 reply slots?' : 'Why did the lead approve the rollback?';
    const nodes = [place(label(prompt, { size: 60, color: 'cyan' }), question)];
    if (k < 2) nodes.push(place(mono('40 − 12 − 6 − 2 = ?', { size: 64 }), records));
    if (k >= 2 && load.value === 0) nodes.push(place(mono(base.remaining + ' units for optional input', { size: 59 }), records));
    if (load.value > 0 && k < 9) {
      nodes.push(...place(column([mono('D1 v3   /   6-unit note', { size: 36, color: load.value > 2 ? 'dim' : 'yellow' }),
        label('Approved by the incident lead', { size: 38 }),
        note(load.value > 2 ? 'Removed from request' : 'In the request')], { gap: 'normal' }), left, 'left').nodes);
    }
    if (k >= 5 && k < 9) {
      nodes.push(...place(column([mono('D1 v' + source.version + '   /   9-unit excerpt', { size: 36, color: 'yellow' }),
        label('Signed decision + recorded reason', { size: 38 }), note(load.value === 4 ? 'In the request' : 'In the archive')],
      { gap: 'normal' }), right, 'left').nodes);
    }
    if (k === 9) {
      nodes.push(...place(column([
        mono(citedAnswer(packed, 'source') + '   /   v' + citedAnswer(packed, 'version'), { size: 36 }),
        label('“' + citedAnswer(packed, 'reason') + '”', { size: 67, color: 'yellow' }),
        label('Signed by the ' + citedAnswer(packed, 'actor'), { size: 42 }),
      ], { gap: 'normal' }), records).nodes);
    }
    if (k >= 5 && k < 8 && load.value !== 4) {
      const pitch = rail.width / fresh.capacity;
      const offset = fresh.rules + shift.value * withExcerpt.remaining;
      for (let i = 0; i < excerpt.units; i++) {
        const conflicts = k === 6 && i >= withNote.remaining && attempted.dropped.includes(excerpt);
        const color = conflicts ? 'pink' : 'yellow';
        nodes.push(rect(pitch - 3, 43, { fill: conflicts ? color : null, stroke: color, width: 3, radius: 4 })
          .moveTo([rail.left + (offset + i + 0.5) * pitch, comparison.cy]));
      }
      const extra = k === 6 ? `Append: ${withNote.total} + ${excerpt.units} = ${withNote.total + excerpt.units}  >  ${fresh.capacity}` :
        k === 7 ? 'The note frees six more slots' : '9-unit excerpt';
      nodes.push(label(extra, { size: 40, color: k === 6 ? 'pink' : 'yellow' })
        .moveTo([comparison.left + comparison.width * 0.72, comparison.cy]));
    }
    if (k >= 8) nodes.push(place(mono(`Replace: ${withNote.total} − ${freshNote.units} + ${excerpt.units} = ${withExcerpt.total}`, { size: 46, color: 'green' }), comparison));
    if (k >= 1) nodes.push(...allocation(rail, fresh, packed, { showFree: k >= 2 }));
    if (k >= 2 && (load.value !== 4 || k >= 8)) nodes.push(receipt(amount, fresh, packed));
    return nodes;
  }));
  c.after('fixed-input', () => phase.set(1));
  c.after('optional-space', () => phase.set(2));
  c.after('load-note', () => load.set(1));
  c.after('load-recent', () => load.set(2));
  c.on('change-task', () => phase.set(4));
  c.on('open-archive', () => phase.set(5));
  c.after('append', () => phase.set(6));
  c.after('remove-note', () => { phase.set(7); load.set(3); s.play(shift.to(1, { duration: 0.65 })); });
  c.after('replace-note', () => load.set(4));
  c.after('fit-result', () => phase.set(8));
  c.after('read-reason', () => phase.set(9));
}
