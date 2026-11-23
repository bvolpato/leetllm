import { place, table } from 'vizmatic/stage';
import { area, heading } from '../../kit-narrated.mjs';
import { caption, photograph } from '../inspection.mjs';

export default function scene(s, c) {
  const title = heading(c.title);
  const [names, photos, actions, foot] = area.rows([1, 4.5, 1, 1.15], 'normal');
  const [left, right] = photos.columns(2, 'loose');
  const [a, b] = actions.columns(2, 'loose');
  s.add(
    title,
    photograph(left, 'dark'),
    photograph(right, 'mailer'),
    caption(a, 'Retake   →   Uploader', 'cyan', 46),
  );
  c.show('queues', caption(b, 'Normal or priority   →   Specialist', 'yellow', 44));
  c.show(
    'refund',
    caption(foot, 'Refund, replacement or restocking   →   Order policy', 'ink', 42),
  );

  const records = place(
    table(
      [
        { key: 'id', label: 'What the exercise supplies' },
        {
          key: 'use',
          label: 'What you can test',
          sample: 'Replay each route and join the later verdict',
        },
      ],
      [
        { id: 'Capture metadata and scores', use: 'Rebuild each route' },
        { id: 'Specialist labels', use: 'Count the cases the router missed' },
      ],
      { width: photos.width, size: 39 },
    ),
    photos,
  );
  c.swapAll('invented', [heading('What can we test with invented records?'), records]);
  c.show('limits', [
    caption(actions, 'Training   ·   2 photos of 1 damaged parcel', 'cyan', 45),
    caption(foot, 'Validation   ·   0 usable damaged parcels', 'ink', 45),
  ]);
  c.swapAll('permission', [
    heading('Training on parcel photographs'),
    caption(names, 'Record permission for each use.', 'cyan', 46),
    photograph(left, 'mailer'),
    caption(right, 'Restrict access to the originals.', 'ink', 43),
    caption(actions, 'Remove personal shipping details from portfolio images.', 'ink', 42),
  ]);
  c.show(
    'model-card',
    caption(
      foot,
      'Model card   ·   Uses, exclusions, thresholds and errors by group',
      'yellow',
      38,
    ),
  );
}
