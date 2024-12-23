import { PlayerLocal } from '../extras/PlayerLocal'
import { PlayerRemote } from '../extras/PlayerRemote'

import { Entity } from './Entity'

export class Player extends Entity {
  constructor(world, data, local) {
    super(world, data, local)
    if (data.owner === this.world.network.id) {
      this.player = new PlayerLocal(this)
    } else {
      this.player = new PlayerRemote(this)
    }
  }

  onChange(data) {
    this.player.onChange(data)
  }

  destroy(local) {
    this.player.destroy()
    super.destroy(local)
  }
}
