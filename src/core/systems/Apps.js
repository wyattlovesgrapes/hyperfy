import { System } from './System'

/**
 * Apps System
 *
 * - Runs on both the server and client.
 * - A central registry for app configs
 *
 */
export class Apps extends System {
  constructor(world) {
    super(world)
    this.configs = new Map()
  }

  get(id) {
    return this.configs.get(id)
  }

  add(config, local) {
    this.configs.set(config.id, config)
    if (local) {
      this.world.network.send('appAdded', config)
    }
  }

  serialize() {
    const data = []
    this.configs.forEach(config => {
      data.push(config)
    })
    return data
  }

  deserialize(data) {
    for (const config of data) {
      this.add(config)
    }
  }
}
