import { PlayerLocal } from '../extras/PlayerLocal'
import { PlayerRemote } from '../extras/PlayerRemote'

import { Entity } from './Entity'

export class Player extends Entity {
  constructor(world, data, local) {
    super(world, data, local)
    this.isPlayer = true
    if (data.owner === this.world.network.id) {
      this.player = new PlayerLocal(this)
    } else {
      this.player = new PlayerRemote(this)
    }
  }

  modify(data) {
    this.player.modify(data)
  }

  getProxy() {
    if (!this.proxy) {
      const player = this.player
      const position = new THREE.Vector3()
      const rotation = new THREE.Euler()
      const quaternion = new THREE.Quaternion()
      this.proxy = {
        get id() {
          return player.data.user.id
        },
        get name() {
          return player.data.user.name
        },
        get position() {
          return position.copy(player.base.position)
        },
        get rotation() {
          return rotation.copy(player.base.rotation)
        },
        get quaternion() {
          return quaternion.copy(player.base.quaternion)
        },
      }
    }
    return this.proxy
  }

  destroy(local) {
    this.player?.destroy()
    this.player = null
    super.destroy(local)
  }
}
