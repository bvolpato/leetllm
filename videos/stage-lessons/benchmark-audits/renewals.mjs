import { place, rect } from 'vizmatic/stage';
import { label, mono, note } from '../kit-narrated.mjs';
import { CASES, COLOR, scoreCases } from './parts.mjs';

// Both rows use the same slots so a viewer can compare one question vertically.
export function renewalSheet(region) {
  const renewals = CASES.filter((item) => item.category === 'renewal');
  const [headers, a, b] = region.rows([1, 2, 2], 'normal');
  const split = (r) => r.columns([1.2, 1.15, 5], 'normal');
  const [allHead, ordinaryHead, ids] = split(headers);
  const titles = [place(note('All questions'), allHead), place(note('Ordinary'), ordinaryHead)];
  const idLabels = renewals.map((item, i) =>
    place(mono(item.id, { size: 31 }), ids.columns(renewals.length, 'tight')[i]),
  );
  const rows = [a, b].map((r, j) => {
    const model = j === 0 ? 'A' : 'B';
    const [who, ordinary, renewalRegion] = split(r);
    const [modelRegion, totalRegion] = who.rows(2, 'tight');
    const all = scoreCases(model);
    const regular = scoreCases(model, 'ordinary');
    const totals = [
      place(label('Assistant ' + model, { size: 38, color: COLOR[model] }), modelRegion),
      place(mono(`${all.correct}/${all.total}`, { size: 42 }), totalRegion),
    ];
    const ordinaryCount = place(
      mono(`${regular.correct}/${regular.total}`, { size: 43 }),
      ordinary,
    );
    const cells = renewalRegion.columns(renewals.length, 'tight').map((slot, i) => {
      const frame = place(
        rect(slot.width - 6, 90, { fill: 'surface', stroke: 'grid', width: 2 }),
        slot,
      );
      const pass = renewals[i][model];
      const mark = place(
        label(pass ? '✓' : '×', { size: 58, color: pass ? 'green' : 'red' }),
        slot,
      );
      return { frame, mark };
    });
    return {
      totals,
      ordinaryCount,
      frames: cells.map((v) => v.frame),
      marks: cells.map((v) => v.mark),
    };
  });
  return { titles, idLabels, rows };
}
