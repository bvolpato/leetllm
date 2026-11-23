import { featureFrame } from '../model.mjs';
import { heartbeatAge } from '../arithmetic.mjs';

const hours = heartbeatAge(540, 510);
const minutes = hours * 60;

export function drawContract(ctx, scene, state, api) {
  const f = featureFrame(state),
    { C } = api;
  const t = (s, x, y, size, color = C.ink, align = 'center') =>
    api.text(ctx, s, x, y, size, color, align);
  api.focus.target('contract-unit', () => {
    if (f.b === 2) {
      const swapped = f.completed('contract-order', 2);
      t('J-204   /   same two numeric slots', 154, 283, 36, C.ink, 'left');
      const fields = ['Queued minutes', 'Heartbeat hours'];
      t('Fitted layout', 268, 540, 32, C.muted);
      t('Writer output', 268, 712, 32, C.muted);
      fields.forEach((field, i) => {
        const x = 687 + i * 690;
        t(field, x, 428, 40, C.cyan);
        t(String([42, hours][i]), x, 562, 58, C.cyan);
        t(String((swapped ? [hours, 42] : [42, hours])[i]), x, 734, 58, swapped ? C.pink : C.cyan);
      });
      t('2 slots in either order', 960, 942, 39, C.muted);
      return;
    }
    t('Same ping   08:30', 151, 278, 41, C.cyan, 'left');
    t('Same decision   09:00', 1763, 278, 41, C.yellow, 'right');
    t('Model input   /   hours since last heartbeat', 960, 400, 38, C.ink);
    const p = f.progress('contract-compare', 0);
    const converted = f.completed('contract-convert', 1);
    for (let i = 0; i < 2; i++) {
      const x = 490 + i * 935;
      t('Writer ' + (i === 0 ? 'A' : 'B'), x, 495, 39);
      api.rect(ctx, x - 260, 544, 520, 173, C.panel, C.cyan, 3);
      const ready = i === 0 ? p > 0 : p > 0.6;
      t(
        ready ? (i === 0 && !converted ? String(minutes) : String(hours)) : '?',
        x,
        663,
        85,
        C.cyan,
      );
    }
    const unit = f.started('contract-unit-name', 1);
    t(
      converted
        ? 'Both writers now send hours'
        : unit
          ? 'Writer B already sends hours'
          : 'Which writer can feed the model directly?',
      960,
      847,
      46,
      C.yellow,
    );
    if (f.started('contract-convert', 1))
      t('30 min ÷ 60 min/h = ' + (converted ? hours + ' h' : '?'), 490, 948, 41);
  });
}
export default {
  id: 'contract',
  draw: drawContract,
  cues: ['contract-compare', 'contract-unit-name', 'contract-convert', 'contract-order'],
};
