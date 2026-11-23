import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { LAYOUT_AUDIT_RULES } from './frame-audit.mjs';

const FRAME_WIDTH = 1920;
const FRAME_HEIGHT = 1080;

function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character],
  );
}

function printable(value) {
  if (value === undefined || value === null || value === '') return 'Not recorded';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function number(value) {
  return Number.isFinite(value);
}

function box(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (![value.x, value.y].every(number)) return null;
  if (number(value.r))
    return { x: value.x - value.r, y: value.y - value.r, width: value.r * 2, height: value.r * 2 };
  const width = value.width ?? value.w,
    height = value.height ?? value.h;
  if (![width, height].every(number)) return null;
  return { x: value.x, y: value.y, width, height };
}

function boxes(value) {
  if (Array.isArray(value)) return value.flatMap(boxes);
  const bounds = box(value);
  return bounds ? [bounds] : [];
}

function formatTime(seconds) {
  if (!number(seconds)) return 'time unavailable';
  const millis = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(millis / 3_600_000);
  const minutes = Math.floor((millis % 3_600_000) / 60_000);
  const secs = Math.floor((millis % 60_000) / 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis % 1000).padStart(3, '0')}`;
}

function normalizedRules(report) {
  const explicit = report.ruleCoverage ?? report.coverage?.rules;
  if (Array.isArray(explicit)) return explicit.map(printable);
  if (explicit && typeof explicit === 'object')
    return Object.entries(explicit)
      .filter(([, enabled]) => enabled === true || enabled?.enabled === true)
      .map(([name]) => name);
  return LAYOUT_AUDIT_RULES;
}

function prepareEntries(lesson, timeline, report) {
  const entries = [];
  const summaries = report.scenes ?? [];
  for (const summary of summaries) {
    const sceneId = typeof summary.scene === 'string' ? summary.scene : String(summary.scene ?? '');
    const isIntro = sceneId === timeline.intro?.id;
    const sceneIndex = isIntro
      ? -1
      : (timeline.scenes ?? []).findIndex((item) => item.id === sceneId);
    const timing = isIntro ? timeline.intro : timeline.scenes?.[sceneIndex];
    const lessonScene = sceneIndex >= 0 ? lesson.scenes?.[sceneIndex] : null;
    const sceneTitle = isIntro ? 'LeetLLM brand intro' : (lessonScene?.title ?? sceneId);
    const issues = summary.issues ?? [];
    if (issues.length && !timing)
      throw new Error(`Cannot locate timeline for audited scene: ${sceneId}`);
    for (const issue of issues) {
      const fps = summary.fps ?? timeline.fps;
      const frame = Number.isInteger(issue.firstFrame)
        ? issue.firstFrame
        : number(issue.firstTime) && number(fps) && fps > 0
          ? Math.round(issue.firstTime * fps)
          : 0;
      if (!number(fps) || fps <= 0 || frame < 0)
        throw new Error(`Invalid frame timing for issue in ${sceneId}`);
      const localTime = frame / fps;
      const start = timing?.start ?? 0;
      entries.push({
        issue,
        summary,
        sceneId,
        sceneTitle,
        sceneIndex,
        fps,
        frame,
        localTime,
        globalTime: start + localTime,
        firstFrame: frame,
        lastFrame: Number.isInteger(issue.lastFrame) ? issue.lastFrame : frame,
        firstTime: number(issue.firstTime) ? issue.firstTime : localTime,
        lastTime: number(issue.lastTime) ? issue.lastTime : localTime,
      });
    }
  }
  return entries;
}

function groupEntries(entries) {
  const groups = new Map();
  for (const [index, entry] of entries.entries()) {
    entry.issueNumber = index + 1;
    const key = `${entry.sceneIndex}:${entry.frame}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        sceneIndex: entry.sceneIndex,
        sceneId: entry.sceneId,
        sceneTitle: entry.sceneTitle,
        frame: entry.frame,
        localTime: entry.localTime,
        globalTime: entry.globalTime,
        entries: [],
      };
      groups.set(key, group);
    }
    group.entries.push(entry);
  }
  return [...groups.values()];
}

function relatedLabels(issue, audit) {
  const sought = new Set([issue.text, issue.other].filter((value) => typeof value === 'string'));
  if (!sought.size) return [];
  const scope = issue.group ?? issue.scope;
  return (audit?.labels ?? []).filter((label) => {
    if (!sought.has(label.text)) return false;
    if (scope === undefined) return true;
    const group = (audit.groups ?? []).find((candidate) => candidate.index === label.group);
    return String(group?.id ?? label.group) === String(scope);
  });
}

