export class PlayerRemote {
  constructor(entity) {
    this.entity = entity
    this.data = entity.data
    this.world = entity.world
    this.init()
  }

  async init() {
    this.world.loader.load('vrm', 'asset://avatar.vrm').then(vrm => {
      console.log({ vrm })
      // ...
    })
  }
}
