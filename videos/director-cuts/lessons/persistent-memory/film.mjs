import assert from 'node:assert/strict';
import { paintPhoto, wheel } from './bicycles.mjs';

const title = 'Where did the new chat get the crop?';
const beats = [
  {
    id: 'front-wheel',
    say: 'Keep an eye on the front wheel. The square cuts right through it. Ada pulls the crop wider until both tires fit.',
    hold: 1.1,
  },
  {
    id: 'save-the-shape',
    say: '“Keep this shape for my bicycle catalog.” The app saves Ada’s preference outside the chat. In her catalog profile, the square was revision one. This wider crop is revision two.',
    hold: 1,
  },
  {
    id: 'next-bike',
    say: 'Next bike, fresh chat. Ada types, “Use my usual crop.” There’s no shape in those four words. Where will it come from?',
    hold: 1.4,
  },
  {
    id: 'search-preview',
    say: 'Here’s the first thing search finds. Look at the front tire again. This copy of Ada’s preference still says square.',
    hold: 1.2,
  },
  {
    id: 'compare-revisions',
    say: 'Can the app use it? The copy points to revision one. The saved profile says two. The app drops the old crop before it builds the prompt.',
    hold: 0.9,
  },
  {
    id: 'read-the-profile',
    say: 'Ada has access to this catalog, so the app can read her profile directly. It copies her current preference into the new prompt, right beside her request.',
    hold: 1.1,
  },
  {
    id: 'both-wheels',
    say: 'There’s the front tire, all the way around. The new chat had four words from Ada. Her saved preference supplied the shape.',
    hold: 2.5,
  },
];

const session = { user: 'ada', project: 'bicycle-catalog', canReadProfile: true };
const square = [1, 1];
const wide = [3, 2];
const firstProfile = {
  user: session.user,
  project: session.project,
  key: 'photo.crop',
  source: 'catalog/crop',
  revision: 1,
  ratio: square,
};
const searchCopy = { ...firstProfile };
const currentProfile = { ...firstProfile, revision: firstProfile.revision + 1, ratio: wide };
const request = 'Use my usual crop.';

// The host has already authenticated the session. The project grant and current
// record identity are checked before a preference is copied into the model input.
function readCrop(caller, source, record = source) {
  const inScope = caller.user === source.user && caller.project === source.project;
  const sameRecord =
    record.source === source.source &&
    record.key === source.key &&
    record.user === source.user &&
    record.project === source.project;
  if (!caller.canReadProfile || !inScope || !sameRecord || record.revision !== source.revision)
    return null;
  return { ratio: [...source.ratio], revision: source.revision };
}

function newPrompt(crop = null) {
  return { message: request, crop };
}

const searchResult = readCrop(session, currentProfile, searchCopy);
const beforeRead = newPrompt(searchResult);
const afterRead = newPrompt(readCrop(session, currentProfile));
const cropHeight = 686;
const cropWidth = ([w, h]) => (cropHeight * w) / h;
const ratioText = (ratio) => ratio.join(':');

function check() {
  assert.deepEqual(readCrop(session, firstProfile, searchCopy)?.ratio, square);
  assert.equal(beforeRead.crop, null);
  assert.deepEqual(afterRead.crop, { ratio: wide, revision: 2 });
  assert.equal(readCrop({ ...session, project: 'portraits' }, currentProfile), null);
  assert.equal(readCrop({ ...session, canReadProfile: false }, currentProfile), null);
  assert.equal(
    readCrop(session, currentProfile, { ...currentProfile, source: 'another/crop' }),
    null,
  );
  const rightTire = wheel.front + wheel.radius;
  const leftTire = wheel.rear - wheel.radius;
  assert.ok(cropWidth(square) / 2 < rightTire && -cropWidth(square) / 2 > leftTire);
  assert.ok(
    cropWidth(afterRead.crop.ratio) / 2 > rightTire &&
      -cropWidth(afterRead.crop.ratio) / 2 < leftTire,
  );
  assert.ok(cropHeight / 2 > wheel.axle + wheel.radius);
  assert.equal(afterRead.message.split(' ').length, 4);
}

const ink = '#f9f3e8';
const soft = '#c2bdcc';
const mint = '#c1edd4';
const pink = '#f5bc92';
const desk = '#262331';
const panelX = 1348;
const textX = panelX + 55;
const right = 1864;

function ease(n) {
  const t = Math.max(0, Math.min(1, n));
  return t * t * (3 - 2 * t);
}

const mix = (a, b, t) => a + (b - a) * t;

function type(ctx, value, x, y, size, color = ink, font = 'Sans', align = 'left', weight = 400) {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.font = `${weight} ${size}px "Lesson ${font}"`;
  ctx.fillText(value, x, y);
}

function rule(ctx, x1, y, x2, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x1, y, x2 - x1, 2);
}

function fade(ctx, alpha, fn) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= Math.min(alpha, 1);
  fn();
  ctx.restore();
}

