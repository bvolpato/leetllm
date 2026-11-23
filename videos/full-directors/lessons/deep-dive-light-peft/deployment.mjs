import { C, mix, smooth } from './drawing.mjs';
import {
  bases,
  firstWrong,
  tokenOutput,
  fmt,
  cases,
  shifted,
  aggregate,
  gate,
} from './examples.mjs';

function comb(p, ids, x, y, upper, marked) {
  const { ctx } = p,
    w = 136,
    depth = 37,
    baseY = upper ? y : y + depth;
  p.box(x - 13, baseY, 3 * w + 26, 44, upper ? C.ice : C.mint, upper ? C.blue : C.teal, 6);
  p.label(
    upper ? 'Base A  ·  fitted adapter' : 'Base B  ·  receiving slots',
    x + 3,
    baseY + 22,
    18,
    upper ? C.blue : C.teal,
    { bold: true },
  );
  ids.forEach((id, i) => {
    const cx = x + i * w + w / 2,
      top = upper ? y + 44 : y;
    const hit = marked && i === firstWrong,
      ink = hit ? C.rust : upper ? C.blue : C.teal;
    // All three socket positions have the same width. Print the original ID on the mating face.
    ctx.beginPath();
    if (upper) {
      ctx.moveTo(cx - 45, top);
      ctx.lineTo(cx - 45, top + 23);
      ctx.lineTo(cx - 34, top + depth);
      ctx.lineTo(cx + 34, top + depth);
      ctx.lineTo(cx + 45, top + 23);
      ctx.lineTo(cx + 45, top);
    } else {
      ctx.moveTo(cx - 54, top + depth);
      ctx.lineTo(cx - 54, top);
      ctx.lineTo(cx - 43, top);
      ctx.lineTo(cx - 43, top + 23);
      ctx.lineTo(cx - 32, top + depth - 2);
      ctx.lineTo(cx + 32, top + depth - 2);
      ctx.lineTo(cx + 43, top + 23);
      ctx.lineTo(cx + 43, top);
      ctx.lineTo(cx + 54, top);
      ctx.lineTo(cx + 54, top + depth);
    }
    ctx.closePath();
    ctx.fillStyle = ink;
    ctx.fill();
    p.mono('H' + id, cx, top + 15, 18, upper ? C.white : ink, 'center');
  });
}

export function deployment(p) {
  const { b, cue, header, foot, box, line, label, mono, dot } = p;
  if (b < 4) {
    header(
      'Adapter and cache identity  /  base revision R17',
      b < 2 ? 'Where does a shape-only fit go wrong?' : 'Can B use A’s cache for the new token?',
    );
    const align = smooth(cue(0, 'Slide the adapter', 2.3)),
      mark = cue(1, 'A expects head');
    const x = mix(64, 153, align);
    comb(p, bases[0], x, mix(182, 255, align), true, mark);
    comb(p, bases[1], 153, 347, false, mark);
    label('Same width   ·   3 heads   ·   zero-based original IDs', 85, 483, 19, C.dim);
    const newToken = b >= 2,
      token = newToken ? [2, 0] : [1, -1],
      f = tokenOutput(token);
    const observed = b > 0;
    line(
      [
        [681, 176],
        [681, 515],
      ],
      C.fine,
    );
    label(observed ? 'Contributions to one scalar output' : 'Shape check', 722, 190, 22, C.ink, { bold: true });
    if (!observed) {
      mono('3 sockets', 721, 248, 32, C.teal);
      label('Can the adapter move across?', 721, 325, 22, C.dim);
    } else {
      mono('x = [' + token.map(fmt).join(', ') + ']', 721, 234, 20, C.dim);
      f.contributions.forEach((v, i) => {
        const xx = 724 + i * 92;
        mono('H' + i, xx + 35, 279, 16, C.dim, 'center');
        p.plate(xx, 302, 70, 49, C.white, C.fine, fmt(v), 22);
      });
      const showA = newToken ? cue(3, 'B sums') : cue(1, 'Reject A'),
        showB = newToken ? cue(3, 'Rebuild the state') : cue(1, 'Reject A');
      f.terms.forEach((terms, i) => {
        const sumShown = i === 0 ? showA : showB;
        const expression = terms
          .map((v, j) => (j === 0 ? '' : v >= 0 ? ' + ' : ' − ') + fmt(j === 0 ? v : Math.abs(v)))
          .join('');
        mono(
          (i === 0 ? 'A   ' : 'B   ') + expression + (sumShown ? ' = ' + f.outputs[i] : ' = ?'),
          722,
          404 + 59 * i,
          22,
          i === 0 ? C.blue : C.teal,
        );
      });
    }
    foot(
      b === 0
        ? 'Align by width first. Then read the original head on each tooth.'
        : b === 2
          ? 'Keep both head lists fixed. Only the token has changed.'
          : (b === 1 ? cue(1, 'Bind the revision') : cue(3, 'A shared service'))
            ? 'Reject A’s entry for B. Bind base revision, ordered survivors and adapter identity.'
            : 'Keep the original coordinate names on both sides of the join.',
      C.blue,
    );
    return;
  }
  header('Post-pruning check  /  held-out task slices', 'Can the rebuilt model continue?');
  const showRates = b === 5,
    held = cue(5, 'Replay the failures');
  cases.forEach(({ name, pass, n }, i) => {
    const y = 236 + i * 168;
    label(name, 64, y, 25, C.ink, { bold: true });
    const visible = cue(4, i ? 'This experiment requires' : 'Six of ten');
    mono((visible ? pass : '?') + ' / ' + n, 63, y + 43, 22, C.dim);
    for (let j = 0; j < n; j++) {
      const x = 300 + (j % 25) * 21,
        yy = y - 14 + Math.floor(j / 25) * 32;
      dot(x, yy, 8, visible ? (j < pass ? C.teal : C.rust) : C.faint);
      if (visible && j >= pass)
        line(
          [
            [x - 4, yy - 4],
            [x + 4, yy + 4],
          ],
          C.white,
          1.5,
        );
    }
    if (showRates && held)
      mono(Math.round((100 * pass) / n) + '%', 876, y, 32, i ? C.rust : C.teal);
  });
  if (cue(4, 'This experiment requires'))
    label('Required on shifted cases   ' + Math.round(gate * 100) + '%', 297, 481, 23, C.ink);
  if (cue(5, 'The aggregate is')) label('Hold', 984, 399, 29, C.rust, { bold: true });
  foot(
    held
      ? 'Overall ' +
          Math.round(100 * aggregate) +
          '%    •    shifted ' +
          Math.round(100 * shifted) +
          '%    •    replay failures against the unpruned checkpoint.'
      : 'A changed policy can visit different states after pruning. Evaluate the shifted slice.',
    C.teal,
  );
}
