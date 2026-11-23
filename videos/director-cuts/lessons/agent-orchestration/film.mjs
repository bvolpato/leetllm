import assert from 'node:assert/strict';
import { digest } from '../../../films/agent-orchestration/arithmetic.mjs';
import { REQUEST, values } from '../../../films/agent-orchestration/fixtures.mjs';
import { canWrite, merge, proposal } from '../../../films/agent-orchestration/model.mjs';

const title = 'Can Vega send this release for review?';
const beats = [
  {
    id: 'one-question',
    say: 'How many requests failed? Vega needs one number from the health specialist before it can propose moving a quarter of the players. Watch who gets the answer.',
    hold: 1.0,
  },
  {
    id: 'answer',
    say: 'Four errors in ten thousand requests. Vega gets the number back and keeps the conversation with the operator. That round trip was a tool call.',
    hold: 0.7,
  },
  {
    id: 'the-title-screen',
    say: 'All three checks passed. Each strip shows the title screen from the build that worker checked. Would you send this batch for review?',
    hold: 2.8,
  },
  {
    id: 'the-seams',
    say: 'Look where the ears landed, halfway down the fox’s back. Health read revision four. Evaluation and policy read three. The join rejects the mixed revisions.',
    hold: 1.6,
  },
  {
    id: 'the-target',
    say: 'Which build should they use? Vega looks up the target in the release service. The current revision is four. Which two strips need replacing?',
    hold: 2.1,
  },
  {
    id: 'two-new-reads',
    say: 'Health already checked four. Evaluation runs again on four. So does policy. Watch the fox come together around the strip we kept.',
    hold: 1.2,
  },
  {
    id: 'one-build',
    say: 'The join checks all three results again. Each belongs to this request and revision, is still fresh, and matches its trusted source. This batch can go to the reviewer.',
    hold: 0.9,
  },
  {
    id: 'for-review',
    say: 'Live traffic is still at zero. To move those players, the writer needs approval for this exact proposal. It checks live state again before it acts.',
    hold: 2.6,
  },
];

// The game is fictional. Its release checks and decision use the course fixture.
const branchNames = ['Evaluation', 'Health', 'Policy'];
const live = { version: 4, traffic: 0 };
const target = { ...REQUEST, version: live.version };

function read(branch, version, time) {
  const value = values[branch];
  return { ...REQUEST, version, branch, time, value, digest: digest(value) };
}

const incoming = [read('eval', 3, 988), read('health', 4, 990), read('policy', 3, 989)];
const refreshed = incoming.map(row =>
  row.version === live.version ? row : read(row.branch, live.version, 998),
);
const packet = proposal(refreshed, target);
const pass = [
  values.eval.failures / values.eval.cases <= 0.03,
  values.health.errors / values.health.requests <= 0.001,
  target.traffic <= values.policy.maxTraffic,
];
const observations = [
  `${values.eval.failures} / ${values.eval.cases} failures`,
  `${values.health.errors} / ${values.health.requests.toLocaleString('en-US')} errors`,
  `${values.policy.maxTraffic}% limit`,
];

const W = 120;
const H = 60;
const fur = '#e65a21', light = '#ff9b46', dark = '#a93325', foot = '#432846';
const cream = '#fff0cd', white = '#fff8e6', nose = '#30213e';

