import { sampleModel } from '../model.mjs';

export function drawFilter(ctx, scene, state, api) {
  const { C } = api;
  const m = sampleModel('filter', state);
  const used = m.accepted + m.running;
  const slotX = (i) => 140 + i * 335;
  const group = (slot, y, name, status, color) => {
    const x = slotX(slot);
    api.rect(ctx, x, y, 295, 158, C.panel, color, 12);
    api.text(ctx, name, x + 148, y + 78, 67, color, 'center', 'mono');
    api.text(ctx, status, x + 148, y + 130, 32, C.ink, 'center');
  };

  api.text(ctx, 'Cumulative admission limit at step 3', 140, 276, 43, C.ink, 'left', 'serif');
  api.text(ctx, `${used} / ${m.limit} used`, 1775, 276, 40, C.cyan, 'right', 'mono');
  group(0, 340, 'A', 'trained', C.blue);
  group(1, 340, 'B', 'trained', C.blue);
  group(3, 340, 'D', 'running', C.pink);
  group(4, 340, 'E', 'running', C.pink);
  if (m.outgoing > 0) {
    api.rect(ctx, slotX(2), 340, 295, 158, C.bg, C.muted, 12);
    if (m.filtered && !m.incoming) api.text(ctx, 'free', slotX(2) + 148, 435, 44, C.ink, 'center');
  }

  api.text(ctx, 'Filtered prompt IDs', 140, 731, 43, C.ink, 'left', 'serif');
  api.focus.target('filter-group-c', () => {
    const y = 340 + 305 * m.outgoing;
    group(2, y, 'C', m.filtered ? 'filtered' : 'ready', m.filtered ? C.yellow : C.blue);
    api.text(ctx, 'Rewards   1, 1', slotX(2) + 148, y + 208, 31, C.ink, 'center', 'mono');
  });
  api.focus.target('filter-replacement', () => {
    if (m.incoming > 0) {
      group(2, 340 + 145 * (1 - m.incoming), 'F', m.incoming < 1 ? 'starting' : 'running', C.pink);
    }
  });
  api.text(
    ctx,
    `${m.submitted} submitted  =  ${m.accepted} accepted  +  ${m.filtered} filtered  +  ${m.running} running`,
    960,
    945,
    42,
    C.ink,
    'center',
  );
}

export default {
  id: 'filter',
  draw: drawFilter,
  cues: [
    'filter-beat-1-focus-1',
    'filter-beat-2-focus-1',
    'filter-beat-3-focus-1',
    'filter-beat-3-focus-2',
  ],
};
