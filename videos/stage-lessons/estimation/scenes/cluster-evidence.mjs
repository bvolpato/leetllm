// Scene `cluster-evidence`: the unit of the evidence is the campaign, not the row.
//
// The picture: ten campaigns stand in the tray as ten columns of ten signups. Two columns are pink.
// A row resample takes single dots, and the columns of the resample come out mixed. A campaign
// resample takes whole columns, and one of them lands two times. Each way of resampling leaves its
// distribution on the axis: the one of the rows is narrow, and the one of the campaigns is wide.
import {
  clamp,
  column,
  dynamic,
  dot,
  grid,
  group,
  lerp,
  line,
  linear,
  place,
  rect,
  seededRandom,
  smoothstep,
  tex,
  text,
} from 'vizmatic/stage';
import { clusterBootstrapModel } from '../../../films/estimation/model.mjs';
import { chipRow, heading, label, mono, namedBox, note } from '../../kit-narrated.mjs';
import {
  COLOR,
  HEAD_LEFT,
  LEFT_PANEL,
  READOUT,
  RIGHT_PANEL,
  ROWS,
  TRAY_HEAD,
  mark,
  percent,
  radiusOf,
  rateAxis,
  slots,
} from '../parts.mjs';

/** Ten campaigns of ten signups. The first two are all positive. */
const CAMPAIGNS = 10,
  EACH = 10,
  POSITIVE = 2;
/** The campaigns that one campaign resample draws, by column. Campaign 1 comes two times. */
const DRAWN = [1, 1, 3, 5, 9, 0, 2, 8, 4, 7];
/** The right end of the axis while the two distributions are on it. */
const WIDE = 0.5;
/** The share of a fixed queue that the sample of the last picture takes at first. */
const SMALL_SHARE = 0.1;