// Both title screens are tiny indexed-color landscapes. A receipt's revision
// selects the source image from which its horizontal band is sampled.
function titleScreen(version) {
  const pixels = Array.from({ length: H }, () => Array(W));
  function box(color, x, y, w = 1, h = 1) {
    for (let j = Math.max(0, y); j < Math.min(H, y + h); j++)
      for (let i = Math.max(0, x); i < Math.min(W, x + w); i++) pixels[j][i] = color;
  }
  function poly(color, points) {
    const minY = Math.max(0, Math.min(...points.map(p => p[1])));
    const maxY = Math.min(H, Math.max(...points.map(p => p[1])));
    for (let y = minY; y < maxY; y++) {
      const xs = [];
      for (let i = 0; i < points.length; i++) {
        const [ax, ay] = points[i], [bx, by] = points[(i + 1) % points.length];
        if ((ay > y + 0.5) !== (by > y + 0.5))
          xs.push(ax + (bx - ax) * (y + 0.5 - ay) / (by - ay));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const x = Math.ceil(xs[k] - 0.5);
        box(color, x, y, Math.ceil(xs[k + 1] - 0.5) - x);
      }
    }
  }

  box('#bdc1e1', 0, 0, W, H);
  box('#d1cbe0', 0, 13, W, 26);
  box('#e0cfda', 0, 23, W, 14);
  poly('#fff0cf', [[90,2],[94,2],[97,5],[97,9],[94,12],[90,12],[87,9],[87,5]]);
  poly('#acaacb', [[0,29],[15,22],[26,27],[43,17],[62,28],[81,23],[92,21],[109,26],[120,20],[120,45],[0,45]]);
  poly('#8e91b2', [[0,33],[16,29],[31,32],[55,24],[65,29],[82,32],[107,24],[120,28],[120,45],[0,45]]);
  poly('#727f9b', [[0,38],[16,34],[27,35],[50,31],[64,33],[78,35],[99,30],[120,33],[120,46],[0,46]]);
  box('#a9b5a1', 0, 41, W, 19);
  poly('#bfc8ac', [[0,41],[61,41],[51,43],[74,45],[111,46],[120,49],[61,48],[30,45],[20,44],[0,44]]);
  poly('#798f8b', [[0,48],[19,46],[39,47],[53,50],[82,49],[98,51],[120,47],[120,60],[0,60]]);
  poly('#627b7b', [[0,54],[11,52],[25,54],[45,52],[64,55],[89,53],[113,54],[120,52],[120,60],[0,60]]);
  const shadow = version === 3 ? [31,82] : [42,93];
  poly('#647d7b', [[shadow[0],50],[shadow[0]+8,48],[shadow[1]-7,48],[shadow[1],50],[shadow[1]-11,51],[shadow[0]+6,51]]);

  if (version === 3) {
    // The sitting fox faces left. Its broad tail curls back over its front paws.
    poly(foot, [[45,19],[53,20],[56,26],[63,29],[71,37],[73,45],[69,50],[42,50],[39,47],[39,34],[34,29],[29,27]]);
    poly(fur, [[43,19],[52,18],[55,26],[64,30],[70,37],[71,43],[64,47],[43,47],[39,42],[40,31],[34,28],[29,26]]);
    poly(dark, [[54,27],[61,30],[67,34],[68,39],[57,43],[48,43],[48,39],[53,37],[57,34]]);
    poly(cream, [[36,26],[47,25],[51,28],[48,34],[44,37],[41,40],[40,33]]);
    poly(foot, [[26,20],[34,16],[37,6],[42,13],[51,7],[50,19],[53,22],[47,28],[39,30],[32,26],[24,25]]);
    poly(fur, [[26,21],[35,17],[38,8],[42,15],[49,9],[48,18],[51,22],[47,25],[39,28],[31,25],[25,24]]);
    poly(light, [[29,21],[36,18],[46,18],[49,20],[42,21],[36,23],[29,23]]);
    poly(cream, [[25,23],[33,24],[40,23],[47,22],[42,26],[37,28],[32,26]]);
    box(nose,24,22,3,2); box(nose,34,20,2,2);
    poly(foot, [[69,40],[80,37],[83,32],[86,37],[84,43],[78,47],[65,50],[46,49],[38,47],[32,44],[35,41],[46,43],[56,44]]);
    poly(fur, [[68,40],[80,38],[83,34],[84,38],[82,42],[76,45],[64,48],[49,48],[40,46],[34,44],[36,42],[45,44],[57,45]]);
    poly(light, [[49,45],[61,44],[76,41],[81,38],[78,42],[67,45],[58,46]]);
    poly(cream, [[34,41],[40,42],[46,45],[49,45],[47,48],[40,46],[32,44]]);
  } else {
    // The new build catches the same fox in mid-leap, facing right.
    poly(dark, [[53,27],[49,34],[43,39],[35,40],[25,43],[18,44],[14,42],[24,39],[39,35],[45,28]]);
    poly(foot, [[28,40],[23,43],[18,45],[13,43],[18,41],[22,41]]);
    poly(dark, [[73,28],[80,31],[90,33],[96,38],[100,39],[99,42],[94,41],[88,37],[76,36],[69,32]]);
    poly(foot, [[91,35],[97,38],[101,39],[100,42],[95,41]]);
    poly(foot, [[8,12],[16,15],[23,17],[38,17],[47,21],[51,26],[47,30],[38,27],[26,27],[19,24],[13,22],[9,17]]);
    poly(fur, [[8,12],[17,16],[25,18],[37,17],[46,21],[49,26],[46,28],[37,25],[27,26],[19,23],[13,21]]);
    poly(light, [[16,16],[26,18],[37,18],[42,20],[26,21],[19,19]]);
    poly(white, [[7,11],[13,13],[19,16],[22,17],[20,20],[21,23],[14,21],[10,17]]);
    poly(foot, [[39,26],[46,20],[56,18],[68,18],[79,16],[85,12],[92,12],[96,22],[89,29],[82,30],[73,33],[56,34],[47,31],[42,35],[37,32]]);
    poly(fur, [[39,26],[46,21],[57,19],[68,19],[80,17],[86,13],[91,14],[94,22],[88,27],[80,29],[72,32],[55,33],[47,29],[43,32],[39,31]]);
    poly(light, [[42,25],[47,21],[58,19],[70,19],[79,17],[73,21],[59,22],[49,25]]);
    poly(dark, [[42,28],[51,28],[55,31],[68,30],[72,28],[79,29],[73,32],[57,33],[48,31],[43,33]]);
    poly(cream, [[62,30],[70,28],[77,24],[83,22],[88,24],[86,27],[78,30],[71,32],[57,32]]);
    poly(foot, [[49,26],[53,30],[49,36],[45,39],[39,47],[32,48],[29,47],[34,44],[38,42],[40,36],[44,33],[43,29]]);
    poly(fur, [[48,26],[52,29],[47,35],[44,38],[40,43],[37,43],[41,35],[44,32],[44,29]]);
    poly(foot, [[76,24],[83,26],[85,31],[91,35],[93,43],[96,45],[95,47],[89,45],[87,38],[80,34],[76,32]]);
    poly(fur, [[77,23],[82,25],[84,31],[90,35],[90,39],[87,38],[81,34],[76,31]]);
    poly(foot, [[79,15],[79,5],[87,12],[92,6],[94,15],[99,18],[108,21],[109,24],[100,27],[88,26],[83,23]]);
    poly(fur, [[81,16],[80,7],[87,14],[92,8],[93,16],[99,19],[106,21],[104,24],[97,25],[88,24],[83,21]]);
    poly(dark, [[81,10],[85,14],[82,15]]);
    poly(light, [[86,17],[94,16],[98,19],[103,20],[103,22],[93,21],[88,20]]);
    poly(white, [[83,19],[88,21],[93,22],[104,22],[107,21],[106,24],[99,26],[90,25],[85,22]]);
    box(nose,105,21,4,2); box(nose,94,18,2,2);
  }

  for (const [x,y] of [[3,55],[11,49],[18,57],[53,54],[79,56],[101,52],[113,48],[118,56]]) {
    box('#445f67', x, y-2, 1, 4); box('#445f67', x-1, y-1); box('#445f67', x+1, y-2);
    box('#e7c88e', x, y-3, 1, 1);
  }
  return pixels;
}

