import { System } from './System'

import StatsGL from '../libs/stats-gl'

/**
 * Stats System
 *
 * - runs on the client
 * - attaches stats to the ui to see fps/cpu/gpu
 *
 */
export class ClientStats extends System {
  constructor(world) {
    super(world)
    this.stats = new StatsGL({
      logsPerSecond: 20,
      samplesLog: 100,
      samplesGraph: 10,
      precision: 2,
      horizontal: true,
      minimal: false,
      mode: 0,
    })
    this.ui = null
  }

  init({ ui }) {
    this.ui = ui
  }

  start() {
    this.stats.init(this.world.graphics.renderer, false)
    this.ui.appendChild(this.stats.dom)
    this.stats.dom.style.position = 'absolute'
  }

  preTick() {
    this.stats.begin()
  }

  postTick() {
    this.stats.end()
    this.stats.update()
  }
}
