import {
  C,
  arrow,
  badge,
  block,
  circle,
  foot,
  gradient,
  header,
  keyCradle,
  lerp,
  line,
  mono,
  paint,
  paper,
  plate,
  poly,
  rail,
  serif,
  smooth,
  type,
} from './workshop.mjs';
import {
  admit,
  altered,
  approvedEvidence,
  clauses,
  evidence,
  extra,
  inspectProposal,
  lab,
  lookup,
  policyId,
  prefix,
  restore,
  saved,
} from './mechanism.mjs';

export function reply(c, at) {
  const moving = smooth(at(0, 'Send that reply', 0.85)),
    arrival = smooth(at(1, 'The reply reaches', 0.78));
  header(c, 'Will the reply turn the key?', saved.ticket);
  plate(c, 38, 109, 554, 322, { dark: true });
  mono(c, 'REVIEW INBOX', 62, 142, 15, { color: C.chalk });
  paint(c, 69, 362, 492, 18, '#0b282b', 5, '#809386');
  const y = 155 + moving * 12 + arrival * 35;
  paper(c, 81, y, 466, 205);
  mono(c, 'POLICY REPLY  /  ' + saved.ticket, 105, y + 29, 15, { color: C.muted });
  line(c, 105, y + 40, 516, y + 40, '#c7c4b2');
  block(c, clauses.join(' '), 105, y + 67, 405, 19, 24);
  mono(c, policyId, 105, y + 150, 16, { color: C.teal });
  paint(c, 67, 377, 499, 49, C.pine);
  line(c, 69, 377, 560, 377, '#cbccaa', 3);
  type(c, arrival >= 1 ? 'In review' : 'Send for review', 310, 408, 19, {
    align: 'center',
    color: C.paper,
  });
  keyCradle(c, 627, 109, 294, 322);
  foot(
    c,
    arrival >= 1
      ? 'Reply received for review    ·    Restore requests  0'
      : 'What does the policy say about a disabled production API key?',
  );
}

export function intake(c, at) {
  const trusted = at(1, 'The host obtains'),
    admitted = at(1, 'The routine ticket admits');
  const comparing = at(2, 'Now run'),
    urgent = at(2, 'The urgent route'),
    stale = at(2, 'The old bundle stops');
  header(c, 'Who issued the receipt?', 'Intake');
  if (!comparing) {
    const t = lab.tickets[0];
    plate(c, 42, 117, 282, 296, { dark: true });
    mono(c, 'INTAKE SOURCE', 63, 152, 15, { color: C.sea });
    const name = trusted ? 'Host service' : 'Caller text';
    serif(c, name, 64, 222, 31, { color: C.paper });
    type(c, trusted ? 'Host-owned fixture' : 'Self-reported fields', 64, 257, 17, {
      color: C.chalk,
      max: 236,
    });
    line(c, 66, 278, 295, 278, '#68887b');
    type(c, trusted ? 'Ticket and principal bound' : 'Origin unverified', 64, 321, 17, {
      color: C.cream,
      max: 237,
    });
    arrow(c, 326, 266, 386, 266, trusted ? C.teal : C.copper);
    paper(c, 389, 111, 522, 306);
    mono(c, trusted ? 'HOST-OWNED RECEIPT' : 'REQUEST TEXT', 414, 149, 16, {
      color: trusted ? C.teal : C.copper,
    });
    for (const [i, [label, value]] of [
      ['Ticket', t.ticket_id],
      ['Principal', trusted ? t.principal : 'unverified'],
      ['Bundle', t.bundle_version],
      ['Route', t.route],
      ['Read grant', trusted ? lab.grants.join(', ') : 'unverified'],
    ].entries()) {
      const y = 182 + i * 39;
      type(c, label, 417, y, 16, { color: C.muted });
      mono(c, value, 552, y, 18);
      line(c, 417, y + 10, 877, y + 10, '#d9d6c5');
    }
    if (admitted) badge(c, admit(t), 675, 365, 203);
    foot(
      c,
      admitted
        ? 'Planning may begin for this ticket and account.'
        : 'Where did these fields come from?',
    );
  } else {
    lab.tickets.forEach((t, i) => {
      const x = 42 + i * 297,
        y = 129,
        done = [admitted, urgent, stale][i];
      paper(c, x, y, 278, 262);
      paint(c, x, y, 278, 43, i === 0 ? C.pine : '#545e59');
      mono(c, t.ticket_id, x + 19, y + 29, 22, { color: C.paper });
      mono(c, t.bundle_version, x + 17, y + 79, 16);
      mono(c, t.route, x + 17, y + 111, 16);
      line(c, x + 17, y + 128, x + 260, y + 128, C.rule);
      if (done) {
        badge(c, admit(t), x + 18, y + 149, 238, i === 0 ? 'good' : 'bad', 18);
        type(
          c,
          i === 0
            ? 'Account grant  ' + t.account_id
            : 'Planner steps  ' + lab.report.rows[i - 1].actions.length,
          x + 19,
          y + 225,
          20,
        );
      } else {
        type(c, 'Awaiting intake check', x + 18, y + 172, 17, { color: C.muted });
      }
    });
    foot(
      c,
      stale ? 'Only the routine ticket enters planning.' : 'Which tickets can reach the planner?',
    );
  }
}

