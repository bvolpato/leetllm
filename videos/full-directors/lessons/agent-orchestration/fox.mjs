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

// A worker contributes the strip belonging to the build it read. The pixel
// grid and two build portraits come from the approved Fox Run short.
export function paintStrip(ctx, version, strip, x, y, scale, fraction = 1) {
  const end = Math.round(W * Math.max(0, Math.min(1, fraction)));
  for (let row = strip * 20; row < (strip + 1) * 20; row++) {
    for (const [start, length, color] of lines[version][row]) {
      if (start >= end) break;
      ctx.fillStyle = color;
      ctx.fillRect(x + scale * start, y + scale * row, scale * Math.min(length, end - start), scale);
    }
  }
}
