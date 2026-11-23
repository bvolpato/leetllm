// The windup mouse and wooden lane are adapted from this lesson's approved short.
import { line, oval, mix, polygon, label } from './drawing.mjs';

export const purple = { ink: '#594181', enamel: '#9273bb', glint: '#e0c9f0' };
export const orange = { ink: '#9c461d', enamel: '#ee8847', glint: '#ffe0a4' };

export function mouse(c, x, y, scale, facing, spin, lift, arm, curled = 0) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  oval(c, 0, 3, 91 - 0.35 * lift, 10, '#3b294b21');
  c.translate(0, -lift);
  c.scale(facing, 1);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-50, -39);
  c.bezierCurveTo(
    mix(-99, -87, curled),
    -18,
    mix(-123, -90, curled),
    -66 - 5 * Math.sin(spin),
    mix(-149, -81, curled),
    mix(-39, -75, curled),
  );
  c.bezierCurveTo(
    mix(-159, -68, curled),
    mix(-30, -95, curled),
    mix(-173, -56, curled),
    mix(-37, -77, curled),
    mix(-170, -65, curled),
    mix(-45, -75, curled),
  );
  c.strokeStyle = arm.ink;
  c.lineWidth = 5;
  c.stroke();

  const keyWidth = 8 + 12 * (0.5 + 0.5 * Math.cos(spin));
  line(c, -23, -73, -34, -117, '#645661', 7);
  c.save();
  c.translate(-34, -114);
  c.rotate(-0.22);
  for (const sign of [-1, 1]) {
    const keyX = sign * keyWidth;
    oval(c, keyX, 0, keyWidth + 1, 13, '#736373');
    oval(c, keyX, -1, keyWidth * 0.56, 7, '#e8dce1');
  }
  c.restore();

  for (const wx of [-45, 42]) {
    oval(c, wx, -14, 20, 20, '#443849');
    oval(c, wx, -14, 13, 13, '#f1e3cb');
    line(
      c,
      wx - 9 * Math.cos(spin),
      -14 - 9 * Math.sin(spin),
      wx + 9 * Math.cos(spin),
      -14 + 9 * Math.sin(spin),
      '#806e79',
      3,
    );
  }

  const paint = c.createLinearGradient(0, -97, 20, -17);
  paint.addColorStop(0, arm.glint);
  paint.addColorStop(0.4, arm.enamel);
  paint.addColorStop(1, arm.ink);
  c.beginPath();
  c.moveTo(-76, -36);
  c.bezierCurveTo(-81, -83, -46, -104, -9, -94);
  c.bezierCurveTo(28, -93, 55, -71, 96, -44);
  c.bezierCurveTo(87, -25, 22, -18, -45, -21);
  c.quadraticCurveTo(-71, -22, -76, -36);
  c.fillStyle = paint;
  c.fill();
  c.lineWidth = 2.4;
  c.strokeStyle = arm.ink;
  c.stroke();
  c.beginPath();
  c.moveTo(-66, -42);
  c.bezierCurveTo(-23, -28, 31, -29, 74, -43);
  c.strokeStyle = arm.glint;
  c.lineWidth = 5;
  c.stroke();
  oval(c, 15, -86, 18, 25, arm.ink, -0.42);
  oval(c, 16, -86, 12, 18, arm.glint, -0.42);
  oval(c, 56, -59, 5, 5, '#2e2331');
  oval(c, 94, -43, 6, 5, '#302536');
  for (let i = -1; i <= 1; i++) line(c, 77, -42, 107, -42 + i * 8, '#6b4d58', 1.8);
  c.restore();
}

// The two lanes share a cutaway view, so the numbers stay attached to the wood.
export function board(c, y, start, spacing, last, cropped = false) {
  const left = start - spacing * 0.5;
  const right = start + (last + 0.5) * spacing;
  const front = y + 9;
  const top = y - 40;
  c.save();
  c.shadowColor = '#66516b49';
  c.shadowBlur = 22;
  c.shadowOffsetY = 22;
  polygon(
    c,
    [
      [left, front],
      [right, front],
      [right, front + 44],
      [left, front + 44],
    ],
    '#bea18f',
  );
  c.restore();
  const wood = c.createLinearGradient(0, top, 0, front);
  wood.addColorStop(0, '#ebc7a5');
  wood.addColorStop(1, '#fae3c8');
  polygon(
    c,
    [
      [left, front],
      [left + 20, top],
      [right + 20, top],
      [right, front],
    ],
    wood,
  );
  line(c, left, front, right, front, '#f8e9da', 4);
  for (let i = 0; i <= last; i++) {
    const cx = start + i * spacing;
    if (i > 0) {
      const edge = cx - spacing * 0.5;
      line(c, edge, front, edge + 20, top, '#c9aa92', 2);
      line(c, edge, front + 2, edge, front + 41, '#aa8e83', 1.5);
    }
    label(c, String(i), cx, front + 24, 32, '#513941', 'Mono', 600, 'center');
  }
  if (cropped) {
    polygon(
      c,
      [
        [left - 9, top - 56],
        [left + 9, top - 73],
        [left + 9, top + 10],
        [left - 9, front + 5],
      ],
      '#bc9a85',
    );
    polygon(
      c,
      [
        [left - 21, top - 59],
        [left - 9, top - 56],
        [left - 9, front + 5],
        [left - 21, front + 3],
      ],
      '#926f65',
    );
  }
}

export function flag(c, x, y, landed, arm) {
  line(c, x, y - 30, x, y - 154, '#5e4952', 5);
  oval(c, x, y - 158, 6, 6, '#5e4952');
  const tipY = -134 + 9 * landed;
  polygon(
    c,
    [
      [x, -153 + y],
      [x + 69, y + tipY],
      [x, y - 99],
    ],
    arm.ink,
  );
  polygon(
    c,
    [
      [x + 4, -147 + y],
      [x + 29, y - 139],
      [x + 4, y - 123],
    ],
    arm.glint,
  );
}
