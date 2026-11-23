import { assertEqual, dynamic, group, line, place } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { retainedPolicy } from '../../../films/beam-search/arithmetic.mjs';
import { COLORS, FLAT, WORDS, WORKSHEET } from '../parts.mjs';
import { massStrip } from '../ruler.mjs';

export default function filterK(s, c) {
  const [key, first, second, footer] = area.inset('normal').rows([0.75, 3.25, 3.25, 1], 'normal');
  const rule = place(label('Top-k sampling     •     keep two tokens', { size: 41 }), key, 'left');
  const makeWorksheet = (values, region, name) => {
    const selected = retainedPolicy(values, 'k', 2);
    const [names, original, normalized] = region.rows([1, 1.3, 1.1], 'tight');
    const cells = names.columns([1, 1.1, 1.1, 1.1, 1.1], 'tight');
    const header = [
      place(label(name, { size: 35 }), cells[0], 'left'),
      ...values.map((p, i) =>
        place(mono(`${WORDS[i]}  ${p.toFixed(3)}`, { size: 31, color: COLORS[i] }), cells[i + 1]),
      ),
    ];
    const [bar, summary] = original.columns([3.2, 1.7], 'wide');
    const [out, outLabel] = normalized.columns([3.2, 1.7], 'wide');
    const base = massStrip(bar, values, COLORS, 54);
    const x = bar.left + selected.mass * bar.width;
    const cut = line([x, bar.cy - 39], [x, bar.cy + 39], { stroke: 'ink', width: 5 });
    const mass = place(
      mono(`${selected.mass.toFixed(3)} kept`, { color: 'yellow', size: 37 }),
      summary,
      'left',
    );
    const extent = s.value(selected.mass);
    const result = dynamic(() =>
      group(
        ...massStrip(
          out,
          selected.probabilities.map((p) => p * extent.value),
          COLORS,
          54,
        ),
      ),
    );
    const shares = selected.indices.map((i) => selected.probabilities[i].toFixed(3));
    const normalizedName = place(mono(`${shares.join(' / ')}`, { size: 34 }), outLabel, 'left');
    return { header, base, cut, mass, result, extent, normalizedName };
  };
  const peaked = makeWorksheet(WORKSHEET, first, 'Peaked row');
  const flat = makeWorksheet(FLAT, second, 'Flatter row');
  const question = place(
    label('How much of the flatter row do those two keep?', { size: 40 }),
    footer,
  );

  const [condition, countRegion, stripRegion, stats, expression, decision] = area
    .inset('normal')
    .rows([1, 1, 1.5, 1.3, 1, 1.35], 'normal');
  const hazard = 0.002;
  const positions = s.value(0);
  const tail = (n) => 1 - (1 - hazard) ** n;
  assertEqual(tail(500).toFixed(3), '0.632', 'at least one tail token within 500 positions');
  const conditional = place(
    label('Given no earlier tail token, the next position has a 0.002 chance of one.', {
      size: 39,
    }),
    condition,
  );
  const [hitCell, clearCell] = stats.columns(2, 'wide');
  const histories = dynamic(() => {
    const n = Math.round(positions.value);
    const hit = tail(n);
    return group(
      place(label(`${n} generated position${n === 1 ? '' : 's'}`), countRegion),
      ...massStrip(stripRegion, [hit, 1 - hit], ['yellow', 'dim'], 104),
      place(
        mono(`At least one hit   ${(100 * hit).toFixed(1)}%`, { size: 35, color: 'yellow' }),
        hitCell,
      ),
      place(mono(`Still clear   ${(100 * (1 - hit)).toFixed(1)}%`, { size: 35 }), clearCell),
      place(mono(`P(still clear) = 0.998 ^ ${n}`, { size: 38 }), expression),
    );
  });
  const halfway = place(
    label('At 500 positions, will more than half have had a hit?', { size: 40 }),
    decision,
  );
  const title = heading(c.title);
  s.add(title, rule, peaked.header, peaked.base);
  c.show('peak-cut', peaked.cut);
  c.show('peak-mass', peaked.mass, { after: true });
  c.show('peak-stretch', peaked.result);
  c.on('peak-stretch', () => s.play(peaked.extent.to(1, { duration: 0.95 })));
  c.show('peak-stretch', peaked.normalizedName, { after: true });
  c.show('flat-input', [flat.header, flat.base]);
  c.show('flat-input', question);
  c.show('flat-mass', [flat.cut, flat.mass], { after: true });
  c.hide('flat-mass', question, { after: true });
  c.show('flat-stretch', flat.result);
  c.on('flat-stretch', () => s.play(flat.extent.to(1, { duration: 0.95 })));
  c.show('flat-stretch', flat.normalizedName, { after: true });
  c.swapAll('tail-trial', [conditional, histories], { keep: [title] });
  c.after('first-position', () => s.play(positions.to(1, { duration: 0.35 })));
  c.on('hundred', () => s.play(positions.to(100, { duration: 1.8 })));
  c.show('five-hundred-question', halfway);
  c.hide('long-tail', halfway, { after: true });
  c.after('long-tail', () => s.play(positions.to(500, { duration: 2 })));
}
