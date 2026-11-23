import { boxOf, column, dot, indicate, line, moveTo, place, rect, row, seq } from 'vizmatic/stage';
import { chip, heading, label, namedBox, note, tint } from '../../kit-narrated.mjs';
import { SIDE, footer, portal } from '../parts.mjs';

export default function adapterRuntime(s, c) {
  const p = portal(s, { account: 'separate deploy task' });
  const [contractArea, queueArea, runtimeArea] = SIDE.rows([1.1, 3.4, 1], 'wide');
  const contract = place(
    column(
      [
        note('Pinned transport contract'),
        row([chip('model'), chip('schema'), chip('adapter')], { gap: 'tight' }),
      ],
      { gap: 'tight' },
    ),
    contractArea,
  );
  const slots = queueArea.rows(3, 'wide');
  const actions = ['A · capture traceback', 'B · deploy effect', 'C · later scroll'].map(
    (name, i) =>
      place(
        namedBox(name, {
          width: slots[i].width,
          height: slots[i].height,
          color: i === 0 ? 'cyan' : 'dim',
        }),
        slots[i],
      ),
  );
  const runtimeRows = SIDE.rows([0.7, 1.4, 1.8, 1.4], 'normal');
  const batch = place(
    row(
      [
        chip('A done', { color: 'dim' }),
        chip('B paused', { color: 'dim' }),
        chip('C held', { color: 'dim' }),
      ],
      { gap: 'tight' },
    ),
    runtimeRows[0],
  );
  const browser = place(
    column([note('Browser executor'), chip('viewport CSS → CI portal', { color: 'cyan' })], {
      gap: 'normal',
      align: 'center',
    }),
    runtimeRows[1],
  );
  const nativeFrame = place(
    rect(runtimeRows[2].width, runtimeRows[2].height, {
      stroke: 'dim',
      fill: 'surface',
      radius: 12,
      width: 3,
    }).zIndex(-1),
    runtimeRows[2],
  );
  const nativeRows = runtimeRows[2].inset('normal').rows(3, 'normal');
  const nativeTitle = place(note('Native window · separate display'), nativeRows[0], 'left');
  const nativeChecks = place(
    note('display · focus · permission', { color: 'dim' }),
    nativeRows[1],
    'left',
  );
  const nativeReady = place(
    note('display ✓ focus ✓ permission ✓', { color: 'green' }),
    nativeRows[1],
    'left',
  );
  const stopped = place(note('Browser input stops here', { color: 'red' }), nativeRows[2], 'left');
  const screenshot = place(
    rect(runtimeRows[3].width * 0.8, runtimeRows[3].height, {
      stroke: 'blue',
      fill: 'surface',
      radius: 10,
      width: 2,
    }).zIndex(-1),
    runtimeRows[3],
  );
  const screenshotRows = boxOf(screenshot).inset('tight').rows(3, 'tight');
  const shotTitle = place(
    note('Browser screenshot · PNG', { color: 'blue' }),
    screenshotRows[0],
    'left',
  );
  const shotRun = place(note('RUN-78432', { color: 'cyan' }), screenshotRows[1], 'left');
  const shotError = place(note('KeyError: status', { color: 'cyan' }), screenshotRows[2], 'left');
  const browserInput = dot(12, 'cyan').moveTo(boxOf(browser).point('left'));
  const nativeInput = dot(12, 'green').moveTo(boxOf(nativeFrame).point('right'));
  const captured = dot(12, 'blue').moveTo([
    boxOf(p.frame).right - 16,
    boxOf(p.traceback).point('right')[1],
  ]);
  const gutter = boxOf(p.frame).right + (SIDE.left - boxOf(p.frame).right) / 2;
  const pending = dot(13, 'pink').moveTo(boxOf(actions[0]).point('left'));
  const pause = line(
    boxOf(actions[1]).point('bottom left'),
    boxOf(actions[1]).point('bottom right'),
    { stroke: 'yellow', width: 8 },
  );
  const proposed = footer('Host checks each proposed action in order', 'pink');
  const unexecuted = footer('Pause at review. Later scroll stays unexecuted.', 'yellow');
  const confirmation = footer('Provider confirmation + application permission', 'yellow');
  const isolated = footer('Isolate generated code and reachable capabilities.', 'blue');
  const reproducible = footer('Fixed fonts · viewport · browser · scale', 'blue');
  const visible = footer('Wait for the task-specific visible state.', 'green');
  s.add(heading(c.title), p.shell, p.visible, contract, actions, pending);
  c.on('contract', () => s.play(indicate(contract, { color: 'yellow', scale: 1 })));
  c.show('generated', proposed);
  c.on('lost-session', () => s.play(indicate(p.frame, { color: 'yellow', scale: 1 })));
  c.on('ordered', () =>
    s.play(moveTo(pending, boxOf(actions[0]).point('right'), { duration: 0.8 })),
  );
  c.on('capture', () =>
    s.play(
      tint(actions[0], 'dim'),
      moveTo(pending, boxOf(p.traceback).grow('normal').point('right'), { duration: 1.1 }),
    ),
  );
  c.show('pause', pause);
  c.on('pause', () =>
    s.play(
      moveTo(pending, boxOf(actions[1]).point('left'), { duration: 0.9 }),
      tint(actions[1], 'yellow'),
    ),
  );
  c.swap('later', proposed, unexecuted);
  c.on('remaining', () => s.play(indicate(actions[2], { color: 'yellow', scale: 1 })));
  c.swap('confirmation', unexecuted, confirmation);
  c.swap('code', confirmation, isolated);
  c.swap(
    'browser',
    [contract, actions, pause, pending],
    [batch, browser, nativeFrame, nativeTitle, nativeChecks, screenshot, shotTitle],
  );
  c.show('browser', browserInput, { lead: -0.4 });
  c.on(
    'browser',
    () =>
      s.play(
        seq(
          moveTo(browserInput, [gutter, boxOf(browser).point('left')[1]], { duration: 0.5 }),
          moveTo(browserInput, [gutter, boxOf(p.failed).point('right')[1]], { duration: 0.5 }),
          moveTo(browserInput, boxOf(p.failed).point('right'), { duration: 0.5 }),
        ),
      ),
    0.6,
  );
  c.show('browser-boundary', stopped);
  c.on('browser-boundary', () =>
    s.play(
      seq(
        moveTo(browserInput, [gutter, boxOf(p.failed).point('right')[1]], { duration: 0.4 }),
        moveTo(browserInput, [gutter, boxOf(nativeFrame).point('left')[1]], { duration: 0.5 }),
        moveTo(browserInput, boxOf(nativeFrame).point('left'), { duration: 0.4 }),
      ),
    ),
  );
  c.swap('native', nativeChecks, nativeReady, { after: true });
  c.show('native', nativeInput, { after: true });
  c.on('native', () => s.play(indicate(nativeTitle, { color: 'yellow', scale: 1 })));
  c.show('headless', captured);
  c.on('headless', () =>
    s.play(
      seq(
        moveTo(captured, [gutter, boxOf(p.traceback).point('right')[1]], { duration: 0.4 }),
        moveTo(captured, [gutter, boxOf(screenshot).point('left')[1]], { duration: 0.6 }),
        moveTo(captured, [boxOf(screenshot).left - 18, boxOf(screenshot).point('left')[1]], {
          duration: 0.5,
        }),
      ),
    ),
  );
  c.show('headless', [shotRun, shotError], { after: true });
  c.swap('reproducible', isolated, reproducible);
  c.swap('visible', reproducible, visible);
}
