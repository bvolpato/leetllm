import { column, place } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';

export function reading(region, name, value, foot, color = 'cyan') {
  return place(column([label(name, { size: 36 }), mono(value, { size: 53, color }), note(foot)], { gap: 'normal', align: 'center' }), region);
}
