import { writePacket } from '../packets'
import { Socket } from '../Socket'
import { uuid } from '../utils'
import { System } from './System'

/**
 * Server Network System
 *
 * - runs on the server
 * - provides abstract network methods matching ClientNetwork
 *
 */
export class ServerNetwork extends System {
  constructor(world) {
    super(world)
    this.id = 0
    this.ids = -1
    this.sockets = new Map()
    this.checkInterval = setInterval(() => this.checkSockets(), 1000)
  }

  makeId() {
    return `${this.id}_${++this.ids}`
  }

  send(name, data, ignoreSocket) {
    // console.log('->>>', name, data)
    const packet = writePacket(name, data)
    this.sockets.forEach(socket => {
      if (socket === ignoreSocket) return
      socket.sendPacket(packet)
    })
  }

  checkSockets() {
    // see: https://www.npmjs.com/package/ws#how-to-detect-and-close-broken-connections
    const dead = []
    this.sockets.forEach(socket => {
      if (!socket.alive) {
        dead.push(socket)
      } else {
        socket.ping()
      }
    })
    dead.forEach(socket => socket.disconnect())
  }

  onConnection(ws) {
    try {
      // auth/guest
      // ...

      // create socket
      const socket = new Socket({ ws, network: this })

      // spawn player
      socket.player = this.world.entities.add(
        {
          id: this.makeId(),
          type: 'player',
          owner: socket.id,
          position: [0, 0, 0],
          quaternion: [0, 0, 0, 1],
        },
        true
      )

      // send snapshot
      socket.send('snapshot', {
        id: socket.id,
        apps: this.world.apps.serialize(),
        entities: this.world.entities.serialize(),
      })

      this.sockets.set(socket.id, socket)
    } catch (err) {
      console.error(err)
    }
  }

  onAppAdded = (socket, config) => {
    this.world.apps.add(config)
    this.send('appAdded', config, socket)
  }

  onEntityAdded = (socket, data) => {
    // TODO: check client permission
    this.world.entities.add(data)
    this.send('entityAdded', data, socket)
  }

  onEntityChanged = (socket, data) => {
    const entity = this.world.entities.get(data.id)
    entity.onChange(data)
    this.send('entityChanged', data, socket)
  }

  onEntityRemoved = (socket, id) => {
    // TODO: check client permission
    this.world.entities.remove(id)
    this.send('entityRemoved', id, socket)
  }

  onDisconnect = (socket, code) => {
    console.log('disconect')
    socket.player.destroy()
    this.sockets.delete(socket.id)
  }
}
