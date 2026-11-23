import { group, indicate, line, linear, moveTo, place, polygon, polyline } from 'vizmatic/stage';
import { chip, heading, label } from '../../kit-narrated.mjs';
import { carryIdentity, CORPUS, evidenceFrame } from '../parts.mjs';

export default function subjectIntro(s, c) {
  const f = evidenceFrame(c, { page: false });
  const [reply, link, page] = f.body.columns([5, 2, 5], 'normal');
  const session = CORPUS.find((record) => record.id === 'eu-session-v1');
  const [subject, clock] = session.text.split(' expire after ');
  const [duration, condition] = clock.split(' of ');
  const y = reply.cy;
  const top = y - 238,
    bottom = y + 238;
  const bubble = polygon(
    [
      [reply.left, top],
      [reply.right, top],
      [reply.right, bottom],
      [reply.left + 120, bottom],
      [reply.left + 58, bottom + 45],
      [reply.left + 58, bottom],
      [reply.left, bottom],
    ],
    { fill: 'surface', stroke: 'blue', width: 4 },
  );
  const replyTitle = label('Assistant draft', { size: 38, color: 'blue' }).moveTo([
    reply.cx,
    top + 72,
  ]);
  const amount = label(duration, { size: 122 }).moveTo([reply.cx, y - 25]);
  const purpose = label('to rotate a stale key automatically', { size: 40 }).moveTo([
    reply.cx,
    y + 112,
  ]);

  const fold = 65;
  const paper = polygon(
    [
      [page.left, top],
      [page.right - fold, top],
      [page.right, top + fold],
      [page.right, bottom],
      [page.left, bottom],
    ],
    { fill: 'surface', stroke: 'cyan', width: 4 },
  );
  const corner = polyline(
    [
      [page.right - fold, top],
      [page.right - fold, top + fold],
      [page.right, top + fold],
    ],
    { stroke: 'cyan', width: 4 },
  );
  const pageTitle = label('Cited policy', { size: 38, color: 'cyan' }).moveTo([page.cx, top + 72]);
  const unread = group(
    ...[0.78, 0.93, 0.6].map((fraction, i) =>
      line(
        [page.left + 66, y - 47 + i * 69],
        [page.left + (page.width - 40) * fraction, y - 47 + i * 69],
        { stroke: 'dim', width: 8 },
      ),
    ),
  );
  const sourceSubject = label(subject, { size: 52 }).moveTo([page.cx, y - 58]);
  const verb = label('expire after', { size: 37 }).moveTo([page.cx, y + 5]);
  const sourceAmount = label(duration, { size: 72 }).moveTo([page.cx, y + 85]);
  const sourceCondition = label('of ' + condition, { size: 39 }).moveTo([page.cx, y + 164]);
  const excerpt = [sourceSubject, verb, sourceAmount, sourceCondition];

  const rail = line([reply.right, y], [page.left, y], { stroke: 'cyan', width: 4 });
  const citation = place(chip('[E1]', { size: 42, color: 'cyan' }), link, 'left');
  const opening = [
    heading(c.title),
    bubble,
    replyTitle,
    amount,
    purpose,
    rail,
    paper,
    corner,
    pageTitle,
    unread,
    citation,
  ];
  s.add(opening);
  for (const node of opening) node.opacity(1);
  s.play(moveTo(citation, [page.left - citation.bounds().width / 2, y]), {
    duration: c.cue('open').end - c.window.from,
    ease: linear,
  });
  c.swap('open', unread, excerpt, { after: true, lead: 0 });
  c.on('shared-number', () =>
    s.play(indicate([amount, sourceAmount], { color: 'yellow', scale: 1 })),
  );
  const question = place(
    label('What expires after 30 days?', { size: 49, color: 'yellow' }),
    f.foot,
  );
  c.show('which-clock', question);
  c.on('session-clock', () => s.play(indicate(sourceSubject, { color: 'pink', scale: 1 })));
  const hold = place(label('Hold the draft', { size: 49, color: 'yellow' }), f.foot);
  c.swap('hold-reply', question, hold, { after: true, lead: 0 });
  c.on('key-clock', () => s.play(indicate(purpose, { color: 'blue', scale: 1 })));
  const search = place(
    label('Search for the current EU key policy', { size: 49, color: 'cyan' }),
    f.foot,
  );
  c.swap('retrieve', hold, search);
  c.show('retrieve', f.identity);
  c.clear([rail], 0.8, 0.2);
  carryIdentity(c, f);
}
