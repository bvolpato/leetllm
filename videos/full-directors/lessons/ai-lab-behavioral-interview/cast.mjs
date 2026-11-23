import { Path2D } from '@napi-rs/canvas';
const ink = '#302237';
const paper = '#fff5de';
const paths = new Map();
function shape(c, d, fill, stroke = null, width = 3) {
  if (!paths.has(d)) paths.set(d, new Path2D(d));
  const path = paths.get(d);
  if (fill) {
    c.fillStyle = fill;
    c.fill(path);
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke(path);
  }
}
function oval(c, x, y, rx, ry, fill, angle = 0) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, angle, 0, 2 * Math.PI);
  c.fillStyle = fill;
  c.fill();
}
function text(c, words, x, y, size, options = {}) {
  const { family = 'Sans', color = ink, weight = 600, align = 'center', italic = false } = options;
  c.fillStyle = color;
  c.font = (italic ? 'italic ' : '') + weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(words, x, y);
}
function wash(c, light, shadow) {
  const g = c.createLinearGradient(0, 200, 1600, 1080);
  g.addColorStop(0, light);
  g.addColorStop(1, shadow);
  c.fillStyle = g;
  c.fillRect(0, 0, 1920, 1080);
}
const people = {
  nia: { skin: '#bb795b', shade: '#96543f', coat: '#d24c49', hem: '#a7323c', hair: '#372836' },
  omar: { skin: '#c8916e', shade: '#ac7059', coat: '#798e91', hem: '#526e79', hair: '#3d333c' },
  priya: { skin: '#ab6851', shade: '#8d5140', coat: '#466591', hem: '#324874', hair: '#312737' },
  interviewer: { skin: '#e1ab8c', shade: '#c48977', coat: '#5e527b', hem: '#4c405d', hair: '#ded3c3' },
};
function head(c, who, p, blink, speaking) {
  if (who === 'nia') {
    oval(c, -90, -145, 49, 46, p.hair);
    oval(c, -105, -115, 45, 43, p.hair);
    shape(
      c,
      'M-121 -150 Q-114 -182 -85 -179 M-136 -122 Q-134 -146 -111 -151 M-125 -99 Q-116 -122 -100 -121',
      null,
      '#704958',
      3,
    );
    shape(c, 'M-92 -95 Q-85 -126 -69 -140', null, '#e48665', 8);
  }
  if (who === 'priya') {
    shape(
      c,
      'M-97 34 Q-118 -38 -97 -118 Q-76 -180 5 -168 Q83 -164 73 -73 L53 32 Q5 52 -97 34 Z',
      p.hair,
      ink,
    );
  }
  shape(
    c,
    'M-78 -87 Q-84 -153 -12 -159 Q39 -167 62 -117 Q71 -104 68 -78 Q69 -58 85 -38 Q91 -29 75 -26 L68 -24 Q73 -9 65 -7 Q69 5 59 16 Q48 37 16 34 L-4 60 L-57 40 L-52 -7 Q-72 -15 -78 -87 Z',
    p.skin,
    ink,
    3.8,
  );
  shape(c, 'M-51 -17 Q-34 19 11 31 L-4 58 L-56 40 Z', p.shade);
  if (who === 'nia') {
    shape(
      c,
      'M-68 -30 Q-102 -39 -100 -90 Q-109 -127 -76 -153 Q-53 -179 -8 -173 Q16 -182 42 -162 Q73 -159 71 -120 Q65 -108 54 -112 Q52 -137 34 -132 Q27 -106 5 -110 Q-2 -89 -22 -94 Q-24 -67 -49 -61 L-54 -34 Z',
      p.hair,
      ink,
      3.7,
    );
    shape(
      c,
      'M-73 -123 Q-69 -153 -42 -154 M-54 -128 Q-46 -151 -26 -150 M-26 -136 Q-21 -153 -2 -152',
      null,
      '#805361',
      2.5,
    );
  } else if (who === 'omar') {
    shape(
      c,
      'M-75 -40 Q-101 -58 -92 -120 Q-83 -162 -39 -167 Q-26 -191 2 -177 Q36 -201 61 -175 Q87 -170 71 -135 Q49 -105 3 -114 Q-28 -109 -51 -89 L-57 -42 Z',
      p.hair,
      ink,
    );
    shape(c, 'M-55 -123 Q-31 -150 -4 -144 M-10 -153 Q19 -170 37 -161', null, '#8e8383', 4);
    shape(
      c,
      'M-60 -40 Q-38 -21 -28 -1 Q-6 16 14 12 Q37 -1 48 -9 Q57 -16 66 -6 L64 10 Q40 48 13 43 Q-39 35 -52 2 Z',
      '#65535a',
    );
    shape(c, 'M-7 19 l6 8 M4 21 l5 7 M18 24 l4 5 M-22 11 l6 7', null, '#ac9693', 2.4);
  } else if (who === 'priya') {
    shape(
      c,
      'M-97 26 Q-114 -72 -89 -126 Q-66 -183 -5 -172 Q62 -184 75 -121 Q55 -136 42 -126 Q19 -97 -28 -99 Q-21 -63 -42 -33 L-56 34 Z',
      p.hair,
      ink,
    );
    shape(
      c,
      'M-81 -5 Q-86 -57 -65 -97 M-72 4 Q-68 -51 -53 -66 M-14 -148 Q18 -159 45 -143',
      null,
      '#71505c',
      3,
    );
  } else {
    shape(
      c,
      'M-82 -25 Q-104 -70 -96 -122 Q-99 -140 -79 -151 Q-61 -181 -24 -173 Q12 -194 48 -167 Q79 -164 73 -138 Q52 -114 17 -116 Q-19 -122 -42 -87 L-55 -32 Z',
      p.hair,
      ink,
      3.5,
    );
    shape(
      c,
      'M-77 -111 Q-72 -143 -43 -149 M-52 -125 Q-23 -163 15 -155 M-44 -116 Q-18 -143 11 -140',
      null,
      '#b0a29c',
      3,
    );
  }
  oval(c, -51, -47, 16, 22, p.skin, -0.2);
  shape(c, 'M-59 -52 Q-50 -61 -44 -48 L-51 -41', null, p.shade, 3);
  if (who === 'nia' || who === 'priya') {
    oval(c, -53, -29, 5.8, 5.8, '#ffda8b');
  }
  shape(c, 'M13 -82 Q33 -95 53 -86', null, p.hair, 6);
  c.save();
  c.translate(39, -64);
  c.scale(1, Math.max(0.08, 1 - blink));
  shape(c, 'M-21 2 Q-8 -17 14 -5 L20 -1 Q4 11 -14 8 Z', paper, ink, 2.4);
  oval(c, 8, -1, 6.2, 8, ink);
  c.restore();
  c.save();
  c.translate(45, -1);
  c.scale(1, 0.15 + speaking * 1.35);
  shape(c, 'M0 0 Q9 3 20 -2 Q17 15 7 7 Z', ink);
  c.restore();
  shape(c, 'M45 -1 Q54 3 65 -3', null, ink, 2.8);
  if (who === 'nia') {
    shape(
      c,
      'M-52 -62 L4 -66 M1 -73 Q18 -83 58 -77 L62 -67 Q62 -42 41 -40 Q12 -37 5 -59 Z M61 -69 L72 -68',
      null,
      '#802d37',
      6.5,
    );
  }
}
function portrait(c, who, x, y, scale, face, seconds, tilt = 0, speaking = 0) {
  const p = people[who];
  c.save();
  c.translate(x, y);
  c.scale(scale * face, scale);
  shape(
    c,
    'M-57 31 Q-71 46 -92 58 Q-134 84 -148 142 L-173 265 L163 265 Q143 172 123 113 Q106 63 57 54 L14 36 L-21 56 Z',
    p.coat,
    ink,
    4,
  );
  shape(c, 'M-85 74 Q-114 115 -124 172 L-133 265 L-173 265 L-149 139 Q-136 93 -85 74 Z', p.hem);
  shape(c, 'M73 100 Q88 136 84 170 M79 162 Q57 187 57 228', null, p.hem, 4);
  if (who === 'nia') {
    shape(c, 'M-58 31 Q-57 65 -16 72 Q6 70 22 48 L14 37 Q-17 56 -58 31 Z', ink);
    for (let n = 0; n < 5; n++) {
      c.save();
      c.translate(n * 7, n * 2.5);
      shape(c, 'M-104 84 L-110 95', null, '#f8aa86', 2.5);
      c.restore();
    }
  } else if (who === 'omar') {
    shape(c, 'M-59 31 L-17 53 L-39 84 L-75 50 Z M-15 53 L13 36 L48 51 L3 83 Z', '#d1c6a9', ink, 2.6);
    shape(c, 'M-14 57 L-3 253', null, p.hem, 3);
    for (const cy of [93, 123, 153, 183]) oval(c, -10 + (cy - 93) / 30, cy, 2.5, 2.5, ink);
  } else {
    shape(c, 'M-57 32 Q-26 60 18 37 L34 48 L12 149 L-25 113 Z', paper);
    shape(
      c,
      'M-55 32 L-73 57 L-53 75 L-62 87 L9 159 M20 39 L50 53 L35 79 L46 84 L12 154',
      null,
      p.hem,
      3.5,
    );
  }
  const blink = Math.max(0, 1 - Math.abs(((seconds + (who === 'nia' ? 1.1 : 3.2)) % 6.3) - 4) / 0.12);
  c.rotate(tilt);
  head(c, who, p, blink, speaking);
  c.restore();
}
const lenses = [
  'M178 335 Q462 286 808 315 Q866 322 867 383 Q860 572 809 669 Q779 737 648 750 Q447 769 287 724 Q171 696 144 584 L119 427 Q104 349 178 335 Z',
  'M1116 315 Q1469 283 1733 329 Q1817 343 1804 431 L1776 589 Q1752 698 1635 728 Q1470 769 1272 746 Q1147 731 1117 663 Q1069 555 1060 392 Q1055 322 1116 315 Z',
];
function eyeReflection(c, x, gaze) {
  c.save();
  c.translate(x, 408);
  shape(
    c,
    'M-126 5 Q-70 -65 19 -56 Q78 -52 122 -3 Q54 46 -15 46 Q-74 45 -126 5 Z',
    '#ffebca',
    '#975b52',
    5,
  );
  oval(c, 14 + 18 * gaze, -4, 43, 49, '#895758');
  oval(c, 16 + 18 * gaze, -3, 23, 34, ink);
  oval(c, 5 + 18 * gaze, -16, 8.5, 8.5, '#fff2da');
  c.restore();
}
function lensPortrait(c, values, opacity) {
  wash(c, '#bb795b', '#ce8b6a');
  shape(
    c,
    'M0 0 H1492 Q1341 95 1092 66 Q903 130 693 80 Q477 175 387 114 Q258 255 148 247 L0 381 Z',
    people.nia.hair,
  );
  shape(c, 'M0 0 H716 Q526 114 373 91 Q249 199 141 204 Q95 266 0 279 Z', '#493043');
  shape(c, 'M1015 334 Q1038 536 1119 712 Q1157 789 1079 810 Q1033 832 1016 813', null, '#9d594c', 15);
  shape(c, 'M953 833 Q925 813 894 841 M1018 830 Q1040 809 1063 825', null, '#794743', 11);
  shape(
    c,
    'M717 1000 Q827 966 902 964 Q957 943 1015 964 Q1099 979 1220 956 Q1124 1032 981 1034 Q807 1034 717 1000 Z',
    '#934e51',
  );
  shape(c, 'M771 994 Q900 997 966 983 Q1071 996 1179 969', null, '#6a4045', 7);
  shape(
    c,
    'M226 258 Q456 152 718 246 Q745 253 713 268 Q475 232 232 279 Z M1157 248 Q1407 143 1658 231 L1704 266 Q1437 232 1163 275 Z',
    people.nia.hair,
  );
  shape(c, 'M-20 323 L148 362 M845 376 Q956 312 1081 376 M1788 365 L1940 309', null, ink, 42);
  shape(c, 'M-20 319 L148 359 M845 372 Q956 309 1081 372 M1788 361 L1940 305', null, '#bc454c', 25);
  const gaze = -1 + 2 * opacity[1];
  for (const [i, d] of lenses.entries()) {
    const x = i === 0 ? 494 : 1431;
    const glass = c.createLinearGradient(0, 300, 0, 747);
    glass.addColorStop(0, '#e9c7ac');
    glass.addColorStop(0.68, '#f8ddba');
    glass.addColorStop(1, '#fff3d9');
    shape(c, d, glass);
    c.save();
    c.clip(paths.get(d));
    eyeReflection(c, x, gaze);
    const reflection = c.createLinearGradient(0, 446, 0, 579);
    reflection.addColorStop(0, '#fff5de00');
    reflection.addColorStop(1, '#fff4dc');
    c.fillStyle = reflection;
    c.fillRect(x - 450, 446, 900, 335);
    text(c, i ? 'Citation' : 'Snippet', x, 525, 43, { color: '#6b4852' });
    c.globalAlpha = opacity[i];
    text(c, values[i], x, 618, i ? 56 : 65, { family: 'Serif', weight: 400 });
    c.restore();
    shape(c, d, null, ink, 38);
    shape(c, d, null, '#ae3b44', 23);
    shape(c, d, null, '#e97866', 4);
  }
}
export { lensPortrait, portrait };
