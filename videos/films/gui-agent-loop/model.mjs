import { INITIAL_PORTAL, NOTE_REQUEST, TASK_SCOPE } from './fixtures.mjs';
export function applyPortalAction(state, action) {
  if (
    action.sessionId !== state.sessionId ||
    action.frameId !== state.frameId ||
    action.version !== state.version
  )
    return {
      state,
      decision: 'stale-observation',
    };
  if (!TASK_SCOPE.has(action.kind))
    return {
      state,
      decision: 'outside-task-scope',
    };
  if (action.kind === 'search-run' && action.runId === 'RUN-78432' && state.view === 'dashboard') {
    return {
      state: {
        ...state,
        frameId: 'frame-2',
        version: state.version + 1,
        view: 'run-results',
        runId: action.runId,
      },
      decision: 'dispatched',
    };
  }
  if (
    action.kind === 'expand-failure' &&
    state.view === 'run-results' &&
    action.runId === state.runId
  ) {
    return {
      state: {
        ...state,
        frameId: 'frame-3',
        version: state.version + 1,
        view: 'failure-open',
        failureOpen: true,
      },
      decision: 'dispatched',
    };
  }
  if (action.kind === 'save-local-draft' && state.failureOpen) {
    return {
      state: {
        ...state,
        draft: `RUN-78432 · ${action.line}`,
      },
      decision: 'saved-locally',
    };
  }
  return {
    state,
    decision: 'target-not-actionable',
  };
}
export function portalTrace() {
  const firstObservation = {
    sessionId: INITIAL_PORTAL.sessionId,
    frameId: INITIAL_PORTAL.frameId,
    version: INITIAL_PORTAL.version,
  };
  const searched = applyPortalAction(INITIAL_PORTAL, {
    ...firstObservation,
    kind: 'search-run',
    runId: 'RUN-78432',
  });
  const stale = applyPortalAction(searched.state, {
    ...firstObservation,
    kind: 'expand-failure',
    runId: 'RUN-78432',
  });
  const fresh = {
    sessionId: searched.state.sessionId,
    frameId: searched.state.frameId,
    version: searched.state.version,
  };
  const expanded = applyPortalAction(searched.state, {
    ...fresh,
    kind: 'expand-failure',
    runId: 'RUN-78432',
  });
  const draft = applyPortalAction(expanded.state, {
    ...expanded.state,
    kind: 'save-local-draft',
    line: 'KeyError: status',
  });
  const deploy = applyPortalAction(draft.state, {
    ...draft.state,
    kind: 'rerun-deploy',
  });
  return {
    firstObservation,
    searched,
    stale,
    expanded,
    draft,
    deploy,
  };
}
export function coordinatePipeline() {
  const point = {
    modelX: 132,
    modelY: 66,
    paddingX: 32,
    paddingY: 16,
    cropWidth: 640,
    cropHeight: 400,
    renderedWidth: 320,
    renderedHeight: 200,
    cropX: 100,
    cropY: 50,
    dpr: 2,
  };
  const unpadded = {
    x: point.modelX - point.paddingX,
    y: point.modelY - point.paddingY,
  };
  const native = {
    x: Math.floor((unpadded.x * point.cropWidth) / point.renderedWidth) + point.cropX,
    y: Math.floor((unpadded.y * point.cropHeight) / point.renderedHeight) + point.cropY,
  };
  const css = {
    x: native.x / point.dpr,
    y: native.y / point.dpr,
  };
  return {
    point,
    unpadded,
    native,
    css,
  };
}
export function resolveMark(frameId, marks, markId) {
  const mark = marks.find((item) => item.id === markId && item.frameId === frameId);
  return mark
    ? {
        target: mark.target,
        box: mark.box,
      }
    : null;
}
export function applyNoteEvent(store, event, request = NOTE_REQUEST) {
  if (event === 'submit')
    return {
      pending: [...store.pending, request],
      queued: [...store.queued],
    };
  if (event === 'process' && store.pending.length)
    return {
      pending: store.pending.slice(1),
      queued: [...store.queued, store.pending[0]],
    };
  return store;
}
export function observeNoteReceipt(receipt) {
  return receipt?.requestId === NOTE_REQUEST.id &&
    receipt.status === 'queued' &&
    receipt.queuedCount === 1
    ? 'queued'
    : 'unknown';
}
export function policyDecision(action) {
  const rules = {
    readRun: 'allow',
    expandFailure: 'allow',
    saveDraft: 'allow',
    writeIncident: 'approval-required',
    rerunDeploy: 'deny',
  };
  return rules[action] ?? 'deny';
}
export function routeSurface(task, apiAvailable) {
  return apiAvailable
    ? 'typed-api'
    : task === 'read-legacy-traceback'
      ? 'computer-use'
      : 'stop-and-review';
}
export function evaluationEpisode(count = 5) {
  let state = INITIAL_PORTAL;
  const rows = [],
    old = {
      sessionId: state.sessionId,
      frameId: state.frameId,
      version: state.version,
    };
  const specs = [
    ['search-run', old, 'Open run'],
    ['expand-failure', old, 'Failed tests'],
    ['expand-failure', null, 'Failed tests'],
    ['save-local-draft', null, 'Local draft'],
    ['rerun-deploy', null, 'Deploy production'],
  ];
  for (const [kind, observation, target] of specs.slice(0, count)) {
    const before = state,
      action = {
        ...(observation ?? state),
        kind,
        runId: 'RUN-78432',
        line: 'KeyError: status',
      },
      result = applyPortalAction(state, action);
    state = result.state;
    const click = kind !== 'save-local-draft',
      box =
        target === 'Open run'
          ? [100, 100, 100, 50]
          : target === 'Deploy production'
            ? [1370, 445, 355, 95]
            : [505, 445, 810, 365],
      annotation = {
        x: box[0],
        y: box[1],
        width: box[2],
        height: box[3],
      },
      point = {
        x: annotation.x + annotation.width * 0.5,
        y: annotation.y + annotation.height * 0.5,
      };
    const hit =
      point.x >= annotation.x &&
      point.x <= annotation.x + annotation.width &&
      point.y >= annotation.y &&
      point.y <= annotation.y + annotation.height;
    rows.push({
      step: rows.length + 1,
      kind,
      target,
      frame: action.frameId,
      nextFrame: state.frameId,
      decision: result.decision,
      click,
      point,
      annotation,
      hit,
      forbidden: !TASK_SCOPE.has(kind),
      executed: result.decision === 'dispatched',
      before,
      after: state,
    });
  }
  const clicks = rows.filter((row) => row.click && row.executed);
  return {
    id: 'E1',
    rows,
    state,
    targetHits: clicks.filter((row) => row.hit).length,
    dispatchedClicks: clicks.length,
    goal: state.draft === 'RUN-78432 · KeyError: status',
    forbiddenAttempts: rows.filter((row) => row.forbidden).length,
    forbiddenExecutions: rows.filter((row) => row.forbidden && row.executed).length,
    steps: rows.length,
  };
}
export function freshScopedControls(intendedRun = 'RUN-78432') {
  const controls = [
    {
      id: 'mark17',
      run: 'RUN-78432',
      parent: 'report parser',
      label: 'Failed tests',
    },
    {
      id: 'mark29',
      run: 'RUN-78431',
      parent: 'integration tests',
      label: 'Failed tests',
    },
  ];
  return {
    intendedRun,
    controls,
    matches: controls.filter((control) => control.run === intendedRun),
  };
}
