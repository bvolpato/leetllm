// The cels share a pixel palette. All coordinates in the artwork are source pixels.
import { createCanvas } from '@napi-rs/canvas';

const feather = {
  ink: '#25324c', shade: '#165474', blue: '#127caa', teal: '#31aebb',
  light: '#8ae5d0', white: '#fff1c9', saffron: '#faac57', rust: '#c65c3d',
  foot: '#9a493c',
};

// Fill at pixel centers so the little thumbnail and the big canvas have identical edges.
function polygon(ctx, color, ...points) {
  const ys = points.map(([, y]) => y);
  ctx.fillStyle = color;
  for (let y = Math.min(...ys); y < Math.max(...ys); y++) {
    const scan = y + 0.5;
    const hits = [];
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[(i + 1) % points.length];
      if ((y1 <= scan && scan < y2) || (y2 <= scan && scan < y1))
        hits.push(x1 + (scan - y1) * (x2 - x1) / (y2 - y1));
    }
    hits.sort((a, b) => a - b);
    for (let i = 0; i + 1 < hits.length; i += 2) {
      const left = Math.ceil(hits[i] - 0.5);
      ctx.fillRect(left, y, Math.ceil(hits[i + 1] - 0.5) - left, 1);
    }
  }
}

function flecks(ctx, color, points, width = 2, height = 1) {
  ctx.fillStyle = color;
  for (const [x, y] of points) ctx.fillRect(x, y, width, height);
}

function perched(ctx) {
  const f = feather;
  const shape = (color, ...points) => polygon(ctx, color, ...points);
  shape(f.ink, [6,52],[15,39],[19,28],[28,19],[31,12],[29,11],[34,7],[31,7],[40,3],[49,4],[55,8],[58,16],[75,19],[74,20],[56,22],[51,32],[48,41],[42,49],[35,53],[25,51],[18,49],[4,57]);
  shape(f.shade, [4,55],[14,38],[28,23],[32,17],[37,21],[32,37],[17,49]);
  shape(f.rust, [27,30],[41,21],[53,21],[51,31],[46,43],[38,50],[32,51],[24,47]);
  shape(f.saffron, [35,28],[48,24],[52,22],[49,36],[42,45],[36,47],[30,42]);
  shape(f.white, [39,25],[51,19],[55,19],[50,28],[45,32],[38,33]);
  shape(f.teal, [13,39],[20,26],[31,17],[40,19],[37,23],[25,29],[19,40],[12,46]);
  shape(f.blue, [8,49],[19,31],[26,25],[36,23],[37,28],[33,37],[22,43]);
  shape(f.shade, [10,49],[20,35],[32,28],[30,34],[21,42]);
  shape(f.blue, [30,15],[34,10],[32,10],[40,5],[48,5],[54,9],[56,15],[48,17],[37,18]);
  shape(f.teal, [33,12],[38,7],[46,5],[51,7],[53,10],[43,9]);
  shape(f.ink, [38,17],[49,13],[55,14],[57,17],[48,19],[41,19]);
  shape(f.rust, [34,20],[44,18],[48,19],[42,23],[35,24]);
  shape(f.white, [31,17],[36,16],[37,19],[34,21],[30,21]);
  shape(f.saffron, [56,19],[71,19],[56,21]);
  flecks(ctx, f.light, [[37,10],[41,7],[47,8],[44,11],[33,13],[19,33],[20,29],[23,26],[15,38]], 2);
  flecks(ctx, f.teal, [[22,33],[26,31],[24,36],[18,38],[19,41],[28,28]]);
  flecks(ctx, f.white, [[51,14]], 1);
  shape(f.foot, [31,50],[34,50],[33,55],[36,56],[29,56]);
  shape(f.foot, [39,48],[42,47],[40,54],[45,55],[38,55]);
}

