import { REPORT } from '../construction.mjs';
import { evidenceSnapshot, repairTrace, repairedParser } from '../model.mjs';
import {
  drawSandboxArtifactHeader,
  drawSandboxCard,
  drawSandboxStage,
  drawSandboxText,
  drawSandboxUpgradeArrow,
  drawSandboxUpgradeCard,
  drawSandboxUpgradeFooter,
  drawSandboxUpgradePanel,
  drawSandboxUpgradeText,
  sandboxCueProgress,
} from '../defaults.mjs';
export function paintEvidenceLoopLegacy(
  ctx,
  scene,
  state,
  api,
  themeColors,
  c,
  phase,
  t,
  currentBeat,
  beatProgress,
  routeProgress,
) {
  const v = evidenceSnapshot(currentBeat, beatProgress),
    mono = (text, x, y, color = themeColors.ink, size = 24) =>
      api.text(ctx, text, x, y, size, color, 'left', 'mono');
  drawSandboxText(
    ctx,
    api,
    themeColors,
    'Actual XML fixture · source order X1 → X4',
    135,
    270,
    31,
    themeColors.blue,
  );
  mono(
    '<testsuite xmlns="urn:junit">',
    135,
    330,
    currentBeat === 2 && v.seconds >= 4.2 ? themeColors.yellow : themeColors.blue,
  );
  v.records.forEach((row, index) => {
    const y = 370 + index * 108,
      decision = v.decisions[index],
      active = index === v.inspected - 1;
    const color = decision
      ? decision.decision.startsWith('retain')
        ? themeColors.green
        : themeColors.muted
      : currentBeat === 1 && index === 0
        ? themeColors.pink
        : themeColors.ink;
    if (active) api.rect(ctx, 115, y - 27, 1030, 96, themeColors.panel, themeColors.yellow, 8);
    api.focus.target('xml-records', () =>
      mono('  <testcase classname="' + row.className + '"', 135, y, color),
    );
    api.focus.target('xml-records', () =>
      mono(
        '    name="' + row.name + '"><' + row.children[0].tag + '/></testcase>',
        135,
        y + 36,
        color,
      ),
    );
    drawSandboxText(
      ctx,
      api,
      themeColors,
      row.id,
      1090,
      y + 15,
      24,
      active ? themeColors.yellow : themeColors.muted,
      'right',
    );
  });
  mono('</testsuite>', 135, 825, themeColors.blue);
  if (currentBeat === 0) {
    api.focus.target('case-contract', () =>
      drawSandboxCard(
        ctx,
        api,
        themeColors,
        c,
        'Contract\nfailure or error children',
        1220,
        350,
        570,
        themeColors.yellow,
        145,
        30,
      ),
    );
    if (v.seconds >= 4.7375)
      drawSandboxCard(
        ctx,
        api,
        themeColors,
        c,
        'Identity\nclass + name',
        1220,
        535,
        570,
        themeColors.cyan,
        130,
        29,
      );
    if (v.seconds >= 6.3)
      drawSandboxCard(
        ctx,
        api,
        themeColors,
        c,
        'First-seen order\nKeep one row per identity',
        1220,
        690,
        570,
        themeColors.green,
        145,
        27,
      );
  } else if (currentBeat === 1) {
    api.focus.target('parser-lookup', () =>
      mono('case.attrib["status"]', 1230, 350, themeColors.pink, 27),
    );
    drawSandboxText(
      ctx,
      api,
      themeColors,
      v.failed ? "KeyError: 'status'" : 'Read the first testcase attributes',
      1220,
      430,
      29,
      v.failed ? themeColors.pink : themeColors.muted,
    );
    if (v.seconds >= 6.0625) mono('command: parse report.xml', 1220, 545, themeColors.ink, 24);
    if (v.seconds >= 6.9375) mono('exit: 1', 1220, 595, themeColors.pink);
    if (v.seconds >= 7.8875) mono("error: KeyError: 'status'", 1220, 645, themeColors.pink);
    if (v.seconds >= 9.525) {
      drawSandboxText(
        ctx,
        api,
        themeColors,
        'Bounded excerpt · ' + Buffer.byteLength(repairTrace().byteLimitedExcerpt) + ' / 160 bytes',
        1220,
        720,
        26,
        themeColors.yellow,
      );
      mono('<testcase ...><failure/>', 1220, 765, themeColors.blue, 23);
    }
  } else {
    drawSandboxText(
      ctx,
      api,
      themeColors,
      'Read direct children in urn:junit',
      1220,
      290,
      28,
      themeColors.cyan,
    );
    v.decisions.forEach((decision, index) =>
      drawSandboxText(
        ctx,
        api,
        themeColors,
        decision.id + ' · ' + decision.decision,
        1220,
        355 + index * 65,
        27,
        decision.decision.startsWith('retain') ? themeColors.green : themeColors.muted,
      ),
    );
    drawSandboxText(
      ctx,
      api,
      themeColors,
      'Unique output · first-seen order',
      1220,
      665,
      27,
      themeColors.yellow,
    );
    v.rows.forEach((row, index) => {
      const [name, tag] = row.replace('ReportParser::', '').split(' · ');
      api.focus.target('retained-identities', () =>
        drawSandboxText(
          ctx,
          api,
          themeColors,
          index + 1 + '. ReportParser :: ' + name,
          1220,
          715 + index * 75,
          23,
          themeColors.green,
        ),
      );
      drawSandboxText(ctx, api, themeColors, tag, 1260, 748 + index * 75, 24, themeColors.green);
    });
    if (v.checked)
      drawSandboxText(
        ctx,
        api,
        themeColors,
        'PASS · expected identities and order',
        960,
        915,
        31,
        themeColors.green,
        'center',
      );
  }
}
export function paintEvidenceLoop(
  ctx,
  scene,
  state,
  api,
  themeColors,
  c,
  currentBeat,
  beatProgress,
  id,
  on,
  done,
) {
  drawSandboxArtifactHeader(ctx, api, themeColors);
  if (currentBeat < 3) {
    const count =
        currentBeat < 2
          ? 0
          : Math.min(4, Math.ceil(sandboxCueProgress(ctx, api, id, 'scan-cases') * 4)),
      rows = REPORT.slice(0, count),
      seen = new Set();
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      'Actual namespaced fixture · source order',
      160,
      325,
      34,
      themeColors.blue,
    );
    REPORT.forEach((r, i) => {
      const y = 385 + i * 125,
        active = currentBeat === 2 && i === Math.max(0, count - 1),
        key = r.className + '::' + r.name;
      let outcome = 'not inspected',
        col = themeColors.muted;
      if (i < count) {
        const tag = r.children[0].tag;
        outcome = tag === 'skipped' ? 'skipped' : seen.has(key) ? 'duplicate' : 'retain ' + tag;
        if (tag !== 'skipped') seen.add(key);
        col = outcome.startsWith('retain') ? themeColors.green : themeColors.muted;
      }
      if (active)
        drawSandboxUpgradePanel(
          ctx,
          api,
          themeColors,
          c,
          135,
          y - 35,
          1110,
          105,
          themeColors.yellow,
        );
      drawSandboxUpgradeText(
        ctx,
        api,
        themeColors,
        r.id,
        170,
        y,
        28,
        active ? themeColors.yellow : themeColors.muted,
      );
      drawSandboxUpgradeText(ctx, api, themeColors, r.className + ' :: ' + r.name, 240, y, 30, col);
      drawSandboxUpgradeText(
        ctx,
        api,
        themeColors,
        '<' + r.children[0].tag + '/>',
        300,
        y + 48,
        29,
        col,
        'left',
        true,
      );
      if (currentBeat === 2)
        drawSandboxUpgradeText(ctx, api, themeColors, outcome, 1540, y + 25, 29, col, 'center');
    });
    if (currentBeat === 0) {
      drawSandboxUpgradeText(
        ctx,
        api,
        themeColors,
        'Select direct failure / error',
        1550,
        450,
        31,
        themeColors.yellow,
        'center',
      );
      drawSandboxUpgradeText(
        ctx,
        api,
        themeColors,
        'Key: classname + name',
        1550,
        580,
        30,
        themeColors.cyan,
        'center',
      );
      drawSandboxUpgradeText(
        ctx,
        api,
        themeColors,
        'First seen only',
        1550,
        710,
        31,
        themeColors.green,
        'center',
      );
    }
    if (currentBeat === 1) {
      drawSandboxUpgradeCard(
        ctx,
        api,
        themeColors,
        c,
        'case.attrib["status"]',
        1280,
        390,
        500,
        100,
        themeColors.pink,
        28,
      );
      drawSandboxUpgradeText(
        ctx,
        api,
        themeColors,
        "KeyError: 'status'",
        1530,
        590,
        36,
        themeColors.pink,
        'center',
      );
      drawSandboxUpgradeText(
        ctx,
        api,
        themeColors,
        'command / exit 1 / bounded bytes',
        1530,
        750,
        27,
        themeColors.yellow,
        'center',
      );
    }
    if (currentBeat === 2 && count === 4) {
      const output = repairedParser(rows).rows;
      drawSandboxUpgradeText(
        ctx,
        api,
        themeColors,
        'Retained identities',
        960,
        915,
        32,
        themeColors.green,
        'center',
      );
      drawSandboxUpgradeText(
        ctx,
        api,
        themeColors,
        output.map((v) => v.split(' · ')[0]).join('  /  '),
        960,
        970,
        28,
        themeColors.green,
        'center',
      );
    }
  } else {
    const cases = [
      ['Direct skipped + error', 'SKIP'],
      ['Foreign namespace failure', 'IGNORE'],
      ['details → failure', 'IGNORE'],
      ['Selected blank identifier', 'REJECT'],
    ];
    cases.forEach(([v, result], i) => {
      const y = 365 + i * 135;
      drawSandboxUpgradeCard(ctx, api, themeColors, c, v, 140, y, 1040, 90, themeColors.blue, 31);
      drawSandboxUpgradeArrow(
        ctx,
        api,
        themeColors,
        1210,
        y + 45,
        1370,
        y + 45,
        themeColors.yellow,
      );
      drawSandboxUpgradeCard(
        ctx,
        api,
        themeColors,
        c,
        result,
        1410,
        y,
        360,
        90,
        result === 'REJECT' ? themeColors.pink : themeColors.yellow,
        33,
      );
    });
  }
  drawSandboxUpgradeFooter(
    ctx,
    api,
    themeColors,
    'Direct children in root namespace; one identity per selected case; malformed XML is rejected',
  );
}
export function drawEvidenceLoop(ctx, scene, state, api) {
  return drawSandboxStage(ctx, scene, state, api, paintEvidenceLoop, paintEvidenceLoopLegacy);
}
export default {
  id: 'evidence-loop',
  draw: drawEvidenceLoop,
  cues: [
    'evidence-loop-b1-1',
    'evidence-loop-b1-2',
    'evidence-loop-b2-1',
    'evidence-loop-b3-1',
    'evidence-loop-b3-2',
    'evidence-loop-scan-cases',
    'evidence-loop-extension-4',
    'evidence-loop-skip-priority',
    'evidence-loop-namespace-exclusion',
    'evidence-loop-reject-identity',
  ],
};
