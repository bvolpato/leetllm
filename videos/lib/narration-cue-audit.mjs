export const CUE_ONSET_GRACE_SECONDS = 0.12;
export const CUE_ONSET_GRACE_FRACTION = 0.2;
export const CUE_TARGET_FRAME_WIDTH = 1920;
export const CUE_TARGET_FRAME_HEIGHT = 1080;
// Match the layout audit's half-pixel tolerance for transformed geometry.
export const CUE_TARGET_FRAME_EDGE_TOLERANCE = 0.5;

function spokenCuesAtTime(cues, time) {
  return cues.filter((cue) => {
    const grace = Math.min(
      CUE_ONSET_GRACE_SECONDS,
      (cue.end - cue.start) * CUE_ONSET_GRACE_FRACTION,
    );
    return time >= cue.start + grace && time < cue.end;
  });
}

export function cueTargetIssues(audit, cue, { checkOpacity = true } = {}) {
  const parts = audit.targets.filter((part) => cue.targets.includes(part.id));
  const issues = [];
  const issue = (type, target, detail = {}) => ({
    type,
    cue: cue.id,
    target,
    scope: `${cue.id}/${target}`,
    ...detail,
  });
  for (const id of cue.targets) {
    if (!parts.some((part) => part.id === id)) issues.push(issue('unpainted-narrated-target', id));
  }
  for (const part of parts) {
    const bounds = { x: part.x, y: part.y, width: part.width, height: part.height };
    if (!Object.values(bounds).every(Number.isFinite) || part.width <= 0 || part.height <= 0) {
      issues.push(issue('invalid-narrated-target-bounds', part.id, { bounds }));
    } else if (
      part.x < -CUE_TARGET_FRAME_EDGE_TOLERANCE ||
      part.y < -CUE_TARGET_FRAME_EDGE_TOLERANCE ||
      part.x + part.width > CUE_TARGET_FRAME_WIDTH + CUE_TARGET_FRAME_EDGE_TOLERANCE ||
      part.y + part.height > CUE_TARGET_FRAME_HEIGHT + CUE_TARGET_FRAME_EDGE_TOLERANCE
    ) {
      issues.push(issue('clipped-narrated-target', part.id, { bounds }));
    }
    if (part.width * part.height > 1920 * 1080 * 0.7)
      issues.push(issue('focus-target-covers-most-of-frame', part.id));
    if (checkOpacity && (!Number.isFinite(part.alpha) || part.alpha < 0.35)) {
      issues.push(issue('faint-narrated-target', part.id, { alpha: part.alpha }));
    }
  }
  return issues;
}

export function narratedTargetsAtTime(audit, cues, time) {
  let checkedCues = 0,
    checkedTargets = 0;
  const issues = [];
  for (const cue of spokenCuesAtTime(cues, time)) {
    checkedCues++;
    checkedTargets += cue.targets.length;
    issues.push(...cueTargetIssues(audit, cue));
  }
  return { checkedCues, checkedTargets, issues };
}

export function cueVisibilityCoverage(cues, frames, fps) {
  const coverage = {
    onsetGraceSeconds: CUE_ONSET_GRACE_SECONDS,
    maximumGraceFraction: CUE_ONSET_GRACE_FRACTION,
    checkedFrames: 0,
    checkedCueFrames: 0,
    checkedTargets: 0,
  };
  for (let frame = 0; frame < frames; frame++) {
    const active = spokenCuesAtTime(cues, frame / fps);
    if (active.length) coverage.checkedFrames++;
    coverage.checkedCueFrames += active.length;
    coverage.checkedTargets += active.reduce((total, cue) => total + cue.targets.length, 0);
  }
  return coverage;
}
