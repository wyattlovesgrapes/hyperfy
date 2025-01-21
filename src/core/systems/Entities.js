import { App } from '../entities/App'
import { Player } from '../entities/Player'
import { System } from './System'

const Types = {
  app: App,
  player: Player,
}

/**
 * Entities System
 *
 * - Runs on both the server and client.
 * - Supports inserting entities into the world
 * - Executes entity scripts
 *
 */
export class Entities extends System {
  constructor(world) {
    super(world)
    this.items = new Map()
    this.players = new Map()
    this.hot = new Set()
    this.removed = []
  }

  get(id) {
    return this.items.get(id)
  }

  getPlayer(userId) {
    return this.players.get(userId)
  }

  add(data, local) {
    const Entity = Types[data.type]
    const entity = new Entity(this.world, data, local)
    this.items.set(entity.data.id, entity)
    if (data.owner === this.world.network.id) {
      this.player = entity
    }
    if (data.type === 'player') {
      this.players.set(entity.data.user.id, entity)
    }
    return entity
  }

  remove(id) {
    const entity = this.items.get(id)
    if (!entity) console.warn(`tried to remove entity that did not exist: ${id}`)
    if (entity.isPlayer) this.players.delete(entity.data.user.id)
    entity.destroy()
    this.items.delete(id)
    this.removed.push(id)
  }

  setHot(entity, hot) {
    if (hot) {
      this.hot.add(entity)
    } else {
      this.hot.delete(entity)
    }
  }

  fixedUpdate(delta) {
    for (const entity of this.hot) {
      entity.fixedUpdate(delta)
    }
  }

  update(delta) {
    for (const entity of this.hot) {
      entity.update(delta)
    }
  }

  lateUpdate(delta) {
    for (const entity of this.hot) {
      entity.lateUpdate(delta)
    }
  }

  serialize() {
    const data = []
    this.items.forEach(entity => {
      data.push(entity.serialize())
    })
    return data
  }

  deserialize(datas) {
    for (const data of datas) {
      this.add(data)
    }
  }
}
