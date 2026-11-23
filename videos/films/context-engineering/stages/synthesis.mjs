import { findings } from '../model.mjs';
import { sources } from '../fixtures.mjs';
import { caseClock, casePage } from '../case-file.mjs';

export function drawSynthesis(ctx, scene, state, api) {
  const { text, box, rule, focus, C } = casePage(ctx, api);
  const clock = caseClock(scene, state);
  const original = findings()[0];
  const missing = clock.done('note-shorten') && !clock.done('note-pin');
  const shortened = { finding: original.finding };
  const note = missing ? shortened : original;
  const lookups = [];
  if (clock.done('note-read')) lookups.push(shortened);
  if (clock.done('note-reread')) lookups.push(note);
  const attempts = lookups.length;
  const lastKey = lookups.at(-1)?.source;
  const record = Object.hasOwn(sources, lastKey) ? sources[lastKey] : null;
  text('RUN-842     /     Reconstruct the callback result', 150, 279, 36);
  focus('saved-note', () => {
    box(150, 385, 786, 370, C.panel);
    text('Saved finding', 185, 448, 30, C.muted);
    text(note.finding.replace(' error', '\nerror'), 185, 550, 48, C.ink, 'left', 'serif');
    text('Source', 185, 705, 32, C.muted);
    text(note.source ?? '(omitted)', 376, 705, 39, missing ? C.yellow : C.blue, 'left', 'mono');
  });
  focus('lookup-slot', () => {
    text('Look up the recorded HTTP status', 1040, 442, 35);
    text('Last key used', 1040, 534, 29, C.muted);
    text(attempts === 0 ? '?' : (lastKey ?? '(missing)'), 1304, 534, 36, C.ink, 'left', 'mono');
    rule(1040, 575, 1760, 575, C.muted);
    text(
      record
        ? record.path + '    HTTP ' + record.status
        : attempts
          ? 'Cannot resolve a record'
          : 'Awaiting lookup',
      1040,
      677,
      41,
      record ? C.green : C.muted,
    );
  });
  text('Lookup attempts   ' + attempts, 150, 902, 31, C.muted);
  text(
    record
      ? 'Next check    /    Inspect the failing callback dependency.'
      : attempts
        ? missing
          ? 'Unresolved    /    Recover the missing source ID.'
          : 'Source ID recovered    /    Repeat the lookup.'
        : 'Could you recover the exact status from this note?',
    150,
    988,
    42,
    record ? C.green : C.yellow,
  );
}

export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: ['note-shorten', 'note-read', 'note-pin', 'note-reread'],
};
