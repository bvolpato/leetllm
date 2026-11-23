import { assertEqual, moveTo, place } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { applyNoteEvent, observeNoteReceipt } from '../../../films/gui-agent-loop/model.mjs';
import { NOTE_REQUEST } from '../../../films/gui-agent-loop/fixtures.mjs';
import { MAIN, footer } from '../parts.mjs';
import { button, outline } from '../inspection-desk.mjs';

export default function verify(s, c) {
  const empty = { pending: [], queued: [] };
  const first = applyNoteEvent(empty, 'submit');
  const repeated = applyNoteEvent(first, 'submit', { ...NOTE_REQUEST, id: 'N-2' });
  const duplicate = applyNoteEvent(applyNoteEvent(repeated, 'process'), 'process');
  const waited = applyNoteEvent(first, 'process');
  const receipt = observeNoteReceipt({
    requestId: NOTE_REQUEST.id,
    status: 'queued',
    queuedCount: waited.queued.length,
  });
  assertEqual(duplicate.queued.length, 2, 'two independently accepted submissions');
  assertEqual(waited.queued.length, 1, 'one submission then a read');
  assertEqual(receipt, 'queued', 'receipt for the first request');

  const [screen, branches] = MAIN.rows([1, 3.8], 'wide');
  const [page, field, submit] = screen.inset('tight').columns([1, 1.6, 0.8], 'normal');
  const [a, b] = branches.columns(2, 'wide');
  const tracks = [a, b].map((r) => {
    const [name, pending, stored, tally] = r.inset('normal').rows([0.9, 1.3, 1.3, 0.9], 'normal');
    const lane = (region, name) => {
      const [title, left, right] = region.columns([1.25, 1, 1], 'tight');
      return {
        title: place(note(name, { color: 'dim', size: 31 }), title, 'left'),
        slots: [left, right],
      };
    };
    return {
      frame: outline(r, 'dim'),
      name,
      pending: lane(pending, 'Pending'),
      stored: lane(stored, 'Queued notes'),
      tally,
    };
  });
  const slip = (id, region) => button(region, id, 'cyan');
  const common = tracks.map((r) => slip(first.pending[0].id, r.pending.slots[0]));
  const second = slip(repeated.pending[1].id, tracks[0].pending.slots[1]);
  const enterStore = (node, side, slot) =>
    moveTo(node, tracks[side].stored.slots[slot].point('center'), { duration: 0.65 });
  const branchTitle = (index, name, color) =>
    place(label(name, { color, size: 42 }), tracks[index].name, 'left');
  const repeats = branchTitle(0, 'Click Submit again', 'ink');
  const inspect = branchTitle(1, 'Wait and inspect', 'ink');
  const sent = footer('Host sent Submit once', 'blue');
  const prompt = footer('Same form after Submit. Send it again?', 'yellow');
  const unknown = footer('Host record   ·   input sent   ·   outcome unknown', 'yellow');
  const totals = [duplicate, waited].map((state, i) =>
    place(
      mono('Notes queued   ' + state.queued.length, { size: 38, color: i ? 'green' : 'pink' }),
      tracks[i].tally,
      'left',
    ),
  );
  const confirm = footer('Host receipt   ·   ' + NOTE_REQUEST.id + '   ·   ' + receipt, 'green');
  const compactForm = [
    outline(screen, 'blue'),
    place(note('Incident form', { color: 'blue' }), page, 'left'),
    place(label(NOTE_REQUEST.text, { size: 42 }), field, 'left'),
    button(submit, 'Submit'),
  ];
  const form = MAIN.inset('wide');
  const [title, editor, controls] = form.inset('wide').rows([0.7, 2, 1], 'wide');
  const [submitArea] = controls.columns([1, 3], 'normal');
  const fullForm = [
    outline(form, 'blue'),
    place(label('Incident note', { size: 50 }), title, 'left'),
    outline(editor, 'dim'),
    place(mono(NOTE_REQUEST.text, { size: 52 }), editor.inset('wide'), 'top left'),
    button(submitArea, 'Submit'),
  ];
  s.add(heading(c.title), fullForm);
  c.show('first', sent);
  c.swap('question', sent, prompt);
  c.swap('unknown', prompt, unknown, { after: true });
  c.swap('pending', fullForm, [
    compactForm,
    ...tracks.map((r) => [r.frame, r.pending.title, r.stored.title]),
    common,
  ]);
  c.show('retry', repeats);
  c.show('second', second, { after: true });
  c.on('process-two', () => s.play(enterStore(common[0], 0, 0), enterStore(second, 0, 1)));
  c.show('two-notes', totals[0], { after: true });
  c.show('inspect', inspect);
  c.on('process-one', () => s.play(enterStore(common[1], 1, 0)));
  c.show('one-note', totals[1], { after: true });
  c.swap('receipt', unknown, confirm, { after: true });
  c.swap(
    'deadline',
    confirm,
    footer('Posting unconfirmed at deadline   ·   hand off ' + NOTE_REQUEST.id, 'yellow'),
  );
}
