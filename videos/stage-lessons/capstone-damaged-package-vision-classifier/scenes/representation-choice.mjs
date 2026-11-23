import { dynamic, group, heatmap, place, rect } from 'vizmatic/stage';
import { area, heading, namedBox } from '../../kit-narrated.mjs';
import { caption, photograph } from '../inspection.mjs';

export default function scene(s, c) {
  const [name, body, captionArea, foot] = area.rows([1, 4.5, 1.1, 1.1], 'normal');
  const [photo, encoder, head] = body.columns([1.5, 1, 1], 'wide');
  const title = heading(c.title);
  const architecture = [
    caption(name, 'ResNet   ·   Pretrained on ImageNet', 'cyan', 48),
    photograph(photo, 'mailer'),
    place(namedBox('Encoder', { width: encoder.width, height: 160, color: 'blue' }), encoder),
    place(namedBox('Damage head', { width: head.width, height: 160, color: 'yellow' }), head),
  ];
  const [, encoderLabel, headLabel] = captionArea.columns([1.5, 1, 1], 'wide');
  const fixed = caption(encoderLabel, 'Frozen', 'blue');
  const learn = caption(headLabel, 'Train', 'yellow');
  const tuned = caption(encoderLabel, 'Fine-tune', 'yellow');
  s.add(title, architecture);
  c.show('head', [fixed, learn]);
  c.swap('tune', fixed, tuned);

  const cell = 40;
  const gap = 4;
  const stride = cell + gap;
  const channel = Array.from({ length: 7 }, () =>
    Array.from({ length: 15 }, (_, i) => Number(i >= 7)),
  );
  const map = place(
    heatmap(channel, { cell, gap, values: false, colors: ['surface', 'blue'] }),
    body,
  );
  const offset = s.value(-4 * stride);
  const width = 7 * stride - gap;
  const window = dynamic(() =>
    rect(width, width, { fill: null, stroke: 'yellow', width: 6 }).moveTo([
      body.cx + offset.value,
      body.cy,
    ]),
  );
  c.swapAll(
    'convnext',
    [
      caption(name, 'ConvNeXt   ·   One feature channel', 'cyan', 48),
      map,
      window,
      caption(captionArea, 'The same 7 × 7 filter moves across this edge.', 'yellow', 43),
      caption(foot, 'Filter each channel, then mix channels.', 'ink', 40),
    ],
    { keep: [title] },
  );
  c.on('convnext', () => s.play(offset.to(4 * stride), { duration: 2.8 }));
  const patchTitle = caption(name, 'One coordinate of a ViT patch token', 'cyan', 48);
  const panes = body.columns(2, 'loose');
  const ordered = [
    [0, 1],
    [1, 0],
  ];
  const examples = ordered.map((values, i) => {
    const cells = panes[i].inset(48, 0).columns(2, 6);
    return group(
      ...values.flatMap((value, k) => [
        place(
          rect(cells[k].width, 232, {
            fill: value ? '#dfddd5' : '#1e2833',
            stroke: 'dim',
            width: 2,
          }),
          cells[k],
        ),
        caption(cells[k], String(value), value ? '#18232b' : 'ink', 78),
      ]),
    );
  });
  const means = caption(captionArea, 'Both pixel pairs average 0.5', 'dim', 43);
  const weights = caption(
    foot,
    'One projection coordinate   =   right pixel − left pixel',
    'yellow',
    43,
  );
  c.swapAll('patches', [patchTitle, examples, means], { keep: [title] });
  c.show('weights', weights);
  const results = captionArea.columns(2, 'loose').map((slot, i) => {
    const [left, right] = ordered[i];
    const value = right - left;
    const signed = value > 0 ? '+' + value : String(value).replace('-', '−');
    return caption(slot, right + ' − ' + left + '  =  ' + signed, 'yellow', 55);
  });
  c.swap('response', means, results[0], { after: true });
  c.show('reverse', results[1], { after: true });
  c.swap(
    'attention',
    weights,
    caption(
      foot,
      'Position embeddings   →   global self-attention across patch tokens',
      'cyan',
      40,
    ),
  );
  c.swapAll(
    'holdout',
    [
      caption(name, 'Which encoder finds more damaged parcels?', 'cyan', 48),
      photograph(photo, 'mailer'),
      caption(encoder, 'Same held-out cases', 'ink', 42),
      caption(head, 'Same review slots', 'ink', 42),
      caption(captionArea, 'Count the damaged cases that reach priority.', 'yellow', 45),
      caption(
        foot,
        'Record the training budget and measure latency on the target device.',
        'dim',
        36,
      ),
    ],
    { keep: [title] },
  );
}
