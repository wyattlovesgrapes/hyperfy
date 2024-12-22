import { readPacket, writePacket } from '../packets'
import { System } from './System'

/**
 * Client Network System
 *
 * - runs on the client
 * - provides abstract network methods matching ServerNetwork
 *
 */
export class ClientNetwork extends System {
  constructor(world) {
    super(world)
    this.id = null
    this.ws = null
    this.apiUrl = null
  }

  init({ wsUrl, apiUrl }) {
    this.apiUrl = apiUrl
    this.ws = new WebSocket(wsUrl)
    this.ws.binaryType = 'arraybuffer'
    this.ws.addEventListener('message', this.onPacket)
    this.ws.addEventListener('close', this.onClose)
  }

  send(name, data) {
    console.log('->', name, data)
    const packet = writePacket(name, data)
    this.ws.send(packet)
  }

  async upload(file) {
    const form = new FormData()
    form.append('file', file)
    const url = `${this.apiUrl}/upload`
    await fetch(url, {
      method: 'POST',
      body: form,
    })
  }

  onPacket = e => {
    const [method, data] = readPacket(e.data)
    console.log('<-', method, data)
    this[method]?.(data)
  }

  onSnapshot(data) {
    this.id = data.id
    this.world.apps.deserialize(data.apps)
    this.world.entities.deserialize(data.entities)
  }

  onAppAdded = config => {
    this.world.apps.add(config)
  }

  onEntityAdded = data => {
    this.world.entities.add(data)
  }

  onEntityUpdated = data => {
    const entity = this.world.entities.get(data.id)
    entity.onUpdate(data)
  }

  onEntityRemoved = id => {
    this.world.entities.remove(id)
  }

  onClose = () => {
    console.log('connection ended')
  }
}
