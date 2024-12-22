import { System } from './System'

import { hashFile } from '../utils-client'
import { uuid } from '../utils'

/**
 * Drop System
 *
 * - runs on the client
 * - listens for files being drag and dropped onto the window and handles them
 *
 */
export class ClientDrop extends System {
  constructor(world) {
    super(world)
    this.target = null
    this.file = null
  }

  async init({ viewport }) {
    viewport.addEventListener('dragover', this.onDragOver)
    viewport.addEventListener('dragenter', this.onDragEnter)
    viewport.addEventListener('dragleave', this.onDragLeave)
    viewport.addEventListener('drop', this.onDrop)
  }

  onDragOver = e => {
    e.preventDefault()
  }

  onDragEnter = e => {
    this.target = e.target
    this.dropping = true
    this.file = null
  }

  onDragLeave = e => {
    if (e.target === this.target) {
      this.dropping = false
    }
  }

  onDrop = e => {
    e.preventDefault()
    this.dropping = false
    let file
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const item = e.dataTransfer.items[0]
      if (item.kind === 'file') {
        file = item.getAsFile()
      }
      if (item.type === 'text/uri-list') {
        // ...
      }
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      file = e.dataTransfer.files[0]
    }
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext === 'glb') {
      this.addGLB(file)
    }
  }

  async addGLB(file) {
    // immutable hash the file
    const hash = await hashFile(file)
    // use hash as glb filename
    const filename = `${hash}.glb`
    // canonical url to this file
    const url = `asset://${filename}`
    // cache file locally so this client can insta-load it
    this.world.loader.insert('glb', url, file)
    // make app config
    const config = {
      id: uuid(),
      model: url,
      script: null,
      values: {},
    }
    // register the app
    this.world.apps.add(config, true)
    // get spawn point
    const hit = this.world.stage.raycastPointer(this.world.controls.pointer.position)[0]
    const position = hit ? hit.point.toArray() : [0, 0, 0]
    // spawn the app moving
    // - mover: follows this clients cursor until placed
    // - uploader: other clients see a loading indicator until its fully uploaded
    const data = {
      id: uuid(),
      type: 'app',
      app: config.id,
      position,
      quaternion: [0, 0, 0, 1],
      mover: this.world.network.id,
      uploader: this.world.network.id,
    }
    const app = this.world.entities.add(data, true)
    // upload the glb
    await this.world.network.upload(file)
    // mark as uploaded so other clients can load it in
    app.onUploaded()
  }
}