function connectorPaths(issue, audit) {
  const candidates = [issue.connector, issue].filter(Boolean);
  if (issue.id !== undefined)
    candidates.push(...(audit?.connectors ?? []).filter((item) => item.id === issue.id));
  return candidates.filter(
    (path) =>
      number(path.from?.x) && number(path.from?.y) && number(path.to?.x) && number(path.to?.y),
  );
}

function issueGeometry(issue, audit) {
  const related = relatedLabels(issue, audit);
  const exactBounds = boxes(issue.bounds ?? issue.shape);
  const labelBounds = related.map((label) => box(label)).filter(Boolean);
  const scopeId = issue.group ?? issue.scope;
  const group =
    scopeId === undefined
      ? null
      : (audit?.groups ?? []).find((item) => String(item.id) === String(scopeId));
  const containers = [issue.container, group, group?.content].flatMap(boxes);
  const paths = connectorPaths(issue, audit);
  if (Array.isArray(issue.points) && issue.points.length > 1) paths.push({ points: issue.points });
  return { exactBounds, labelBounds, containers, paths };
}

function drawBounds(ctx, bounds, color, { dashed = false, marker, label } = {}) {
  ctx.save();
  ctx.setLineDash(dashed ? [12, 8] : []);
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  ctx.fillStyle = `${color}22`;
  ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  if (marker) drawMarker(ctx, marker, bounds.x, bounds.y, color, label);
  ctx.restore();
}

function drawMarker(ctx, marker, x, y, color, label) {
  ctx.save();
  const px = Math.max(28, Math.min(FRAME_WIDTH - 28, x + 16));
  const py = Math.max(28, Math.min(FRAME_HEIGHT - 28, y + 16));
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(px, py, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#07101d';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(marker), px, py);
  if (label) {
    ctx.font = '14px system-ui, sans-serif';
    const width = Math.min(620, ctx.measureText(label).width + 18);
    const labelX = Math.min(FRAME_WIDTH - width - 8, px + 24);
    ctx.fillStyle = '#07101de8';
    ctx.fillRect(labelX, py - 14, width, 28);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(labelX, py - 14, width, 28);
    ctx.fillStyle = '#f4f7ff';
    ctx.textAlign = 'left';
    ctx.fillText(label, labelX + 9, py, Math.max(0, width - 18));
  }
  ctx.restore();
}

function drawPath(ctx, path, color, marker) {
  const points = path.points ?? [path.from, path.to];
  if (points.length < 2 || !points.every((point) => number(point?.x) && number(point?.y))) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.setLineDash([10, 7]);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
  ctx.stroke();
  for (const point of [points[0], points.at(-1)]) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  const first = points[0];
  drawMarker(ctx, marker, first.x + 5, first.y + 5, color, 'connector path');
  ctx.restore();
}

function overlayFrame(canvas, audit, entries) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Layout review renderer returned a canvas without a 2D context');
  const scaleX = canvas.width / FRAME_WIDTH,
    scaleY = canvas.height / FRAME_HEIGHT;
  ctx.save();
  ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
  for (const entry of entries) {
    const issue = entry.issue;
    const color = issue.type?.includes('connector') ? '#4edff2' : '#ff637f';
    const geometry = issueGeometry(issue, audit);
    for (const bounds of geometry.containers) drawBounds(ctx, bounds, '#bd91ff', { dashed: true });
    for (const bounds of geometry.exactBounds)
      drawBounds(ctx, bounds, color, {
        marker: entry.issueNumber,
        label: issue.type ?? 'layout issue',
      });
    for (const bounds of geometry.labelBounds)
      drawBounds(ctx, bounds, '#ffc857', {
        dashed: true,
        marker: entry.issueNumber,
        label: issue.type ?? 'layout issue',
      });
    for (const path of geometry.paths) drawPath(ctx, path, '#4edff2', entry.issueNumber);
    if (!geometry.exactBounds.length && !geometry.labelBounds.length && !geometry.paths.length) {
      drawMarker(
        ctx,
        entry.issueNumber,
        40,
        54 + (entry.issueNumber - 1) * 42,
        color,
        `${issue.type ?? 'layout issue'} · ${String(issue.text ?? issue.other ?? 'geometry not recorded').slice(0, 96)}`,
      );
    }
  }
  ctx.restore();
}

function issueRange(entry) {
  const frameRange =
    entry.firstFrame === entry.lastFrame
      ? `frame ${entry.firstFrame}`
      : `frames ${entry.firstFrame}–${entry.lastFrame}`;
  const timeRange =
    entry.firstTime === entry.lastTime
      ? formatTime(entry.firstTime)
      : `${formatTime(entry.firstTime)} to ${formatTime(entry.lastTime)}`;
  return `${frameRange}; ${timeRange}`;
}

