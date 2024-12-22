import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { VRMLoaderPlugin as VRMLoader } from '../libs/three-vrm'

import { System } from './System'

/**
 * Client Loader System
 *
 * - Runs on the client
 * - Basic file loader for many different formats, cached.
 *
 */
export class ClientLoader extends System {
  constructor(world) {
    super(world)
    this.cache = new Map()
    this.rgbeLoader = new RGBELoader()
    this.gltfLoader = new GLTFLoader()
    this.gltfLoader.register(parser => new VRMLoader(parser))
  }

  start() {
    // ...
  }

  has(type, url) {
    const key = `${type}/${url}`
    return this.cache.has(key)
  }

  load(type, url) {
    const key = `${type}/${url}`
    if (this.cache.has(key)) {
      return this.cache.get(key)
    }
    url = this.resolveURL(url)
    let promise
    if (type === 'hdr') {
      promise = this.rgbeLoader.loadAsync(url).then(texture => {
        return texture
      })
    }
    if (type === 'glb') {
      promise = this.gltfLoader.loadAsync(url).then(glb => {
        return glb
      })
    }
    this.cache.set(key, promise)
    return promise
  }

  insert(type, url, file) {
    const key = `${type}/${url}`
    const localUrl = URL.createObjectURL(file)
    let promise
    if (type === 'glb') {
      promise = this.gltfLoader.loadAsync(localUrl).then(raw => {
        console.log('raw', raw)
        console.log('TODO: gltf to nodes')
        return raw
        // const node = glbToNodes(raw, this.world)
        // return { raw, node }
      })
    }
    this.cache.set(key, promise)
  }

  resolveURL(url) {
    if (url.startsWith('asset://')) {
      return url.replace('asset:/', process.env.PUBLIC_ASSETS_URL)
    }
    return url
  }
}
