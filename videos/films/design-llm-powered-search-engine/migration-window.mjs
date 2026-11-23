import { SEARCH_TEXT } from './fixtures.mjs';

export const generalWindow = Number(SEARCH_TEXT.policy.match(/within (\d+) days/)[1]);

export function migrationDecision(revision, proposedDay, approval) {
  const source = revision === 1 ? SEARCH_TEXT.exception : SEARCH_TEXT.fresh;
  const exceptionDays = Number(source.match(/within (\d+) days/)[1]);
  const qualifies = approval.granted && (revision === 1 || approval.beforeFriday === true);
  const deadline = qualifies ? exceptionDays : generalWindow;
  return { proposedDay, revision, exceptionDays, deadline, fits: proposedDay <= deadline };
}

// The outline shows the conditional extension. The solid band shows the applicable window.
export function drawMigrationWindow(
  ctx,
  api,
  decision,
  { base, offer, extension, record, question, verdict, belowSearchResults = false },
) {
  const { C } = api;
  const left = 175,
    right = 1745,
    top = belowSearchResults ? 682 : 490,
    height = belowSearchResults ? 47 : 76;
  const x = (day) => left + (day / 60) * (right - left);
  const { proposedDay, revision, exceptionDays } = decision;
  if (!belowSearchResults)
    api.text(ctx, 'Parser-v2   /   Service-account migration', left, 266, 37, C.ink);
  api.focus.target('migration-date', () => {
    api.text(
      ctx,
      `Proposed start · day ${proposedDay}`,
      x(proposedDay),
      belowSearchResults ? 620 : 370,
      42,
      C.yellow,
      'center',
    );
    api.line(
      ctx,
      x(proposedDay),
      belowSearchResults ? 631 : 397,
      x(proposedDay),
      top - 20,
      C.yellow,
      4,
    );
    api.path(
      ctx,
      [
        { x: x(proposedDay) - 11, y: top - 22 },
        { x: x(proposedDay) + 11, y: top - 22 },
        { x: x(proposedDay), y: top - 6 },
      ],
      { fill: C.yellow, closed: true, width: 0 },
    );
  });
  api.line(ctx, left, top + height + 14, right, top + height + 14, C.muted, 2);
  for (const day of [0, 15, 30, 45, 60]) {
    api.line(ctx, x(day), top + height + 14, x(day), top + height + 30, C.muted, 2);
    api.text(
      ctx,
      day === 0 ? 'Notice · day 0' : String(day),
      x(day),
      top + height + 69,
      29,
      C.muted,
      day === 0 ? 'left' : 'center',
    );
  }
  api.focus.target('migration-base', () => {
    if (base > 0) {
      api.rect(ctx, left, top, x(generalWindow * base) - left, height, C.blue, undefined, 3);
      if (!belowSearchResults)
        api.text(ctx, `policy@2   ·   ${generalWindow} days`, left, 710, 34, C.blue);
    }
  });
  api.focus.target('migration-extension', () => {
    if (offer > 0) {
      const start = x(generalWindow) + 4;
      const width = (x(exceptionDays) - start) * offer;
      if (width > 1) api.rect(ctx, start, top, width, height, C.panel, C.green, 3);
      const filled = width * extension;
      if (filled > 1) api.rect(ctx, start, top, filled, height, C.green, undefined, 3);
      if (!belowSearchResults)
        api.text(
          ctx,
          `exception@${revision}   ·   ${exceptionDays} days with security approval`,
          x(generalWindow) + 6,
          710,
          32,
          C.green,
        );
      if (revision === 2)
        api.text(ctx, 'recorded before Friday', x(generalWindow) + 6, 754, 32, C.green);
    }
  });
  api.line(
    ctx,
    left,
    belowSearchResults ? 825 : 797,
    right,
    belowSearchResults ? 825 : 797,
    C.muted,
    2,
  );
  api.focus.target('migration-record', () => {
    if (record || !belowSearchResults)
      api.text(
        ctx,
        record || 'Approval record',
        left,
        belowSearchResults ? 891 : 864,
        34,
        record ? C.ink : C.muted,
      );
  });
  api.focus.target('migration-decision', () => {
    if (verdict) {
      const color = decision.fits ? C.green : C.pink;
      api.text(
        ctx,
        decision.fits
          ? `Day ${proposedDay} is inside the window.`
          : `Day ${proposedDay} is outside the window.`,
        left,
        966,
        49,
        color,
      );
      api.text(ctx, `Deadline · day ${decision.deadline}`, right, 961, 36, color, 'right');
    } else if (question) {
      api.text(ctx, question, left, 964, 42, C.yellow);
    }
  });
}