function renderIssue(entry) {
  const issue = entry.issue;
  const bounds = issue.bounds ?? issue.shape;
  const geometry = bounds === undefined ? 'No issue bounds were recorded.' : printable(bounds);
  const container = issue.container === undefined ? 'Not recorded' : printable(issue.container);
  const counterpart = issue.other === undefined ? 'Not recorded' : printable(issue.other);
  const connector = issue.connector === undefined ? 'Not recorded' : printable(issue.connector);
  const evidence = entry.frameEvidence
    ? `
    <div class="frames">
      <figure><a href="./${escapeHtml(entry.frameEvidence.clean)}"><img src="./${escapeHtml(entry.frameEvidence.clean)}" alt="Clean frame for issue ${entry.issueNumber}"></a><figcaption>Clean frame · click to open full size</figcaption></figure>
      <figure><a href="./${escapeHtml(entry.frameEvidence.overlay)}"><img src="./${escapeHtml(entry.frameEvidence.overlay)}" alt="Geometry overlay for issue ${entry.issueNumber}"></a><figcaption>Geometry overlay · click to open full size</figcaption></figure>
    </div>`
    : '<p class="missing">Frame evidence could not be rendered from the supplied timeline.</p>';
  return `<article class="finding">
    <h3><span class="number">${entry.issueNumber}</span> ${escapeHtml(printable(issue.type))}</h3>
    <p class="meta">${escapeHtml(formatTime(entry.globalTime))} · ${escapeHtml(entry.sceneTitle)} · ${escapeHtml(issueRange(entry))}</p>
    <dl>
      <dt>Issue text</dt><dd>${escapeHtml(printable(issue.text))}</dd>
      <dt>Counterpart</dt><dd>${escapeHtml(counterpart)}</dd>
      <dt>Bounds</dt><dd><code>${escapeHtml(geometry)}</code></dd>
      <dt>Container</dt><dd><code>${escapeHtml(container)}</code></dd>
      <dt>Path</dt><dd><code>${escapeHtml(connector)}</code></dd>
      <dt>Occurrences</dt><dd>${escapeHtml(printable(issue.occurrences))}</dd>
    </dl>
    ${evidence}
  </article>`;
}

function pageHtml(lesson, report, entries) {
  const coverage = normalizedRules(report);
  const findings = entries.length
    ? entries.map(renderIssue).join('\n')
    : '<p class="empty">No registered layout findings were reported for the audited frames.</p>';
  const ruleItems = coverage.map((rule) => `<li>${escapeHtml(rule)}</li>`).join('');
  const findingTypes = [...new Set(entries.map((entry) => printable(entry.issue.type)))];
  const summary = `<p class="meta">${escapeHtml(printable(report.frames))} frames audited · ${escapeHtml(printable(report.issueFrames ?? 0))} issue frames · ${entries.length} distinct findings</p>`;
  const types = findingTypes.length
    ? `<p>Finding types in this report: ${findingTypes.map(escapeHtml).join(', ')}.</p>`
    : '<p>Finding types in this report: none.</p>';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(lesson.title)} layout review</title>
