import { System } from "./System";

/**
 * XR System
 *
 * - Runs on the client.
 * - Keeps track of XR session support and input
 *
 */
export class XR extends System {
  /** @type {XRSession?} */
  session = null;
  supportsVR = false;
  supportsAR = false;

  constructor(world) {
    super(world)
  }

  async init() {
    this.supportsVR = await navigator.xr.isSessionSupported("immersive-vr");
    this.supportsAR = await navigator.xr.isSessionSupported("immersive-ar");
    // TODO: XR Input
  }

  setSession(session) {
    this.session = session;
  }
}