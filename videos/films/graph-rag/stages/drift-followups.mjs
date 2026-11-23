import { card, connector, line, paper, text } from '../defaults.mjs';

const id = 'drift-followups';

export function drawDriftFollowups(ctx, scene, state, api) {
  const { C } = api;
  const cue = (name) => state.cues?.[id + '-' + name];
  const started = (name) => ['during', 'after'].includes(cue(name)?.phase);
  const write = (s, x, y, z, color, align) => text(ctx, api, id, s, x, y, z, color, align);
  const focus = (name, draw) => api.focus.target(id + '-' + name, draw);

  if (state.beat === 2) {
    write('Who wrote River Walk?', 120, 290, 54, C.ink);
    write('A   /   Lena wrote River Walk.', 120, 373, 39, C.blue);
    focus('prompts', () => {
      const pitch = 130;
      const row = (y, position, label) => {
        write(label, 120, y + 55, 34, C.ink);
        // Neighboring passages shift one slot as A moves past them.
        for (let i = 1; i <= 4; i++) {
          const slot = i - Math.min(1, Math.max(0, position - (i - 1)));
          api.rect(ctx, 425 + slot * pitch, y, 104, 84, C.panel, C.muted, 5);
        }
        const x = 425 + position * pitch;
        const lift = position % 1 === 0 ? 0 : Math.sin(Math.PI * (position % 1)) * 96;
        api.rect(ctx, x, y - lift, 104, 84, C.blue, undefined, 5);
        write('A', x + 52, y + 56 - lift, 41, C.bg, 'center');
      };
      row(485, 0, 'First prompt');
      if (started('middle')) row(720, 2 * cue('middle').progress, 'Second prompt');
    });
    line(ctx, api, 1150, 310, 1150, 824, C.muted, 2);
    write('Excluded from both prompts', 1210, 423, 35, C.ink);
    write('B-v1: BLOCKED after correction', 1210, 505, 31, C.pink);
    write('Old B cannot answer after correction', 1210, 568, 28, C.muted);
    if (started('study')) {
      focus('study', () => {
        write('Podcast and news summaries', 1210, 696, 34, C.ink);
        write('Judges compared breadth and variety.', 1210, 759, 30, C.blue);
      });
    }
    write('Does each answer cite the sentence on A?', 960, 951, 42, C.ink, 'center');
    return;
  }

  write('Which travel books are there, and who published them?', 120, 253, 43, C.ink);
  focus('report', () => {
    write('Community report', 130, 341, 32, C.blue);
    card(ctx, api, id, 'Travel includes River Walk', 120, 385, 620, 120, C.blue, 39);
  });
  if (started('question')) {
    focus('question', () => {
      connector(ctx, api, 773, 445, 1010, 445, cue('question').progress, C.yellow);
      write('Follow-up question', 1060, 341, 32, C.yellow);
      card(ctx, api, id, 'Who published River Walk?', 1040, 385, 725, 120, C.yellow, 39);
    });
  }
  if (started('followup-source')) {
    focus('sources', () => {
      connector(ctx, api, 1405, 528, 1405, 600, cue('followup-source').progress, C.green);
      const stale = started('followup-stale');
      const publisher =
        cue('answer')?.phase === 'after' ? 'B: published by Willow Press.' : 'B: publisher record';
      paper(
        ctx,
        api,
        id,
        'Local source records',
        ['A: Lena wrote River Walk.', stale ? 'B-v1: BLOCKED after correction' : publisher],
        1020,
        620,
        770,
        stale ? C.pink : C.green,
      );
      if (stale) write('Fetch the current publisher record.', 1410, 903, 33, C.pink, 'center');
    });
  }
}

export default {
  id,
  draw: drawDriftFollowups,
  cues: [
    'b1',
    'question',
    'followup-source',
    'answer',
    'followup-stale',
    'b3',
    'middle',
    'study',
  ].map((name) => id + '-' + name),
};
