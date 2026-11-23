import { createHash } from 'node:crypto';
import { assertEqual, column, dot, line, place, to } from 'vizmatic/stage';
import { area, chip, heading, label, mono, note } from '../../kit-narrated.mjs';

const version = 'incident-query-rewrite:v1';
function assign(id) {
  const digest = createHash('sha256')
    .update(version + ':' + id)
    .digest();
  const bucket = Number(digest.readBigUInt64BE() % 100n);
  return { id, bucket, arm: bucket < 50 ? 'treatment' : 'control' };
}

export default function randomize(s, c) {
  const first = assign('inc-014');
  const second = assign('inc-001');
  assertEqual(first.bucket, 58, 'control bucket');
  assertEqual(second.bucket, 27, 'treatment bucket');
  const [scope, ruler, records, footer] = area.rows([1, 2, 2.5, 1], 'normal');
  const key = place(mono(version, { size: 40 }), scope);
  const near = ruler.point('left')[0] + 145;
  const far = ruler.point('right')[0] - 145;
  const x = (bucket) => near + ((far - near) * bucket) / 100;
  const y = ruler.point('center')[1];
  const track = [
    line([near, y], [x(50), y], { stroke: 'blue', width: 8 }),
    line([x(50), y], [far, y], { stroke: 'cyan', width: 8 }),
    note('0–49   treatment', { color: 'blue' }).moveTo([x(25), y + 52]),
    note('50–99   control', { color: 'cyan' }).moveTo([x(75), y + 52]),
  ];
  const [treatmentSlot, controlSlot] = records.columns(2, 'wide');
  const card = (packet, slot) =>
    place(
      column(
        [
          mono(packet.id, { size: 48 }),
          chip('Bucket ' + packet.bucket + '   ·   ' + packet.arm, {
            color: packet.arm === 'control' ? 'cyan' : 'blue',
          }),
        ],
        { gap: 'normal' },
      ),
      slot,
    );
  const receipts = [card(first, controlSlot), card(second, treatmentSlot)];
  const mark = (packet) => [
    dot(15, 'yellow').moveTo([x(packet.bucket), y]),
    mono(String(packet.bucket), { size: 42, color: 'yellow' }).moveTo([x(packet.bucket), y - 65]),
  ];
  const firstMark = mark(first);
  const secondMark = mark(second);
  const follow = place(chip('inc-014  ·  follow-up'), footer);
  const destination = controlSlot.point('bottom');
  const mix = place(label('The follow-up already reflects the control answer.'), footer);
  const setting = place(
    label('Check shared staff and shared compute.', { color: 'yellow' }),
    footer,
  );

  s.add(heading(c.title), key, track);
  c.show('first', [firstMark, receipts[0]]);
  c.show('second', [secondMark, receipts[1]]);
  c.show('follow', follow);
  c.on('stored', () => s.play(to(follow, (node) => node.moveTo(destination), { duration: 1 })));
  c.show('mix', mix);
  c.swap('spill', mix, setting);
}