<style>
:root{color-scheme:dark;--bg:#0a1020;--panel:#111d34;--ink:#e9efff;--muted:#9baac7;--cyan:#63deec;--red:#ff988d;--purple:#bd91ff}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at top,#142542,var(--bg) 52rem);color:var(--ink);font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
main{width:min(1280px,calc(100% - 40px));margin:44px auto 80px}h1,h2,h3{line-height:1.18;letter-spacing:-.025em}h1{font-size:clamp(2rem,5vw,3.5rem);margin:0 0 12px}h2{margin:34px 0 12px;font-size:1.6rem}h3{font-size:1.2rem;margin:0 0 8px}p{margin:.5rem 0}.meta{color:var(--muted)}a{color:var(--cyan)}.notice,.finding{background:linear-gradient(145deg,#14233e,#101a2e);border:1px solid #2b3b59;border-radius:16px;padding:22px;margin:18px 0}.notice strong{color:#ffd780}.coverage{display:flex;flex-wrap:wrap;gap:5px 32px;padding-left:22px}.finding{border-left:3px solid var(--red);padding:22px}.number{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#ff637f;color:#07101d;font:700 14px system-ui;vertical-align:2px;margin-right:5px}dl{display:grid;grid-template-columns:115px minmax(0,1fr);gap:6px 14px;margin:18px 0;color:var(--muted)}dt{color:var(--ink);font-weight:650}dd{margin:0;overflow-wrap:anywhere}code{white-space:pre-wrap;word-break:break-word;font:13px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace}.frames{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr));gap:14px;margin-top:18px}figure{margin:0;min-width:0}figure a{display:block;border:1px solid #334562;border-radius:10px;overflow:hidden;background:#07101d}img{display:block;width:100%;height:auto}figcaption{margin-top:7px;color:var(--muted);font-size:.9rem}.missing,.empty{color:#ffd780}.footer{margin-top:36px;border-top:1px solid #283952;padding-top:16px;color:var(--muted);font-size:.9rem}
</style></head><body><main>
<h1>${escapeHtml(lesson.title)} layout review</h1>
${summary}
<section class="notice"><strong>What this report can tell you</strong>
<p>A passing result means the registered geometry checks found no findings in the audited frames. It does not judge whether a composition feels clear, balanced, readable, or visually polished. Unregistered visual defects require additional checks or human review.</p>
<p>Rule coverage for this report:</p><ul class="coverage">${ruleItems}</ul>${types}</section>
<h2>Findings</h2>${findings}
<p class="footer">Clean frames preserve the original render. Overlay frames mark recorded bounds in red, related labels in amber, containers in violet, and connector paths in cyan. This page uses local files only.</p>
</main></body></html>`;
}

/**
 * Write a local HTML/JSON review and paired clean/overlay PNG evidence.
 * renderFrame takes a zero-based lesson scene index and local scene seconds.
 * Intro findings use scene index -1 so the caller can render its shared intro.
 */
export async function writeLayoutReview({ out, lesson, timeline, report, renderFrame }) {
  if (!out || !lesson || !timeline || !report || typeof renderFrame !== 'function') {
    throw new TypeError(
      'writeLayoutReview requires out, lesson, timeline, report, and renderFrame',
    );
  }
  const output = resolve(out);
  const frameDirName = 'layout-review-frames';
  const frameDirectory = join(output, frameDirName);
  await mkdir(frameDirectory, { recursive: true });
  const entries = prepareEntries(lesson, timeline, report);
  const groups = groupEntries(entries);
  const rendered = [];
  for (const [index, group] of groups.entries()) {
    const result = await renderFrame(group.sceneIndex, group.localTime);
    if (!result?.canvas || typeof result.canvas.encode !== 'function') {
      throw new TypeError(
        `renderFrame must return a canvas with encode('png') for ${group.sceneId} frame ${group.frame}`,
      );
    }
    if (result.canvas.width !== FRAME_WIDTH || result.canvas.height !== FRAME_HEIGHT) {
      throw new Error(
        `Layout review evidence must be ${FRAME_WIDTH}x${FRAME_HEIGHT}; got ${result.canvas.width}x${result.canvas.height}`,
      );
    }
    const stem = `frame-${String(index + 1).padStart(4, '0')}`;
    const clean = `${frameDirName}/${stem}-clean.png`;
    const overlay = `${frameDirName}/${stem}-overlay.png`;
    await writeFile(join(output, clean), await result.canvas.encode('png'));
    overlayFrame(result.canvas, result.audit, group.entries);
    await writeFile(join(output, overlay), await result.canvas.encode('png'));
    group.entries.forEach((entry) => {
      entry.frameEvidence = { clean, overlay };
    });
    rendered.push({
      scene: group.sceneId,
      sceneIndex: group.sceneIndex,
      frame: group.frame,
      localTime: group.localTime,
      globalTime: group.globalTime,
      clean,
      overlay,
      width: result.canvas.width,
      height: result.canvas.height,
      issueNumbers: group.entries.map((entry) => entry.issueNumber),
    });
  }
  const htmlPath = join(output, 'layout-review.html');
  const jsonPath = join(output, 'layout-review.json');
  const data = {
    ...report,
    review: {
      lesson: { id: lesson.id, title: lesson.title },
      generatedAt: new Date().toISOString(),
      ruleCoverage: normalizedRules(report),
      renderedFrames: rendered,
      findings: entries.map((entry) => ({
        issueNumber: entry.issueNumber,
        scene: entry.sceneId,
        sceneTitle: entry.sceneTitle,
        sceneIndex: entry.sceneIndex,
        localTime: entry.localTime,
        globalTime: entry.globalTime,
        frame: entry.firstFrame,
        range: {
          firstFrame: entry.firstFrame,
          lastFrame: entry.lastFrame,
          firstTime: entry.firstTime,
          lastTime: entry.lastTime,
        },
        issue: entry.issue,
        evidence: entry.frameEvidence ?? null,
      })),
    },
  };
  await writeFile(jsonPath, `${JSON.stringify(data, null, 2)}\n`);
  await writeFile(htmlPath, pageHtml(lesson, report, entries));
  return {
    html: htmlPath,
    json: jsonPath,
    frameDirectory,
    renderedFrames: rendered.length,
    findings: entries.length,
  };
}