function cue(clock, index, phrase, span) {
  if (clock.index < index) return 0;
  if (clock.index > index) return 1;
  return ease(clock.reveal(phrase, span));
}

function shot(clock) {
  const widen = cue(clock, 0, 'Ada pulls', 1.4);
  const saved = cue(clock, 1, 'This wider crop', 0.75);
  const next = cue(clock, 2, 'Next bike', 0.45);
  const asked = cue(clock, 2, 'Ada types', 0.75);
  const found = cue(clock, 3, 'first thing', 0.65);
  const compared = cue(clock, 4, 'The saved profile', 0.65);
  const omitted = cue(clock, 4, 'The app drops', 0.8);
  const direct = cue(clock, 5, 'read her profile directly', 0.65);
  const copied = cue(clock, 5, 'copies her current preference', 1.25);
  // Set the crop on the last word of the previous beat so the result precedes its name.
  const applied = cue(clock, 5, 'her request', 0.85);
  const close = cue(clock, 6, 'the front tire', 1.3);
  const finish = cue(clock, 6, 'The new chat', 1.8);
  return {
    widen,
    saved,
    next,
    asked,
    found,
    compared,
    omitted,
    direct,
    copied,
    applied,
    close,
    finish,
  };
}

function pointer(ctx, x, y, a) {
  fade(ctx, a, () => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 25, y + 14);
    ctx.lineTo(x + 13, y + 18);
    ctx.lineTo(x + 20, y + 34);
    ctx.lineTo(x + 13, y + 37);
    ctx.lineTo(x + 6, y + 22);
    ctx.lineTo(x, y + 31);
    ctx.closePath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#2d2b36';
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.fill();
  });
}

function aperture(ctx, center, scale, width, alpha, candidate, final, viewport) {
  if (!alpha) return;
  const w = scale * width,
    h = scale * cropHeight;
  const x = center.x - w / 2,
    y = center.y - h / 2,
    r = x + w,
    b = y + h;
  fade(ctx, alpha, () => {
    // The tire outside a search preview is still faintly visible. A delivered crop has a solid mat.
    ctx.fillStyle = final > 0 ? `rgba(38,35,49,${mix(0.8, 1, final)})` : 'rgba(38,35,49,.81)';
    ctx.fillRect(0, 0, viewport, y);
    ctx.fillRect(0, y, x, h);
    ctx.fillRect(r, y, viewport - r, h);
    ctx.fillRect(0, b, viewport, 1080 - b);
    fade(ctx, 1 - final, () => {
      ctx.strokeStyle = candidate ? pink : ink;
      ctx.lineWidth = candidate ? 4.5 : 2.5;
      ctx.setLineDash(candidate ? [16, 10] : []);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
      for (const [cx, cy, dx, dy] of [
        [x, y, 1, 1],
        [x, b, 1, -1],
        [r, y, -1, 1],
        [r, b, -1, -1],
      ]) {
        ctx.beginPath();
        ctx.moveTo(cx, cy + dy * 28);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + dx * 28, cy);
        ctx.lineWidth = 7;
        ctx.stroke();
      }
    });
  });
}

function viewfinder(ctx, clock, s, viewport) {
  const second = clock.index >= 2;
  const center = { x: viewport / 2, y: mix(536, 553, s.finish) };
  const scale = mix(mix(1.14, 1.21, s.close), 1.28, s.finish);
  paintPhoto(ctx, { x: 0, y: 0, width: viewport, height: 1080 }, center, scale, second);
  const squareWidth = cropWidth(searchCopy.ratio);
  const savedWidth = cropWidth(afterRead.crop.ratio);
  let label;
  if (!second) {
    const snap = ease(clock.seconds / 0.72);
    const width = mix(mix(savedWidth, squareWidth, snap), savedWidth, s.widen);
    aperture(ctx, center, scale, width, 1, false, 0, viewport);
    pointer(
      ctx,
      center.x + (width * scale) / 2,
      center.y + 32,
      (1 - s.widen) * Math.min(1, clock.seconds),
    );
    if (width === squareWidth) label = ratioText(square);
    if (width === savedWidth) label = ratioText(wide);
  } else {
    const preview = s.found * (1 - s.omitted);
    aperture(ctx, center, scale, squareWidth, preview, true, 0, viewport);
    aperture(ctx, center, scale, savedWidth, s.applied, false, s.close, viewport);
    label =
      preview > 0.7 ? 'Search preview' : s.applied > 0.75 ? ratioText(afterRead.crop.ratio) : '';
    // The contact sheet advances by one exposure when Ada opens a new photo.
    if (s.next < 1)
      fade(ctx, (1 - s.next) * 0.86, () => {
        ctx.fillStyle = desk;
        ctx.fillRect(0, 0, panelX, 1080);
      });
  }
  // Caption the exposure on its own opaque rebate, independent of the changing mask.
  ctx.fillStyle = desk;
  ctx.fillRect(0, 0, viewport, 99);
  const leftEdge = center.x - (savedWidth * scale) / 2;
  const rightEdge = viewport - leftEdge;
  type(
    ctx,
    second ? 'City bicycle' : 'Road bicycle',
    mix(51, leftEdge, s.finish),
    mix(65, 80, s.finish),
    mix(43, 57, s.finish),
    ink,
    'Serif',
  );
  if (label) {
    fade(ctx, 1 - s.finish, () => type(ctx, label, viewport - 53, 63, 33, ink, 'Mono', 'right'));
    fade(ctx, s.finish, () =>
      type(
        ctx,
        label + '  /  Catalog profile v' + afterRead.crop.revision,
        rightEdge,
        77,
        39,
        mint,
        'Sans',
        'right',
      ),
    );
  }
}