export default function clusterEvidence(s, c) {
  const axis = rateAxis(s);
  const model = clusterBootstrapModel();
  const rows = CAMPAIGNS * EACH,
    rate = POSITIVE / CAMPAIGNS;
  const kind = (campaign) => (campaign < POSITIVE ? 'specialist' : 'regular');

  // The tray and the resample: a column is a campaign.
  // The resample is a square at the left of its panel, clear of the staffing line when the axis zooms.
  const side = LEFT_PANEL.height - 90;
  const square = LEFT_PANEL.columns([side, LEFT_PANEL.width - side], 'none')[0];
  const ours = slots(rows, CAMPAIGNS),
    copies = slots(rows, CAMPAIGNS, square);
  const radius = radiusOf(CAMPAIGNS),
    copyRadius = radiusOf(CAMPAIGNS, square);
  const frames = (places, color) => {
    const pitch = places[1][0] - places[0][0];
    return group(
      ...Array.from({ length: CAMPAIGNS }, (_, campaign) =>
        rect(pitch - 6, pitch * EACH - 4, { stroke: color, width: 3, fill: null, radius: 12 }).at(
          places[campaign][0],
          (places[0][1] + places[rows - 1][1]) / 2,
        ),
      ),
    );
  };
  // A row resample: 100 single rows, each from any place of the tray.
  const random = seededRandom(77);
  const rowPicks = Array.from({ length: rows }, () => Math.floor(random() * rows));

  // The values of the scene.
  const colored = s.value(0); // the signups that show their label
  const single = s.value(0); // the draw of the row resample, from 0 to 1
  const rowsShown = s.value(1); // the row resample is on screen
  const whole = s.value(0); // the columns of the campaign resample that are drawn
  const narrow = s.value(0), // the two distributions grow on the axis
    wideOne = s.value(0);
  const share = s.value(SMALL_SHARE); // the share of a fixed queue that a sample takes

  const tray = dynamic(() =>
    ours.map((at, index) =>
      mark(index < colored.value ? kind(index % CAMPAIGNS) : 'selected', radius).at(at),
    ),
  );
  const resample = dynamic(() => {
    const marks = [];
    if (rowsShown.value > 0.02 && single.value > 0)
      rowPicks.forEach((source, slot) => {
        const part = clamp((single.value - (0.6 * slot) / (rows - 1)) / 0.4);
        if (part <= 0) return;
        const eased = smoothstep(part);
        marks.push(
          mark(kind(source % CAMPAIGNS), lerp(radius, copyRadius, eased), rowsShown.value).at(
            lerp(ours[source][0], copies[slot][0], eased),
            lerp(ours[source][1], copies[slot][1], eased),
          ),
        );
      });
    DRAWN.forEach((campaign, column) => {
      const part = clamp(whole.value - column);
      if (part <= 0) return;
      // Lift and resize at the source before crossing any landed identifier.
      const lifted = smoothstep(clamp(part / 0.3));
      const across = smoothstep(clamp((part - 0.3) / 0.7));
      for (let signup = 0; signup < EACH; signup++) {
        const from = ours[signup * CAMPAIGNS + campaign],
          to = copies[signup * CAMPAIGNS + column];
        marks.push(
          mark(kind(campaign), lerp(radius, copyRadius, lifted)).at(
            lerp(from[0], to[0], across),
            lerp(from[1], to[1], lifted),
          ),
        );
      }
    });
    return marks;
  });

  // The two distributions of the resampled fraction, each to its own peak.
  const height = ROWS.height - 86;
  const bars = (mass, step, width, color, grown, opacity) => {
    const peak = Math.max(...mass);
    return mass.flatMap((value, index) => {
      const tall = (value / peak) * height * grown;
      const at = (index * step) / 100;
      if (tall < 0.5 || !axis.inside(at)) return [];
      return [
        rect(width, tall, { fill: color, stroke: null, radius: 3, opacity }).at(
          axis.x(at),
          axis.y - tall / 2,
        ),
      ];
    });
  };
  const distributions = dynamic(() => [
    ...bars(model.campaignMass, 10, 44, COLOR.accepted, wideOne.value, 0.55),
    ...bars(model.rowMass, 1, 12, COLOR.failure, narrow.value, 0.95),
  ]);
  const top = axis.y - height;
  const range = (ends, at, color) => axis.bar(() => ends, { row: () => at, color, weight: 6 });
  const ranges = [
    range(model.rowRange, top - 24, COLOR.failure),
    range(model.campaignRange, top - 60, COLOR.accepted),
  ];

  // The names.
  const trayName = place(label('10 campaigns of 10 signups'), TRAY_HEAD);
  const resampleName = {
    rows: place(label('row resample', { color: COLOR.failure }), HEAD_LEFT, 'left'),
    campaigns: place(label('campaign resample', { color: COLOR.accepted }), HEAD_LEFT, 'left'),
  };
  const observed = axis.point(() => rate, { stem: true });
  const count = mono(`${POSITIVE * EACH} / ${rows} = ${percent(rate)}`, { size: 56 });
  const units = label('10 units of evidence, not 100', { color: COLOR.mark });
  place(column([count, units], { gap: 'wide', align: 'center' }), RIGHT_PANEL);
  const variance = {
    campaigns: tex('\\frac{0.2 \\times 0.8}{10}', { size: 56, color: COLOR.accepted }),
    rows: tex('\\frac{0.2 \\times 0.8}{100}', { size: 56, color: COLOR.failure }),
  };
  const varianceName = { campaigns: note('variance, campaigns'), rows: note('variance, rows') };
  const smaller = note('10 times smaller', { color: COLOR.failure });
  place(
    grid(
      [varianceName.campaigns, variance.campaigns, varianceName.rows, variance.rows, null, smaller],
      { columns: 2, gap: ['normal', 'normal'], align: 'left' },
    ),
    RIGHT_PANEL,
  );

  // A fixed queue moves distinct IDs into the sample without replacement.
  // Text stays at rest. A traveling message is a dot until its ID lands in the sample.
  const QUEUE_SIZE = 20;
  const queueSources = slots(QUEUE_SIZE, 5),
    queueSamples = slots(QUEUE_SIZE, 5, square);
  const queuePitch = queueSources[1][0] - queueSources[0][0],
    samplePitch = queueSamples[1][0] - queueSamples[0][0];
  const exitX = queueSources[0][0] - queuePitch / 2 - 12,
    entryX = queueSamples[4][0] + samplePitch / 2 + 18,
    travelY =
      Math.max(queueSources.at(-1)[1] + queuePitch / 2, queueSamples.at(-1)[1] + samplePitch / 2) +
      36;
  const reviewed = () => Math.floor(QUEUE_SIZE * share.value + 1e-6);
  const queueIDs = dynamic(() =>
    queueSources.flatMap((from, index) => {
      const progress = clamp(QUEUE_SIZE * share.value - index);
      const to = queueSamples[index];
      const id = String(index + 1).padStart(2, '0');
      const color = index % 5 === 0 ? COLOR.specialist : COLOR.sample;
      const marks = [
        rect(queuePitch - 12, queuePitch - 12, {
          stroke: progress > 0 ? 'faint' : 'dim',
          width: 2,
          fill: null,
          radius: 10,
        }).at(from),
        rect(samplePitch - 10, samplePitch - 10, {
          stroke: 'faint',
          width: 2,
          fill: null,
          radius: 10,
        }).at(to),
      ];
      if (progress <= 0) marks.push(text(id, { size: 34, font: 'mono', color: 'dim' }).at(from));
      else if (index < reviewed())
        marks.push(
          rect(samplePitch - 10, samplePitch - 10, {
            stroke: color,
            width: 3,
            fill: 'surface',
            radius: 10,
          }).at(to),
          text(id, { size: 34, font: 'mono', color }).at(to),
        );
      else {
        // Exit through vacated source slots and enter through empty sample slots.
        const path = [
          from,
          [exitX, from[1]],
          [exitX, travelY],
          [entryX, travelY],
          [entryX, to[1]],
          to,
        ];
        const step = progress * (path.length - 1),
          leg = Math.min(path.length - 2, Math.floor(step)),
          part = smoothstep(step - leg);
        marks.push(
          dot(12, color).at(
            lerp(path[leg][0], path[leg + 1][0], part),
            lerp(path[leg][1], path[leg + 1][1], part),
          ),
        );
      }
      return marks;
    }),
  );
  const fixedName = place(label(`fixed queue: ${QUEUE_SIZE} IDs`), TRAY_HEAD);
  const sampleName = place(label('reviewed sample'), HEAD_LEFT, 'left');
  const queueCountSlot = place(mono('20 / 20 reviewed', { size: 40 }), READOUT, 'top');
  const queueCount = dynamic(() =>
    mono(`${reviewed()} / ${QUEUE_SIZE} reviewed`, { size: 40 }).at(
      queueCountSlot.get('x'),
      queueCountSlot.get('y'),
    ),
  );

  // Relative widths share the sample count with the moving IDs. The correction closes at census.
  const widget = RIGHT_PANEL.inset('normal', 'tight').rows(4, 'tight');
  const strip = widget[0].width;
  const plain = (now) => Math.sqrt(SMALL_SHARE / now),
    corrected = (now) =>
      Math.sqrt((SMALL_SHARE / now) * ((QUEUE_SIZE * (1 - now)) / (QUEUE_SIZE - 1)));
  const shareSlot = place(
    mono('100% reviewed', { size: 40, color: COLOR.sample }),
    widget[0],
    'bottom left',
  );
  const queue = dynamic(() =>
    mono(`${percent(reviewed() / QUEUE_SIZE)} reviewed`, { size: 40, color: COLOR.sample }).at(
      shareSlot.get('x'),
      shareSlot.get('y'),
    ),
  );
  const widths = dynamic(() =>
    [
      { reach: plain(reviewed() / QUEUE_SIZE), at: widget[1].cy + 30, color: 'dim' },
      { reach: corrected(reviewed() / QUEUE_SIZE), at: widget[2].cy + 30, color: COLOR.accepted },
    ].flatMap(({ reach, at, color }) => {
      const half = (strip / 2) * reach;
      if (half < 0.1) return [dot(8, color).at(widget[0].cx, at)];
      return [
        line([widget[0].cx - half, at], [widget[0].cx + half, at], { stroke: color, width: 10 }),
        ...[-half, half].map((side) =>
          line([widget[0].cx + side, at - 16], [widget[0].cx + side, at + 16], {
            stroke: color,
            width: 4,
          }),
        ),
      ];
    }),
  );
  const widgetNames = [
    place(note('share of the fixed queue'), widget[0], 'top left'),
    place(note('relative width, no correction'), widget[1], 'top left'),
    place(note('with the correction', { color: COLOR.accepted }), widget[2], 'top left'),
  ];
  const remain = place(chipRow(['label errors', 'future traffic']), widget[3], 'left');

  // Campaign IDs stay with both the original columns and their landed copies.
  const sourceIDs = ours
    .slice(0, CAMPAIGNS)
    .map((at, index) =>
      text(String.fromCharCode(65 + index), { size: 34, font: 'mono', color: 'dim' }).at(
        at[0],
        ours.at(-1)[1] + radius + 34,
      ),
    );
  const copyIDs = dynamic(() =>
    DRAWN.flatMap((campaign, column) =>
      whole.value >= column + 1
        ? [
            text(String.fromCharCode(65 + campaign), {
              size: 34,
              font: 'mono',
              color: COLOR.accepted,
            }).at(copies[column][0], copies.at(-1)[1] + copyRadius + 34),
          ]
        : [],
    ),
  );
  const sampleUnits = place(
    column(
      [
        label('independent campaign IDs', { size: 34 }),
        grid(
          Array.from({ length: CAMPAIGNS }, (_, index) =>
            namedBox(String.fromCharCode(65 + index), { width: 92, height: 84, color: 'dim' }),
          ),
          { columns: 5, gap: 'tight' },
        ),
      ],
      { gap: 'normal', align: 'center' },
    ),
    RIGHT_PANEL,
  );
  const copyFrames = frames(copies, 'grid');
  const sourceFrames = frames(ours, 'dim');
  const signupTitle = text('positive signup share', { size: 29, color: 'dim' }).at(
    axis.title.get('x'),
    axis.title.get('y'),
  );

  // The first picture: ten columns of ten signups, with no label yet.
  s.add(
    heading(c.title),
    tray,
    trayName,
    resample,
    distributions,
    copyIDs,
    copyFrames,
    signupTitle,
    sampleUnits,
  );
  c.take([axis.rule]);
  c.keep([axis.rule]);

  c.show('campaigns', [sourceFrames, ...sourceIDs]);
  c.on('two-positive', () => s.play(colored.to(rows, { duration: 2, ease: linear })));
  c.hide('observed-twenty', sampleUnits, { after: true, lead: 0.4 });
  c.show('observed-twenty', [count, observed], { after: true });
  c.show('not-independent', units);

  // A resample of rows, and then a resample of campaigns.
  c.hide('row-bootstrap', [count, units, observed]);
  c.show('row-bootstrap', resampleName.rows);
  c.on('row-bootstrap', () => {
    s.play(single.to(1, { duration: 2.2, ease: linear }), axis.max.to(WIDE, { duration: 1 }));
    // The completed distribution waits for its variance result.
  });
  c.swap('campaign-bootstrap', resampleName.rows, resampleName.campaigns);
  c.on('campaign-bootstrap', () => {
    s.play(rowsShown.to(0, { duration: 0.4 }));
    s.play(whole.to(CAMPAIGNS, { duration: 3, ease: linear }));
  });
  c.after('variance-campaign', () => s.play(wideOne.to(1, { duration: 0.8 })));
  c.after('variance-rows', () => s.play(narrow.to(1, { duration: 0.8 })));
  c.show('variance-campaign', varianceName.campaigns);
  c.show('variance-campaign', variance.campaigns, { after: true });
  c.show('variance-rows', [varianceName.rows, variance.rows, smaller], { after: true });

  // The ranges, and then a fixed queue.
  c.show('model-comparison', ranges);
  c.hide('finite-queue', [
    distributions,
    ...ranges,
    resample,
    copyIDs,
    copyFrames,
    resampleName.campaigns,
    tray,
    sourceFrames,
    ...sourceIDs,
  ]);
  c.swap(
    'finite-queue',
    [...Object.values(varianceName), variance.campaigns, variance.rows, smaller],
    [queueIDs, sampleName, queueCount, queue, widths, ...widgetNames],
  );
  c.swap('finite-queue', trayName, fixedName);
  // The axis comes back to rest for the next scene, and the sample takes half of the queue.
  c.on('finite-queue', () => s.play(axis.max.to(0.4, { duration: 1 })));
  c.on('finite', () => s.play(share.to(0.5, { duration: 2, ease: linear })));
  c.after('census', () => s.play(share.to(1, { duration: 2.4, ease: linear })));
  c.show('remain', remain);
}