function policyBook(c) {
  poly(
    c,
    [
      [43, 136],
      [63, 129],
      [437, 129],
      [447, 137],
      [447, 412],
      [50, 412],
    ],
    '#264e48',
  );
  paper(c, 60, 119, 376, 282, '#fcf2d5');
  for (let i = 0; i < 3; i++) line(c, 70 + i * 3, 127, 70 + i * 3, 393, '#c1ad80');
  mono(c, 'REVIEWED POLICY', 88, 153, 14, { color: C.copper });
  let y = block(c, clauses[0], 88, 196, 320, 22, 26);
  y = block(c, clauses[1], 88, y + 7, 322, 22, 26);
  mono(c, policyId, 88, 379, 15, { color: C.teal });
}
export function observations(c, at) {
  const changed = at(0, 'Someone changes'),
    reject = at(1, 'Reject the changed answer');
  const rerun = at(2, 'Run the original question'),
    unsupported = at(3, 'For a question');
  header(
    c,
    rerun ? 'What has the host observed?' : 'What can go into the draft?',
    rerun ? 'Planner loop' : 'Policy evidence',
  );
  if (!rerun) {
    policyBook(c);
    arrow(c, 453, 259, 494, 259, C.copper);
    paper(c, 502, 118, 414, 288);
    mono(c, changed ? 'PROPOSED RESPONSE' : 'REVIEWED RESPONSE', 524, 152, 14, { color: C.muted });
    const text = changed ? altered.answer : evidence.answer;
    const end = block(c, text, 525, 196, 364, 22, 27);
    mono(c, policyId, 525, end + 4, 15, { color: C.teal });
    if (changed)
      mono(c, 'Source SHA  ' + prefix(evidence.policy_hash), 525, end + 30, 15, { color: C.muted });
    if (reject)
      badge(c, approvedEvidence(altered) ? 'Accepted' : 'Answer mismatch', 526, 360, 218, 'bad');
    foot(
      c,
      reject
        ? 'Compare status, answer, citation, question and policy hash.'
        : 'Does the citation support the wording on the right?',
    );
  } else {
    const n = unsupported
      ? Number(at(3, 'the policy tool abstains')) + Number(at(3, 'The host hands off'))
      : Number(at(2, 'The policy tool returns')) +
        Number(at(2, 'Account lookup returns')) +
        Number(at(2, 'Now the host can draft')) +
        Number(at(2, 'The fourth action'));
    const labels = unsupported
      ? ['Policy evidence', 'Human review']
      : ['Policy evidence', 'Account lookup', 'Cited draft', 'Review stop'];
    plate(c, 41, 112, 877, 92);
    rail(c, labels, n - 1, 145, 147, 665);
    paper(c, 60, 224, 841, 190);
    mono(
      c,
      unsupported
        ? 'NEW QUESTION  /  OUTSIDE REVIEWED FIXTURE'
        : 'HOST OBSERVATIONS  /  ' + saved.ticket,
      84,
      257,
      16,
      { color: C.muted },
    );
    if (unsupported) {
      serif(
        c,
        n ? 'Policy tool returned abstain.' : 'Is there reviewed evidence for this question?',
        85,
        310,
        28,
      );
      if (n === 2) {
        badge(c, 'Handed to reviewer', 85, 341, 243);
        type(c, 'Drafts  0', 368, 364, 23);
      }
    } else {
      if (n >= 1) {
        type(c, 'Policy', 85, 302, 17, { color: C.muted });
        mono(c, policyId, 160, 302, 18);
      }
      if (n >= 2) {
        type(c, 'Account', 85, 339, 17, { color: C.muted });
        mono(c, saved.account + '  /  ' + saved.scope, 160, 339, 18);
      }
      if (n >= 3) {
        line(c, 418, 270, 418, 392, C.rule);
        mono(c, 'DRAFT EXCERPT', 442, 283, 13, { color: C.muted });
        block(c, clauses[1], 442, 311, 422, 22, 26);
        mono(c, policyId, 442, 382, 16, { color: C.teal });
      }
      if (!n) serif(c, 'Waiting for tool observations', 85, 327, 26);
    }
    foot(
      c,
      unsupported
        ? 'Planner reads a copy. The host owns the observations and the dispatch decision.'
        : n === 4
          ? 'The review stop leaves the production key disabled.'
          : 'Drafting requires the reviewed response and the admitted account.',
    );
  }
}