const sprites = { 3: titleScreen(3), 4: titleScreen(4) };
// Group adjacent pixels of the same color once for playback.
function runsOf(row) {
  const runs = [];
  for (let x = 0; x < row.length;) {
    const start = x, color = row[x++];
    while (x < row.length && row[x] === color) x++;
    runs.push([start, x - start, color]);
  }
  return runs;
}
const lines = Object.fromEntries(Object.entries(sprites).map(([v, rows]) => [v, rows.map(runsOf)]));
const ink = '#292538', muted = '#625d6d', plum = '#593b7e', page = '#f6f1e7';
const X = 84, Y = 198, P = 10, bandHeight = 20, right = 1350;
const clamp = n => Math.max(0, Math.min(1, n));

function label(ctx, str, x, y, size, { color = ink, weight = 500, font = 'Sans', align = 'left' } = {}) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Lesson ${font}"`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function line(ctx, x, y, x2, y2, color, thickness = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// Wipe in from the left on a pixel boundary, preserving the old source until
// the new read arrives. Keep the framing fixed so a torn silhouette is visible.
function band(ctx, version, i, progress = 1) {
  const width = Math.round(W * clamp(progress));
  if (!width) return;
  for (let y = i * bandHeight; y < (i + 1) * bandHeight; y++) {
    for (const [x, count, color] of lines[version][y]) {
      if (x >= width) break;
      ctx.fillStyle = color;
      ctx.fillRect(X+x*P, Y+y*P, Math.min(count, width-x)*P, P);
    }
  }
}

function cue(clock, beat, phrase, span) {
  if (clock.index < beat) return 0;
  if (clock.index > beat) return 1;
  return clock.reveal(phrase, span);
}

function labelRow(ctx, i, version, fraction, showPass) {
  const top = Y + i * bandHeight * P;
  const center = top + 110;
  line(ctx, X+W*P+10, center-9, right-22, center-9, '#a69aa4');
  label(ctx, branchNames[i], right, center-12, 47, {weight: 600});
  if (version) {
    label(ctx, observations[i], right, center+42, 36, {font:'Mono', color:muted});
    label(ctx, 'v'+version, 1828, center-12, 64, {weight:700, font:'Mono', color:plum, align:'right'});
    if (showPass && pass[i]) {
      ctx.strokeStyle = '#316858'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(1790,center+26); ctx.lineTo(1801,center+37); ctx.lineTo(1825,center+12); ctx.stroke();
    }
  } else {
    label(ctx, fraction > 0 ? 'Reading…' : 'Waiting', right, center+42, 36, {color:muted});
  }
}

