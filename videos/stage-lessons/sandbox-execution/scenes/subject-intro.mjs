import { codeBlock, column, indicate, moveTo, place, recolor } from 'vizmatic/stage';
import { repairTrace } from '../../../films/sandbox-execution/model.mjs';
import { area, chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { CASES, COLOR, wall } from '../parts.mjs';

export default function subjectIntro(s, c) {
  const first = CASES[0];
  const [page, bench] = area.inset('none', 'normal').rows([5, 3], 'wide');
  const [fileBox, codeBox] = page.columns([6, 5], 'loose');
  const [permissionsBox, agentBox] = bench.columns([6, 5], 'loose');
  const xml = codeBlock(
    [
      `<testcase classname="${first.className}"`,
      `          name="${first.name}">`,
      `  <${first.children[0]}/>`,
      '</testcase>',
    ].join('\n'),
    { language: 'plain', size: 40 },
  );
  const file = wall(fileBox, 'report.xml  /  read-only input', { color: COLOR.evidence });
  place(xml, fileBox.inset('normal', 'normal'), 'left');
  const worker = wall(codeBox, 'sandbox worker  /  parse.py');
  const [expressionBand, answerBand] = codeBox.inset('wide', 'wide').rows(2, 'normal');
  const lookup = place(mono('case.attrib["status"]', { size: 46 }), expressionBand, 'left');
  const ask = place(
    label('What will the lookup return?', { size: 40, color: COLOR.mark }),
    answerBand,
  );
  const error = place(
    chip(repairTrace().first.error, { font: 'mono', size: 40, color: COLOR.fail }),
    answerBand,
  );

  const permissions = wall(permissionsBox, 'worker permissions', { color: COLOR.host });
  const grant = mono('read    report.xml', { size: 38, color: COLOR.evidence });
  const limits = note('Host credentials: none     Network: closed', { color: COLOR.host });
  const cleanup = note('Check cleanup before reuse', { color: COLOR.mark });
  place(
    column([grant, limits, cleanup], { align: 'left', gap: 'normal' }),
    permissionsBox.inset('wide', 'normal'),
    'left',
  );

  const receiver = wall(agentBox, 'agent', { color: COLOR.evidence });
  const [receiptBand, repairBand] = agentBox.inset('wide', 'normal').rows(2, 'normal');
  const pending = place(note('Waiting for bounded output'), receiptBand);
  const repair = place(label('Read the direct children', { size: 41 }), repairBand);
  const focus = (glyphs, color) =>
    s.play(...glyphs.map((g) => recolor(g, color, { duration: 0.3 })));

  s.add(heading(c.title), file, xml, worker, lookup, permissions, grant, limits, receiver, pending);
  c.on('intro-report', () =>
    s.play(indicate(grant, { color: COLOR.mark, scale: 1, duration: 0.75 })),
  );
  c.on('intro-lookup', () =>
    s.play(indicate(lookup, { color: COLOR.mark, scale: 1, duration: 0.8 })),
  );
  c.show('intro-predict', ask);
  c.swap('intro-error', ask, error, { after: true });
  c.on('intro-class', () => focus(xml.find(`classname="${first.className}"`, 0), COLOR.evidence));
  c.on('intro-name', () => focus(xml.find(`name="${first.name}"`, 1), COLOR.evidence));
  c.hide('intro-output', pending);
  c.on('intro-output', () => s.play(moveTo(error, receiptBand.point(), { duration: 1.1 })));
  c.on('intro-child', () => focus(xml.find(`<${first.children[0]}/>`, 2), COLOR.mark));
  c.show('intro-clue', repair);
  c.on('intro-host', () =>
    s.play(indicate(limits, { color: COLOR.mark, scale: 1, duration: 0.8 })),
  );
  c.show('intro-next', cleanup);
}
