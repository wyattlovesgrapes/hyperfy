import { System } from './System'

/**
 * Blueprints System
 *
 * - Runs on both the server and client.
 * - A central registry for app blueprints
 *
 */
export class Blueprints extends System {
  constructor(world) {
    super(world)
    this.items = new Map()
  }

  get(id) {
    return this.items.get(id)
  }

  add(data, local) {
    this.items.set(data.id, data)
    if (local) {
      this.world.network.send('blueprintAdded', data)
    }
  }

  serialize() {
    const datas = []
    this.items.forEach(data => {
      datas.push(data)
    })
    return datas
  }

  deserialize(datas) {
    for (const data of datas) {
      this.add(data)
    }
  }
}