function lifting(ctx) {
  const f = feather;
  const shape = (color, ...points) => polygon(ctx, color, ...points);
  shape(f.shade, [30,32],[30,17],[34,4],[40,1],[38,13],[41,8],[40,24],[36,34]);
  shape(f.teal, [32,29],[34,11],[38,4],[36,22]);
  shape(f.ink, [2,47],[18,37],[27,30],[38,24],[45,20],[54,21],[59,26],[75,23],[59,30],[50,34],[40,43],[28,46],[18,44],[4,50]);
  shape(f.rust, [20,39],[39,29],[51,28],[48,34],[39,40],[29,44],[21,43]);
  shape(f.saffron, [31,39],[40,31],[50,29],[45,35],[38,39]);
  shape(f.white, [43,29],[54,25],[58,26],[53,31],[45,34]);
  shape(f.blue, [6,46],[21,34],[42,24],[46,21],[53,22],[56,25],[47,26],[35,31],[26,38]);
  shape(f.teal, [12,42],[25,30],[39,25],[43,25],[35,30],[22,35]);
  shape(f.ink, [26,34],[15,27],[7,16],[3,6],[12,13],[9,5],[19,13],[15,3],[28,15],[34,27],[34,33]);
  shape(f.blue, [27,32],[17,25],[8,13],[17,20],[13,10],[23,19],[19,9],[28,19],[32,28]);
  shape(f.teal, [27,29],[18,20],[23,22],[20,15],[27,21],[31,28]);
  flecks(ctx, f.light, [[24,21],[28,25],[27,28],[46,23]]);
  flecks(ctx, f.white, [[54,24]], 1);
}

function diving(ctx) {
  const f = feather;
  const shape = (color, ...points) => polygon(ctx, color, ...points);
  shape(f.ink, [18,0],[34,12],[42,19],[49,29],[54,36],[55,45],[52,50],[50,66],[47,50],[41,49],[32,39],[25,24],[22,13],[16,4],[23,8]);
  shape(f.rust, [29,19],[39,20],[45,34],[47,44],[41,46],[34,39],[28,29]);
  shape(f.saffron, [29,20],[34,24],[39,32],[42,42],[38,40],[32,33]);
  shape(f.white, [39,35],[45,35],[48,41],[46,48],[42,47],[40,43]);
  shape(f.blue, [20,3],[36,15],[44,23],[48,29],[44,37],[37,30],[29,19],[25,11]);
  shape(f.shade, [14,5],[25,11],[34,15],[43,25],[44,35],[35,29],[28,19]);
  shape(f.blue, [18,8],[31,15],[39,22],[42,29],[34,23],[28,17]);
  shape(f.teal, [22,5],[33,12],[41,18],[48,29],[44,28],[39,21],[30,14]);
  shape(f.blue, [44,30],[49,31],[53,36],[54,43],[51,48],[48,47],[46,42],[43,37]);
  shape(f.teal, [47,31],[51,34],[54,39],[53,43],[50,39],[47,38]);
  shape(f.ink, [47,40],[51,41],[51,46],[49,49],[47,47]);
  shape(f.rust, [47,49],[50,50],[50,62]);
  flecks(ctx, f.light, [[49,33],[51,36],[51,39],[38,19],[35,16]], 1, 2);
  flecks(ctx, f.blue, [[35,24],[32,21],[38,27]]);
  flecks(ctx, f.white, [[48,42]], 1);
}

const birds = Object.fromEntries(Object.entries({ Perch: perched, Lift: lifting, Dive: diving }).map(([name, paint]) => {
  const canvas = createCanvas(78, 68);
  paint(canvas.getContext('2d'));
  return [name, canvas];
}));