function draw(ctx, clock) {
  ctx.fillStyle = page;
  ctx.fillRect(0, 0, 1920, 1080);
  const {index, elapsed} = clock;
  const asked = cue(clock, 0, 'How many requests failed', 0.5);
  const returned = cue(clock, 1, 'Four errors', 1.15);
  const tool = cue(clock, 1, 'tool call', 0.3);
  const rejected = cue(clock, 3, 'Look where', 0.4);
  const verifiedTarget = cue(clock, 4, 'four', 0.45);
  const newEval = cue(clock, 5, 'Evaluation runs again', 1.25);
  const newPolicy = cue(clock, 5, 'So does policy', 1.25);
  const validating = cue(clock, 6, 'checks all three', 0.4);
  const ready = cue(clock, 6, 'can go to the reviewer', 0.7);

  label(ctx, 'Fox Run', X, 132, 92, {font:'Serif', weight:600});
  label(ctx, 'Release 17', X+389, 128, 48, {color:muted});
  if (verifiedTarget) {
    ctx.save();
    ctx.globalAlpha = verifiedTarget;
    label(ctx, 'Release service', right, 88, 36, {color:muted});
    label(ctx, 'Target', right, 149, 52, {weight:600, color:plum});
    label(ctx, 'v'+target.version, 1828, 149, 64, {weight:700, font:'Mono', color:plum, align:'right'});
    ctx.restore();
  }

  ctx.fillStyle = '#27273d';
  ctx.fillRect(X-6, Y-6, W*P+12, H*P+12);
  for (let i=0; i<3; i++) {
    const arrival = i === 1 ? returned : i === 0 ? 1 : index === 0 ? clamp(0.16+elapsed/1.15) : 1;
    const next = i === 0 ? newEval : i === 2 ? newPolicy : 0;
    const version = next === 1 ? refreshed[i].version : incoming[i].version;
    band(ctx, incoming[i].version, i, arrival);
    if (next > 0) band(ctx, refreshed[i].version, i, next);
    labelRow(ctx, i, arrival === 1 ? version : null, arrival, index >= 2);
  }
  if (returned < 1) {
    ctx.save();
    ctx.beginPath(); ctx.rect(X + Math.round(W*returned)*P, Y+200, W*P*(1-returned), 200); ctx.clip();
    label(ctx, asked ? 'How many errors?' : 'Waiting for health', X+W*P/2, Y+318, 56,
      {font:'Mono', color:'#ffebcf', align:'center'});
    ctx.restore();
  }
  // Two fine breaks persist in the failed composite, then disappear when the
  // newly read bands line up. All three result labels stay in place.
  if (ready < 1) {
    ctx.save(); ctx.globalAlpha = (1-ready)*0.64;
    for (const y of [Y+200,Y+400]) line(ctx, X, y, X+W*P, y, '#f7f3e8', 3);
    ctx.restore();
  }

  const under = Y + H*P + 93;
  let status = 'Vega', color = plum;
  if (index === 0 && asked > 0) status = 'Vega   →   Health';
  if (index === 1) status = tool > 0 ? 'Health   →   Vega     /     Tool call' : 'Health   →   Vega';
  if (index >= 2) status = 'Three results returned';
  if (rejected > 0) { status = 'No proposal'; color = '#a33836'; }
  if (validating > 0) { status = 'Checking results'; color = ink; }
  if (ready > 0) { status = 'Awaiting review'; color = plum; }
  label(ctx, status, X, under, 49, {weight:600, color});
  label(ctx, `${target.traffic}% requested`, right, under-17, 37, {weight:600});
  label(ctx, `${live.traffic}% live`, right, under+39, 48, {weight:600, color:ink});
}

function check() {
  assert.deepEqual(pass, [true,true,true]);
  assert.deepEqual(incoming.map(r => r.version), [3,4,3]);
  assert.throws(() => merge(incoming, 1000, target));
  assert.deepEqual(refreshed.filter((r,i) => r !== incoming[i]).map(r => r.branch), ['eval','policy']);
  assert.equal(incoming[1], refreshed[1]);
  assert(merge(refreshed, 1000, target));
  assert.deepEqual(packet, proposal([...refreshed].reverse(), target));
  assert.equal(packet.version, 4);
  assert.equal(packet.traffic, 25);
  assert.equal(canWrite(null, live.version, packet), false);
  assert.equal(live.traffic, 0);
  const combine = rows => rows.flatMap(({version}, i) => sprites[version].slice(i*bandHeight, (i+1)*bandHeight));
  assert.notDeepEqual(combine(incoming), sprites[3]);
  assert.notDeepEqual(combine(incoming), sprites[4]);
  assert.deepEqual(combine(refreshed), sprites[target.version]);
}

export default { title, beats, draw, check };
