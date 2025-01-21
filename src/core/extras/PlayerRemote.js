import { createNode } from './createNode'
import { LerpQuaternion } from './LerpQuaternion'
import { LerpVector3 } from './LerpVector3'
import { emotes } from './playerEmotes'

export class PlayerRemote {
  constructor(entity) {
    this.entity = entity
    this.data = entity.data
    this.world = entity.world
    this.init()
  }

  async init() {
    this.base = createNode({ name: 'group' })
    this.base.position.fromArray(this.data.position)
    this.base.quaternion.fromArray(this.data.quaternion)
    this.base.activate({ world: this.world, entity: this.entity, physics: true })

    this.position = new LerpVector3(this.base.position, this.world.networkRate)
    this.quaternion = new LerpQuaternion(this.base.quaternion, this.world.networkRate)
    this.emote = 'asset://emote-idle.glb'

    this.applyAvatar()

    this.world.setHot(this, true)
    this.world.events.emit('enter', {
      id: this.data.user.id,
      name: this.data.user.name,
      networkId: this.data.owner,
    })
  }

  applyAvatar() {
    const avatarUrl = this.data.user.avatar || 'asset://avatar.vrm'
    if (this.avatarUrl === avatarUrl) return
    this.world.loader.load('avatar', avatarUrl).then(src => {
      if (this.avatar) this.avatar.deactivate()
      this.avatar = src.toNodes().get('avatar')
      this.base.add(this.avatar)
      this.avatarUrl = avatarUrl
    })
  }

  update(delta) {
    this.position.update(delta)
    this.quaternion.update(delta)
    this.avatar?.setEmote(emotes[this.emote])
  }

  modify(data) {
    if (data.hasOwnProperty('p')) {
      this.data.position = data.p
      this.position.pushArray(data.p)
    }
    if (data.hasOwnProperty('q')) {
      this.data.quaternion = data.q
      this.quaternion.pushArray(data.q)
    }
    if (data.hasOwnProperty('e')) {
      this.data.emote = data.e
      this.emote = data.e
    }
    if (data.hasOwnProperty('user')) {
      this.data.user = data.user
      this.applyAvatar()
    }
  }

  destroy() {
    this.base.deactivate()
    this.avatar = null
    this.world.setHot(this, false)
    this.world.events.emit('leave', {
      id: this.data.user.id,
      name: this.data.user.name,
      networkId: this.data.owner,
    })
  }
}
