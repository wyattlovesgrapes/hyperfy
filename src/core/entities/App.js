import * as THREE from '../extras/three'

import { Entity } from './Entity'
import { glbToNodes } from '../extras/glbToNodes'

export class App extends Entity {
  constructor(world, data, local) {
    super(world, data, local)
    this.build()
  }

  async build() {
    this.unbuild()
    // fetch app config
    this.config = this.world.apps.get(this.data.app)
    // if someone else is uploading, show a loading indicator
    if (this.data.uploader && this.data.uploader !== this.world.network.id) {
      const geometry = new THREE.BoxGeometry(1, 1, 1)
      const material = new THREE.MeshStandardMaterial({ color: 'blue' })
      this.spinner = new THREE.Mesh(geometry, material)
      this.world.stage.scene.add(this.spinner)
      return
    }
    // otherwise lets load or fetch from cache
    const glb = await this.world.loader.load('glb', this.config.model)
    this.root = glbToNodes(glb, this.world)
    // if moving lets activate without physics
    if (this.data.mover) {
      this.root.activate({ world: this.world, physics: false })
      // subscribe to updates
      this.world.entities.setHot(this, true)
    }
    // otherwise lets activate with physics
    else {
      this.root.activate({ world: this.world, physics: true })
    }
  }

  unbuild() {
    if (this.spinner) {
      this.world.stage.scene.remove(this.spinner)
      this.spinner = null
    }
    if (this.glb) {
      this.root.deactivate()
      this.root = null
    }
    this.world.entities.setHot(this, false)
  }

  update(delta) {
    // handle us moving the app
    if (this.data.mover === this.world.network.id) {
      const position = this.world.input.pointer.position
      const hit = this.world.stage.raycastPointer(position)[0]
      if (hit) {
        this.root.position.copy(hit.point)
        // const update = this.getNetworkUpdate()
        // update.position = hit.position.toArray()
      }
    }
    // handle someone else moving the app
    if (this.data.mover && this.data.mover !== this.world.network.id) {
      // TODO: someone else is moving, interpolate
    }
  }

  setUploader(value) {
    this.data.uploader = value
    this.world.network.send('entityUpdated', { id: this.data.id, uploader: value })
  }

  setMover(value) {
    this.data.mover = value
    this.world.network.send('entityUpdated', { id: this.data.id, mover: value })
    this.build()
  }

  onUpdate(data) {
    // TODO: server can reject for reasons
    let rebuild
    if (data.hasOwnProperty('uploader')) {
      this.data.uploader = data.uploader
      rebuild = true
    }
    if (data.hasOwnProperty('mover')) {
      this.data.mover = data.mover
      rebuild = true
    }
    if (data.hasOwnProperty('position')) {
      this.data.position = data.position
      // TODO: interpolate
    }
    if (data.hasOwnProperty('quaternion')) {
      this.data.quaternion = data.quaternion
      // TODO: interpolate
    }
    if (rebuild) {
      this.build()
    }
  }

  destroy(local) {
    this.unbuild()
    super.destroy(local)
  }
}
