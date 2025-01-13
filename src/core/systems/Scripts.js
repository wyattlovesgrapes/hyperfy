import { System } from './System'

import * as THREE from '../extras/three'
import { DEG2RAD, RAD2DEG } from '../extras/general'

/**
 * Script System
 *
 * - Runs on both the server and client.
 * - Executes scripts inside secure compartments
 *
 */

export class Scripts extends System {
  constructor(world) {
    super(world)
    this.compartment = new Compartment({
      console: {
        log: (...args) => console.log(...args),
        error: (...args) => console.error(...args),
        time: (...args) => console.time(...args),
        timeEnd: (...args) => console.timeEnd(...args),
      },
      eval: undefined,
      harden: undefined,
      lockdown: undefined,
      // num: num,
      // clamp: clamp,
      // Layers,
      Object3D: THREE.Object3D,
      Quaternion: THREE.Quaternion,
      Vector3: THREE.Vector3,
      Euler: THREE.Euler,
      Matrix4: THREE.Matrix4,
      // Vector3Lerp: Vector3Lerp,
      // QuaternionLerp: QuaternionLerp,
      // Material: Material,
      // Curve: Curve,
      // Gradient: Gradient,
      DEG2RAD: DEG2RAD,
      RAD2DEG: RAD2DEG,
      // pause: () => this.world.pause(),
    })
  }

  evaluate(code) {
    return {
      exec: this.compartment.evaluate(wrapRawCode(code)),
      code,
    }
  }
}

function wrapRawCode(code) {
  return `
  (function() {
    const shared = {}
    return (world, app) => {
      ${code}
    }
  })()
  `
}
