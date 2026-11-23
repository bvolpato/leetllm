import { assertEqual, passage, place } from 'vizmatic/stage';
import { heading, label, note } from '../../kit-narrated.mjs';
import { answerFromEvidence, packParents } from '../../../films/production-retrieval/model.mjs';
import { carryIdentity, evidenceFrame, RULE, RUN } from '../parts.mjs';
import { eligibilityMap } from '../eligibility-map.mjs';

export default function answerFromEvidenceScene(s, c) {
  const f = evidenceFrame(c, { page: false });
  const [plotRoom, notesRoom] = f.body.columns([3, 2], 'loose');
  const [sourceRoom, readingRoom] = notesRoom.rows([3, 1], 'wide');
  const map = eligibilityMap(plotRoom, RULE.requestDays, RULE.requestHours);
  const [rule] = RUN.packed;
  const onlySession = packParents(RUN.hits.filter(({ record }) => record.documentId === 'eu-session'), RUN.caller);
  const explanation = (source, title, color) => place(passage(source.text, {
    width: sourceRoom.width, size: 37, leading: 1.35, title, titleSize: 32, color,
  }), sourceRoom, 'top left');
  const key = explanation(rule, '[' + rule.sourceId + ']  EU key policy', 'cyan');
  const session = explanation(onlySession[0], '[' + onlySession[0].sourceId + ']  Session policy', 'pink');
  const input = (days) => place(label(days + ' days  /  ' + RULE.requestHours + ' hours', {
    size: 48, color: 'yellow',
  }), readingRoom, 'left');
  const decision = (days, evidence, expected) => {
    const answer = answerFromEvidence({
      intent: 'rotation_eligibility', staleDays: days, signalHours: RULE.requestHours,
    }, evidence);
    assertEqual(answer.decision, expected, days + ' days with ' + evidence[0].parentId);
    const cite = answer.cited.length ? '   [' + answer.cited[0] + ']' : '   ·   no key rule in this prompt';
    return place(label(answer.decision + cite, { size: 50, color: 'ink' }), f.foot, 'left');
  };
  const ten = input(RULE.requestDays), fourteen = input(RULE.days), fifteen = input(RULE.outsideDays);
  const yes = decision(RULE.requestDays, RUN.packed, 'eligible');
  const edgeYes = decision(RULE.days, RUN.packed, 'eligible');
  const no = decision(RULE.outsideDays, RUN.packed, 'ineligible');
  const unknown = decision(RULE.outsideDays, onlySession, 'abstain');
  const cornerQuestion = place(note('Does the corner qualify?', { color: 'yellow', size: 40 }), f.foot, 'left');
  const sourceQuestion = place(note('Can the service still give a denial?', { color: 'yellow', size: 40 }), f.foot, 'left');

  s.add(heading(c.title), f.nodes, map.axes, key);
  carryIdentity(c, f);
  c.show('two-ages', [map.point, ten]);
  c.on('key-limit', () => s.play(key.select('up to 14 days')));
  c.show('key-limit', map.limits[1]);
  c.on('signal-limit', () => s.play(key.select('at most 48 hours old')));
  c.show('signal-limit', [map.limits[0], map.limits[2]]);
  c.show('ten-result', yes, { after: true });
  c.hide('to-corner', yes);
  c.on('to-corner', () => s.play(map.move(RULE.days, RULE.hours)));
  c.swap('to-corner', ten, fourteen);
  c.show('corner-question', cornerQuestion);
  c.swap('corner-result', cornerQuestion, edgeYes, { after: true });
  c.hide('one-day-more', edgeYes);
  c.on('one-day-more', () => s.play(map.move(RULE.outsideDays, RULE.hours), key.select('up to 14 days')));
  c.swap('one-day-more', fourteen, fifteen);
  c.show('outside-result', no, { after: true });
  c.hide('only-session', [no, ...map.limits]);
  c.swap('only-session', key, session);
  c.show('source-question', sourceQuestion);
  c.swap('no-rule', sourceQuestion, unknown, { after: true });
}