export function dispatch(c, at) {
  const blocked = at(1, 'The resource check blocks'),
    next = at(2, 'Back at the draft');
  const rejected = at(2, 'The envelope check rejects'),
    write = at(2, 'Now inspect'),
    stopped = at(2, 'The tool check blocks');
  const counted = at(2, 'returns zero');
  header(c, 'Which proposal reaches a tool?', saved.ticket);
  if (!next) {
    paper(c, 42, 116, 391, 270);
    mono(c, 'PROPOSAL', 66, 151, 15, { color: C.copper });
    serif(c, lookup.action, 66, 209, 32);
    mono(c, 'account_id', 66, 270, 17, { color: C.muted });
    mono(c, lookup.args.account_id, 66, 323, 33);
    plate(c, 507, 116, 411, 270, { dark: true });
    mono(c, 'HOST GRANT', 535, 151, 15, { color: C.sea });
    serif(c, lab.tickets[0].principal, 535, 208, 32, { color: C.paper });
    mono(c, 'account_id', 536, 271, 17, { color: C.sea });
    mono(c, saved.account, 536, 324, 33, { color: C.paper });
    line(c, 210, 313, 490, 313, blocked ? C.red : C.brass, 3);
    if (blocked) {
      line(c, 479, 299, 496, 326, C.red, 4);
      line(c, 496, 299, 479, 326, C.red, 4);
    }
    foot(
      c,
      blocked
        ? inspectProposal(lookup) + '    ·    Read blocked before dispatch'
        : 'Allowed tool    ·    Correct schema    ·    Check the resource',
    );
  } else {
    const proposed = write ? restore : extra;
    paper(c, 42, 118, 416, 294);
    mono(c, 'PLANNER ENVELOPE', 65, 157, 15, { color: C.muted });
    type(c, 'action', 66, 207, 17, { color: C.muted });
    mono(c, proposed.action, 155, 207, 20);
    type(c, 'args', 66, 250, 17, { color: C.muted });
    mono(c, write ? 'scope = prod-api' : '{ }', 155, 250, 18);
    if (!write) {
      paint(c, 65, 271, 366, 42, '#f0d8b9');
      mono(c, 'approved = True', 79, 300, 20);
    }
    const decided = write ? stopped : rejected;
    if (decided) badge(c, inspectProposal(proposed), 65, 347, 267, 'bad', 18);
    plate(c, 493, 118, 426, 294, { dark: true });
    mono(c, 'ATTEMPT TRACE', 517, 157, 15, { color: C.sea });
    type(c, write ? 'Proposed restore' : 'Proposed draft', 519, 212, 25, { color: C.paper });
    if (decided) mono(c, 'executed = False', 519, 264, 22, { color: C.cream });
    if (counted) {
      line(c, 518, 292, 894, 292, '#68948a');
      type(c, 'SQLite effects', 520, 348, 21, { color: C.paper });
      serif(c, lab.report.rows[4].restore_count, 870, 355, 44, { color: C.paper, align: 'right' });
    }
    foot(
      c,
      write
        ? 'The trace records the proposal. The effects table records committed writes.'
        : 'The host accepts two envelope fields, action and args.',
    );
  }
}
