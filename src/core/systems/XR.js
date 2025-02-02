import { System } from './System'
import * as THREE from '../extras/three'

/**
 * XR System
 *
 * - Runs on the client.
 * - Keeps track of XR session support and input
 *
 */
export class XR extends System {
  /** @type {XRSession?} */
  session = null
  supportsVR = false
  supportsAR = false
  input = {
    left: {
      axes: [],
      buttons: [],
    },
    right: {
      axes: [],
      buttons: [],
    },
  }
  v1 = new THREE.Vector3()

  constructor(world) {
    super(world)
  }

  async init() {
    this.supportsVR = await navigator.xr.isSessionSupported('immersive-vr')
    this.supportsAR = await navigator.xr.isSessionSupported('immersive-ar')
  }

  preFixedUpdate() {
    if (!this.session) return

    this.session.inputSources?.forEach(inputSource => {
      if (!inputSource.gamepad || inputSource.handedness === 'none') return

      this.input[inputSource.handedness].axes = inputSource.gamepad.axes.slice()
      this.input[inputSource.handedness].buttons = inputSource.gamepad.buttons.slice()
    })

    // Update player moveDir based on axis input
    // TODO: Handle touchpad input
    this.v1.set(this.input.left.axes[2], 0, this.input.left.axes[3])
    this.v1.applyQuaternion(this.world.camera.quaternion)
    this.world.entities.player.stick = {
      center: {
        x: 0,
        y: 0,
      },
      touch: {
        position: {
          x: this.v1.x,
          y: this.v1.z,
        },
      },
    }
  }

  setSession(session) {
    this.session = session
  }
}
