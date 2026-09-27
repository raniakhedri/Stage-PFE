/** Decart only uses this worker for latency stats. Under Vite it crashes and drops the video. */
export function isFrameMetadataRuntimeSupported() {
  return false
}

export function isFrameMetadataWorkerSameOrigin() {
  return false
}

export function createFrameMetadataWorker() {
  throw new Error('frame metadata disabled')
}

export class FrameMetadataTracker {
  markStart() {}
  recordFrame() {}
  snapshot() { return {} }
  reset() {}
}

export function createBrowserFrameMetadataDiagnostics() {
  return {
    attachRemoteVideoTrack() {},
    markStart() {},
    snapshot() { return {} },
    dispose() {},
  }
}
