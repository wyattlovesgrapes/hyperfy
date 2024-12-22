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
    this.entities = new Map()
    this.hot = new Set()
  }

  get(id) {
    return this.entities.get(id)
  }

  add(data, local) {
    const Entity = Types[data.type]
    const entity = new Entity(this.world, data, local)
    this.entities.set(entity.data.id, entity)
    return entity
  }

  remove(id) {
    const entity = this.entities.get(id)
    if (!entity) console.warn(`tried to remove entity that did not exist: ${id}`)
    entity.destroy()
    this.entities.delete(id)
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
    this.entities.forEach(entity => {
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
