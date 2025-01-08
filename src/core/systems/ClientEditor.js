import * as THREE from '../extras/three'

import { System } from './System'

import { hashFile } from '../utils-client'
import { muid, uuid } from '../utils'
import { ControlPriorities } from '../extras/ControlPriorities'
import { CopyIcon, EyeIcon, HandIcon, Trash2Icon, UnlinkIcon } from 'lucide-react'

contextBreakers = ['MouseLeft', 'Escape']

/**
 * Editor System
 *
 * - runs on the client
 * - listens for files being drag and dropped onto the window and handles them
 * - handles editing apps
 *
 */
export class ClientEditor extends System {
  constructor(world) {
    super(world)
    this.target = null
    this.file = null
    this.contextTracker = {
      downAt: null,
      movement: new THREE.Vector3(),
    }
  }

  async init({ viewport, onContext }) {
    viewport.addEventListener('dragover', this.onDragOver)
    viewport.addEventListener('dragenter', this.onDragEnter)
    viewport.addEventListener('dragleave', this.onDragLeave)
    viewport.addEventListener('drop', this.onDrop)
    this.onContext = onContext
  }

  start() {
    this.control = this.world.controls.bind({
      priority: ControlPriorities.EDITOR,
      onPress: code => {
        if (code === 'MouseRight') {
          this.contextTracker.downAt = performance.now()
          this.contextTracker.movement.set(0, 0, 0)
        }
      },
      onRelease: code => {
        if (code === 'MouseRight') {
          const elapsed = performance.now() - this.contextTracker.downAt
          const distance = this.contextTracker.movement.length()
          if (elapsed < 300 && distance < 30) {
            this.tryContext()
          }
        }
        if (this.context && contextBreakers.includes(code)) {
          this.setContext(null)
        }
      },
    })
  }

  update(delta) {
    if (this.control.buttons.MouseRight) {
      this.contextTracker.movement.add(this.control.pointer.delta)
    }
  }

  tryContext() {
    const hits = this.world.stage.raycastPointer(this.world.controls.pointer.position)
    let entity
    for (const hit of hits) {
      entity = hit.getEntity?.()
      if (entity) break
    }
    if (!entity) return
    const context = {
      id: muid(),
      x: this.world.controls.pointer.position.x,
      y: this.world.controls.pointer.position.y,
      actions: [],
    }
    if (entity.isPlayer) {
      context.actions.push({
        label: 'Inspect',
        icon: EyeIcon,
        visible: true,
        disabled: false,
        onClick: () => {
          this.setContext(null)
        },
      })
    }
    if (entity.isApp) {
      context.actions.push({
        label: 'Inspect',
        icon: EyeIcon,
        visible: true,
        disabled: false,
        onClick: () => {
          this.setContext(null)
        },
      })
      context.actions.push({
        label: 'Move',
        icon: HandIcon,
        visible: this.world.network.permissions.build,
        disabled: false,
        onClick: () => {
          this.setContext(null)
        },
      })
      context.actions.push({
        label: 'Duplicate',
        icon: CopyIcon,
        visible: this.world.network.permissions.build,
        disabled: false,
        onClick: () => {
          this.setContext(null)
        },
      })
      context.actions.push({
        label: 'Unlink',
        icon: UnlinkIcon,
        visible: this.world.network.permissions.build,
        disabled: false,
        onClick: () => {
          this.setContext(null)
        },
      })
      context.actions.push({
        label: 'Destroy',
        icon: Trash2Icon,
        visible: this.world.network.permissions.build,
        disabled: false,
        onClick: () => {
          this.setContext(null)
        },
      })
    }
    this.setContext(context)
  }

  setContext(value) {
    this.context = value
    this.onContext(value)
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
    const hit = this.world.stage.raycastPointer(this.control.pointer.position)[0]
    const position = hit ? hit.point.toArray() : [0, 0, 0]
    // spawn the app moving
    // - mover: follows this clients cursor until placed
    // - uploader: other clients see a loading indicator until its fully uploaded
    const data = {
      id: this.world.network.makeId(),
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
