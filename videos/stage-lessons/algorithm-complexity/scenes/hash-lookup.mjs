import { dot, dynamic, indicate, place, rect } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { PICTURE, FOOT, DOCS, hashKey } from '../parts.mjs';
export default function hash(s, c) {
  const [top, bucketArea, chainArea] = PICTURE.rows([1, 4, 2], 'wide');
  const halves = top.columns([1, 2], 'wide');
  const query = place(mono('issuer-check', { color: 'cyan' }), halves[0]);
  const missQuery = place(mono('missing-login-note', { color: 'cyan', size: 36 }), halves[0]);
  const chainName = place(note('bucket 0 chain'), chainArea, 'top');
  const formula = place(mono('h(key) = Σ character codes mod 8', { size: 36 }), halves[1]);
  const issuer = DOCS.find((doc) => doc.id === 'issuer-check').id;
  const codeSum = [...issuer].reduce((sum, char) => sum + char.codePointAt(0), 0);
  const address = place(
    mono(codeSum + ' mod 8 = ' + hashKey(issuer), { size: 40, color: 'yellow' }),
    halves[1],
  );
  const collision = place(
    mono('controlled collision: h(key) = 0', { size: 36, color: 'pink' }),
    halves[1],
  );
  const buckets = bucketArea.rows(2, 'wide').flatMap((r) => r.columns(4, 'normal'));
  const frames = buckets.map((b, i) =>
    rect(b.width, b.height, { fill: 'surface', stroke: 'blue', width: 2 }).moveTo(
      b.point('center'),
    ),
  );
  const numbers = buckets.map((b, i) =>
    place(mono('bucket ' + i, { size: 34, color: 'dim' }), b, 'top'),
  );
  const keys = DOCS.map((d) => {
    const bucket = hashKey(d.id),
      index = DOCS.slice(0, DOCS.indexOf(d)).filter((other) => hashKey(other.id) === bucket).length;
    const b = buckets[bucket].rows(3, 'none')[index + 1];
    return place(mono(d.id, { size: 34, color: 'cyan' }), b);
  });
  const chainHead = place(note('↓  see chain below', { color: 'pink' }), buckets[0].rows(2)[1]);
  const lanes = chainArea.columns(4, 'wide');
  const chainFrames = lanes.map((b) =>
    rect(b.width, b.height * 0.55, { fill: 'surface', stroke: 'dim', width: 2 }).moveTo([
      b.cx,
      b.cy + b.height * 0.15,
    ]),
  );
  const chainKeys = DOCS.map((d, i) =>
    mono(d.id, { size: 34, color: 'cyan' }).moveTo([
      lanes[i].cx,
      lanes[i].cy + lanes[i].height * 0.15,
    ]),
  );
  const route = s.value(0),
    mix = s.value(0),
    checks = s.value(0);
  const moving = dynamic(() => {
    if (route.value <= 0 || route.value >= 1) return [];
    const a = halves[0].point('bottom'),
      b = buckets[hashKey('issuer-check')].point('center');
    return [
      dot(12, 'yellow').moveTo([
        a[0] + (b[0] - a[0]) * route.value,
        a[1] + (b[1] - a[1]) * route.value,
      ]),
    ];
  });
  const gather = dynamic(() =>
    mix.value > 0 && mix.value < 1
      ? DOCS.map((d, i) => {
          const a = buckets[hashKey(d.id)].point('center'),
            b = [lanes[i].cx, lanes[i].cy + lanes[i].height * 0.15];
          return dot(11, 'cyan').moveTo([
            a[0] + (b[0] - a[0]) * mix.value,
            a[1] + (b[1] - a[1]) * mix.value,
          ]);
        })
      : [],
  );
  const walk = dynamic(() => {
    const compared = Math.floor(checks.value);
    const marks = lanes.slice(0, compared).map((b) => dot(8, 'red').moveTo([b.cx, b.bottom - 10]));
    if (checks.value > 0 && compared < lanes.length) {
      const b = lanes[compared];
      marks.push(dot(11, 'yellow').moveTo([b.cx, b.bottom - 10]));
    }
    return marks;
  });
  const expected = place(label('Expected O(1): useful spread + controlled load'), FOOT);
  const missing = place(label('Compare the query with each stored key'), FOOT);
  const worst = place(label('Worst case: O(n) checks · long keys also cost character work'), FOOT);
  s.add(heading(c.title), query, formula, frames, numbers, keys, moving, gather, walk);
  c.swap('hash-route', formula, address);
  c.on('hash-route', () => s.play(route.to(1), { duration: 1.2 }));
  c.on('hash-equality', () =>
    s.play(indicate(keys[2], { scale: 1, color: 'yellow' }), { duration: 0.7 }),
  );
  c.show('hash-equality', expected, { after: true });
  c.swap('hash-collide', address, collision);
  c.show('hash-collide', chainFrames);
  c.hide('hash-collide', [keys, expected]);
  c.show('hash-collide', chainHead);
  c.on('hash-collide', () => s.play(mix.to(1), { duration: 1.2 }));
  c.show('hash-collide', [chainKeys, chainName], { after: true });
  c.swap('hash-missing', query, missQuery);
  c.show('hash-walk', missing);
  const walkCue = c.cue('hash-walk');
  c.on('hash-walk', () =>
    s.play(checks.to(DOCS.length), { duration: walkCue.end - walkCue.start }),
  );
  c.swap('hash-bound', missing, worst, { after: true });
}