function revision(ctx, record, y, valueY, alpha, color, name) {
  fade(ctx, alpha, () => {
    type(ctx, name, textX, y, 38, soft);
    type(ctx, ratioText(record.ratio), textX, valueY, 78, color, 'Serif');
    type(ctx, 'rev ' + record.revision, right, valueY - 6, 45, color, 'Mono', 'right');
  });
}

function header(ctx) {
  ctx.fillStyle = desk;
  ctx.fillRect(panelX, 0, 1920 - panelX, 1080);
  ctx.fillStyle = '#514b5c';
  ctx.fillRect(panelX, 0, 2, 1080);
  // A crop tool glyph anchors the project name even when the photo changes.
  ctx.strokeStyle = mint;
  ctx.lineWidth = 5;
  ctx.lineCap = 'square';
  ctx.beginPath();
  ctx.moveTo(textX + 5, 42);
  ctx.lineTo(textX + 5, 66);
  ctx.lineTo(textX + 35, 66);
  ctx.moveTo(textX - 1, 47);
  ctx.lineTo(textX + 28, 47);
  ctx.lineTo(textX + 28, 72);
  ctx.stroke();
  type(ctx, 'Bicycle catalog', textX + 57, 70, 42, ink, 'Serif');
  rule(ctx, textX, 99, right, '#645e70');
}

function inspector(ctx, clock, s) {
  header(ctx);
  const newChat = clock.index >= 2;
  type(ctx, newChat ? 'Ada  /  New chat' : 'Ada  /  Photo edit', textX, 177, 32, soft);
  if (!newChat) {
    if (clock.index === 0) {
      type(ctx, 'Crop preview', textX, 269, 49, ink, 'Serif');
    } else {
      type(ctx, '“Keep this shape for', textX, 250, 46, ink, 'Serif');
      type(ctx, 'my bicycle catalog.”', textX, 308, 46, ink, 'Serif');
    }
  } else {
    const line = '“' + beforeRead.message + '”';
    const end = Math.floor(s.asked * line.length);
    type(ctx, line.slice(0, end), textX, 256, 46, ink, 'Serif');
    fade(ctx, s.asked, () => {
      type(ctx, 'Crop in model prompt', textX, 340, 37, soft);
      if (s.copied < 1) {
        ctx.save();
        ctx.strokeStyle = '#938b9f';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 7]);
        ctx.strokeRect(textX, 366, 135, 62);
        ctx.restore();
      }
    });
  }

  rule(ctx, textX, 472, right, '#625b6d');
  const record = s.saved < 0.5 ? firstProfile : currentProfile;
  // Keep the profile in one physical position across the edit and the next chat.
  revision(ctx, record, 542, 627, 1, s.compared > 0 || !newChat ? mint : ink, 'Catalog profile');
  if (clock.index === 1) {
    fade(ctx, s.saved, () => type(ctx, 'Saved from Ada’s edit', textX, 687, 31, mint));
  }
  if (newChat) {
    revision(
      ctx,
      searchCopy,
      717,
      802,
      s.found * (1 - s.omitted * 0.53) * (1 - s.close),
      pink,
      'Search copy',
    );
    fade(ctx, s.omitted * (1 - s.close), () => {
      type(ctx, 'Older revision skipped', textX, 863, 30, pink);
    });
    if (s.copied > 0) {
      // Bring the value into the prompt on its own line. The source stays readable.
      const x = mix(textX + 32, textX, s.copied),
        y = 418;
      const px = 64;
      fade(ctx, Math.min(1, s.copied * 4), () => {
        ctx.fillStyle = desk;
        ctx.fillRect(x - 2, y - px + 4, 153, px + 8);
        type(ctx, ratioText(afterRead.crop.ratio), x, y, px, mint, 'Serif');
      });
    }
    fade(ctx, s.direct * s.copied, () => {
      type(ctx, 'from profile', textX + 145, 415, 31, mint);
    });
  }
}

function draw(ctx, clock) {
  const s = shot(clock);
  const viewport = mix(panelX, 1920, s.finish);
  ctx.save();
  ctx.fillStyle = desk;
  ctx.fillRect(0, 0, 1920, 1080);
  viewfinder(ctx, clock, s, viewport);
  ctx.translate(viewport - panelX, 0);
  inspector(ctx, clock, s);
  ctx.restore();
}

export default { title, beats, draw, check };