function makeMarsh() {
  const c = createCanvas(216, 120);
  const g = c.getContext('2d');
  const shape = (color, ...points) => polygon(g, color, ...points);
  const rect = (color, x, y, width, height) => {
    g.fillStyle = color;
    g.fillRect(x, y, width, height);
  };
  rect('#bde6e0', 0, 0, 216, 120);
  rect('#caeadd', 0, 34, 216, 23);
  rect('#e4ecd0', 0, 55, 216, 20);
  for (let y = 0; y < 31; y++) {
    const dx = Math.round(Math.sqrt(15.5 ** 2 - (y - 15) ** 2));
    rect('#fff2ca', 166 - dx, 23 + y, dx * 2, 1);
  }
  shape('#a5cbc2', [0,61],[20,57],[36,59],[50,56],[70,57],[90,51],[109,53],[116,51],[139,54],[157,48],[173,50],[188,45],[200,44],[216,39],[216,79],[0,79]);
  shape('#79b1ac', [0,67],[14,64],[41,64],[61,66],[78,63],[90,63],[98,59],[115,62],[133,60],[143,62],[166,60],[190,53],[205,51],[216,48],[216,79],[0,79]);
  for (let i = 0; i < 29; i++) {
    const x = (i * 43 + 19) % 216;
    const bank = 69 - Math.max(0, Math.floor((x - 151) / 5));
    const h = 2 + (i * 7) % 6;
    rect('#619993', x, bank - h, 1, h);
    rect('#619993', x + 1, bank - 2, 2, 2);
  }
  shape('#598f90', [0,70],[26,69],[45,71],[72,71],[92,68],[123,70],[144,69],[166,67],[184,65],[202,61],[216,61],[216,77],[0,77]);
  rect('#8fd2c7', 0, 76, 216, 44);
  rect('#b8e2cc', 0, 77, 216, 2);
  shape('#6ebbb7', [0,82],[23,82],[23,83],[61,83],[61,85],[105,85],[105,87],[83,88],[83,90],[48,90],[48,93],[0,94]);
  shape('#4eaaa9', [0,102],[48,99],[78,99],[78,98],[102,98],[102,96],[141,96],[120,101],[85,104],[85,107],[70,107],[51,111],[0,111]);
  for (let i = 0; i < 45; i++) {
    const x = (i * 71 + 17) % 216;
    const y = 77 + (i * 13 + Math.floor(i / 4)) % 43;
    rect(x > 143 && x < 184 ? '#f1eac0' : '#bae2d0', x, y, 3 + i % 11, 1);
  }
  // The perch has the same position in every cel.
  shape('#55495a', [0,78],[18,77],[41,71],[67,67],[79,65],[102,65],[119,61],[116,64],[102,69],[78,70],[55,74],[29,79],[12,85],[0,88]);
  shape('#917566', [0,78],[19,77],[42,71],[69,66],[86,65],[102,65],[117,62],[102,67],[77,68],[48,73],[19,80],[0,83]);
  shape('#665563', [31,74],[32,67],[27,62],[31,63],[35,69],[35,73]);
  shape('#665563', [61,69],[65,62],[72,59],[67,63],[65,69]);
  shape('#377f80', [0,120],[0,97],[6,107],[4,89],[10,100],[14,116],[13,92],[17,98],[21,114],[25,104],[25,120]);
  shape('#438c87', [184,120],[191,115],[199,106],[194,117],[208,94],[205,106],[215,89],[216,89],[216,120]);
  return c;
}

const marsh = makeMarsh();

export function paintDrawing(ctx, name, x, y, w, h) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(marsh, x, y, w, h);
  const [bx, by] = name === 'Perch' ? [48, 10] : name === 'Lift' ? [70, 9] : [99, 10];
  ctx.drawImage(birds[name], x + bx * w / 216, y + by * h / 120, 78 * w / 216, 68 * h / 120);
  ctx.restore();
}

export function paintThumbnail(ctx, name, x, y, w, h) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#c7dfd6';
  ctx.fillRect(x, y, w, h);
  const scale = Math.min((w - 8) / 78, (h - 8) / 68);
  ctx.drawImage(birds[name], x + (w - 78 * scale) / 2, y + (h - 68 * scale) / 2, 78 * scale, 68 * scale);
  ctx.restore();
}
