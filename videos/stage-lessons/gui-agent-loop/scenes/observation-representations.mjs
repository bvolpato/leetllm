import { assertEqual, indicate, place } from 'vizmatic/stage';
import { heading, label, mono, namedBox, note, tint } from '../../kit-narrated.mjs';
import { freshScopedControls } from '../../../films/gui-agent-loop/model.mjs';
import { footer } from '../parts.mjs';
import {
  browserPane,
  failedTestRows,
  outline,
  paperArea,
  screenArea,
  scopedTabs,
} from '../inspection-desk.mjs';

export default function representations(s, c) {
  const { controls, intendedRun } = freshScopedControls();
  const [match] = scopedTabs(controls, intendedRun);
  assertEqual(scopedTabs(controls, intendedRun).length, 1, 'one tab belongs to the intended run');
  const page = browserPane(screenArea, 'ci.example  /  run comparison');
  const tabs = failedTestRows(page.body, controls);
  const [title, one, two, three] = paperArea.inset('wide').rows(4, 'normal');
  const head = (str) => place(label(str, { size: 44, color: 'blue' }), title, 'left');
  const sample = (str, region, color = 'ink') =>
    place(mono(str, { size: 34, color }), region, 'left');
  const dom = [head('DOM'), sample('<canvas>', one), sample('<button role="tab">', two)];
  const tree = [
    head('Accessibility tree'),
    sample('tab   Failed tests', one),
    sample('tab   Failed tests', two),
  ];
  const crop = [
    head('Magnified crop'),
    place(mono(intendedRun, { size: 52 }), one, 'left'),
    place(
      namedBox(match.label, { width: two.width, height: two.height, size: 58, color: 'cyan' }),
      two,
    ),
  ];
  const hidden = sample('hidden text', three, 'dim');
  const badges = tabs.map((_, i) =>
    place(note(controls[i].id, { color: 'yellow', size: 33 }), tabs[i].owner, 'right'),
  );
  const all = footer('Page-wide name match   ·   ' + controls.length + ' tabs', 'yellow');
  const scoped = footer(
    'RUN-78432   ·   ' + scopedTabs(controls, intendedRun).length + ' matching tab',
    'cyan',
  );
  s.add(
    heading(c.title),
    page.shell,
    tabs.flatMap((r) => r.nodes),
    outline(paperArea, 'dim'),
    dom,
  );
  c.show('hidden', hidden);
  c.swap('tree', [dom, hidden], tree);
  c.show('both', all, { after: true });
  c.hide('scope', [tabs[1].nodes, tree[2]]);
  c.swap('scope', all, scoped, { after: true });
  c.after('scope', () => s.play(tint(tabs[0].tab, 'yellow')));
  c.swap('pixels', tree.slice(0, 2), crop);
  c.show('marks', badges[0]);
  c.on('map', () => s.play(indicate(badges[0], { color: 'yellow', scale: 1 })));
  c.swap(
    'locator',
    scoped,
    footer('Visible   ·   stable   ·   enabled   ·   receives the click', 'cyan'),
  );
  assertEqual(match.id, controls[0].id, 'marked tab survives the filter');
}
