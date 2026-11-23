import { studio } from './drawing.mjs';
import { check } from './examples.mjs';
import { opening, strings, batch, values, copies, nested, calls } from './objects.mjs';
import { checkout, versions, program, environmentReplay } from './execution.mjs';
import { boundary, decoder, cursor, failures, confidence } from './loading.mjs';
import { floor, testing, perfect, finalFile } from './reports.mjs';

const chapters = [
  [opening, 'Access requests  /  the scored file'],
  [strings, 'Request 102  /  string values'],
  [batch, 'List iteration  /  the decision for each request', true],
  [values, 'Python values  /  types and names'],
  [copies, 'Object references  /  one row in a list', true],
  [nested, 'Object references  /  the tags field', true],
  [calls, 'Function call  /  exact_match'],
  [checkout, 'Project checkout  /  eval/access_requests.jsonl'],
  [versions, 'Project checkout  /  the interpreter and packages'],
  [program, 'Program execution  /  score_access_requests.py', true],
  [boundary, 'Input validation  /  three versions of request 102'],
  [decoder, 'JSON decoder  /  values before field validation'],
  [cursor, 'File handle  /  enumerate(handle, start=1)', true],
  [failures, 'Error handling  /  the scored population'],
  [confidence, 'Schema extension  /  a proposed probability field', true],
  [floor, 'Release criterion  /  exact counts'],
  [testing, 'Parser tests  /  errors and physical lines', true],
  [perfect, 'Fixture audit  /  two perfect reports'],
  [environmentReplay, 'Dependency replay  /  installed packages', true],
  [finalFile, 'Final practice  /  requests 501 through 505'],
];

const captionBreaks = {
  'c04-b03': ['and an index to read a position in a list'],
  'c04-b05': ['would hide a producer error inside a mismatch'],
  'c04-b06': ['only when that conversion makes sense for the field'],
  'c05-b01': ['from request one hundred two'],
  'c05-b03': ['so baseline reads blocked again'],
  'c06-b02': ['so the baseline keeps escalated'],
  'c06-b04': ['collect the ones you want in a new list as you go'],
  'c07-b03': ['can also tell the producer which line to repair'],
  'c08-b02': ['and, on this first setup'],
  'c09-b02': ['creates the project declaration'],
  'c11-b02': ['so the type check tells Python to raise TypeError'],
  'c12-b02': ["so it doesn't add a line number"],
  'c14-b01': ['before this module runs'],
  'c14-b02': ['and raises a ValueError with the line number'],
  'c14-b03': ['the comparison returns False'],
  'c14-b04': ['then follow the calls upward', 'or give the command an intentional exit'],
  'c14-b06': ['at least two thirds of its comparisons right', 'have to reach that comparison'],
  'c14-b07': ['and the seven in its prediction field'],
  'c15-b03': ['because the decoder returned a string', 'and decoded numbers outside the interval'],
  'c15-b04': ['accepts nonstandard NaN and Infinity', 'overflows this float path to infinity'],
  'c16-b05': ['and there has to be at least one row'],
  'c19-b01': ['an extra installed package', 'that the lock agrees with the project'],
  'c19-b03': ['then review the change to the lock'],
  'c19-b04': ['with the interpreter pin and dependency records', 'record which generator it uses and its seed'],
  'c20-b04': ['and will the command pass'],
  'c20-b08': ['as the decisions become an array'],
};

export default {
  title: 'Keep the Wrong Answer in the Score',
  check,
  preparePicture(schedule) {
    for (const entry of schedule) {
      for (const phrase of captionBreaks[entry.beat.id] ?? []) entry.markCaption(phrase);
    }
  },
  draw(ctx, clock) {
    const [paint, section, night] = chapters[clock.beat.chapterIndex];
    ctx.save();
    try {
      paint(studio(ctx, clock, night, section));
    } finally {
      ctx.restore();
    }
  },
};
