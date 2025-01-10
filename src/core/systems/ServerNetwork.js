import moment from 'moment'
import { writePacket } from '../packets'
import { Socket } from '../Socket'
import { addRole, hasRole, serializeRoles, uuid } from '../utils'
import { System } from './System'
import { createJWT, readJWT } from '../utils-server'

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

  init({ db }) {
    this.db = db
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

  async onConnection(ws, authToken) {
    try {
      // get or create user
      let user
      if (authToken) {
        try {
          const { userId } = await readJWT(authToken)
          user = await this.db('users').where('id', userId).first()
        } catch (err) {
          console.error('failed to read authToken:', authToken)
        }
      }
      if (!user) {
        user = {
          id: uuid(),
          name: 'Anonymous',
          roles: '',
          createdAt: moment().toISOString(),
        }
        await this.db('users').insert(user)
        authToken = await createJWT({ userId: user.id })
      }
      user.roles = user.roles.split(',')

      // if there is no admin code, everyone is a temporary admin (eg for local dev)
      // all roles prefixed with `~` are temporary and not persisted to db
      if (!process.env.ADMIN_CODE) {
        user.roles.push('~admin')
      }

      // create socket
      const socket = new Socket({ ws, network: this })

      // spawn player
      socket.player = this.world.entities.add(
        {
          id: this.makeId(),
          type: 'player',
          position: [0, 0, 0],
          quaternion: [0, 0, 0, 1],
          owner: socket.id,
          user,
        },
        true
      )

      // send snapshot
      socket.send('snapshot', {
        id: socket.id,
        chat: this.world.chat.serialize(),
        apps: this.world.apps.serialize(),
        entities: this.world.entities.serialize(),
        authToken,
      })

      this.sockets.set(socket.id, socket)
    } catch (err) {
      console.error(err)
    }
  }

  onChatAdded = async (socket, msg) => {
    // TODO: check for spoofed messages, permissions/roles etc
    // handle slash commands
    if (msg.body.startsWith('/')) {
      const [cmd, arg1, arg2] = msg.body.slice(1).split(' ')
      // become admin command
      if (cmd === 'admin') {
        const code = arg1
        if (code !== process.env.ADMIN_CODE || !process.env.ADMIN_CODE) return
        const player = socket.player
        const id = player.data.id
        const user = player.data.user
        if (hasRole(user.roles, 'admin')) {
          return socket.send('chatAdded', {
            id: uuid(),
            from: null,
            fromId: null,
            body: 'You are already an admin',
            createdAt: moment().toISOString(),
          })
        }
        addRole(user.roles, 'admin')
        player.modify({ user })
        this.send('entityModified', { id, user })
        socket.send('chatAdded', {
          id: uuid(),
          from: null,
          fromId: null,
          body: 'Admin granted!',
          createdAt: moment().toISOString(),
        })
        await this.db('users')
          .where('id', user.id)
          .update({ roles: serializeRoles(user.roles) })
      }
      if (cmd === 'name') {
        const name = arg1
        const player = socket.player
        const id = player.data.id
        const user = player.data.user
        player.data.user.name = name
        player.modify({ user })
        this.send('entityModified', { id, user })
        socket.send('chatAdded', {
          id: uuid(),
          from: null,
          fromId: null,
          body: `Name set to ${name}!`,
          createdAt: moment().toISOString(),
        })
        await this.db('users')
          .where('id', user.id)
          .update({ name })
      }
      return
    }
    // handle chat messages
    this.world.chat.add(msg, false)
    this.send('chatAdded', msg, socket)
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

  onEntityModified = (socket, data) => {
    const entity = this.world.entities.get(data.id)
    entity.modify(data)
    this.send('entityModified', data, socket)
  }

  onEntityRemoved = (socket, id) => {
    // TODO: check client permission
    this.world.entities.remove(id)
    this.send('entityRemoved', id, socket)
  }

  onDisconnect = (socket, code) => {
    console.log('disconect')
    socket.player.destroy(true)
    this.sockets.delete(socket.id)
  }
}
