import { isNumber } from 'lodash-es'
import { Node } from './Node'
import { Display } from '../extras/yoga'

const defaults = {
  display: 'flex',
  src: null,
  width: null,
  height: null,
  objectFit: 'contain', // contain, cover, fill
  backgroundColor: null
}

export class UIImage extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'uiimage'

    this.display = data.display === undefined ? defaults.display : data.display
    this.src = data.src === undefined ? defaults.src : data.src
    this.width = data.width === undefined ? defaults.width : data.width
    this.height = data.height === undefined ? defaults.height : data.height
    this.objectFit = data.objectFit === undefined ? defaults.objectFit : data.objectFit
    this.backgroundColor = data.backgroundColor === undefined ? defaults.backgroundColor : data.backgroundColor

    this._image = null
    this._imageLoaded = false
    this._needsUpdate = false
    this._cursor = data.cursor
    this._onPointerDown = data.onPointerDown
    this._onPointerUp = data.onPointerUp
  }

  async loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        if (!this.ui) return

        this._image = img
        this._imageLoaded = true
        this._needsUpdate = true

        // Let the UI know it needs to update
        if (this.ui && this.ui.needsUpdate !== undefined) {
          this.ui.needsUpdate = true
        }

        resolve(img)
      }

      img.onerror = (error) => {
        console.error('Failed to load image:', error)
        reject(error)
      }

      img.src = src
    })
  }

  update() {
    if (this._needsUpdate) {
      this._needsUpdate = false
      if (this.yogaNode && !this.yogaNode.isDead) {
        try {
          this.yogaNode.markDirty()
        } catch (e) {
          console.warn('Failed to mark yoga node dirty:', e)
        }
      }
    }
  }

  draw(ctx, offsetLeft, offsetTop) {
    if (this._display === 'none' || !this._imageLoaded) return

    const left = offsetLeft + this.yogaNode.getComputedLeft()
    const top = offsetTop + this.yogaNode.getComputedTop()
    const width = this.yogaNode.getComputedWidth()
    const height = this.yogaNode.getComputedHeight()

    if (this._backgroundColor) {
      ctx.fillStyle = this._backgroundColor
      ctx.fillRect(left, top, width, height)
    }

    if (this._image) {
      const drawParams = this.calculateDrawParameters(
        this._image.width,
        this._image.height,
        width,
        height
      )

      ctx.drawImage(
        this._image,
        left + drawParams.x,
        top + drawParams.y,
        drawParams.width,
        drawParams.height
      )
    }

    this.box = { left, top, width, height }
  }

  calculateDrawParameters(imgWidth, imgHeight, containerWidth, containerHeight) {
    let width, height, x = 0, y = 0
    const aspectRatio = imgWidth / imgHeight

    if (this._objectFit === 'cover') {
      if (containerWidth / containerHeight > aspectRatio) {
        width = containerWidth
        height = containerWidth / aspectRatio
        y = (containerHeight - height) / 2
      } else {
        height = containerHeight
        width = containerHeight * aspectRatio
        x = (containerWidth - width) / 2
      }
    } else if (this._objectFit === 'contain') {
      if (containerWidth / containerHeight > aspectRatio) {
        height = containerHeight
        width = containerHeight * aspectRatio
        x = (containerWidth - width) / 2
      } else {
        width = containerWidth
        height = containerWidth / aspectRatio
        y = (containerHeight - height) / 2
      }
    } else { // fill
      width = containerWidth
      height = containerHeight
    }

    return { width, height, x, y }
  }

  mount() {
    if (this.ctx.world.network.isServer) return
    this.ui = this.parent?.ui
    if (!this.ui) return console.error('uiimage: must be child of ui node')

    // Clean up old yoga node if it exists
    if (this.yogaNode) {
      this.parent.yogaNode?.removeChild(this.yogaNode)
      this.yogaNode.free()
    }

    this.yogaNode = Yoga.Node.create()
    this.yogaNode.setDisplay(Display[this._display])
    this.yogaNode.setWidth(this._width === null ? undefined : this._width * this.ui._res)
    this.yogaNode.setHeight(this._height === null ? undefined : this._height * this.ui._res)

    this.parent.yogaNode.insertChild(this.yogaNode, this.parent.yogaNode.getChildCount())

    if (this._src && !this._imageLoaded) {
      this.loadImage(this._src)
    }
  }

  unmount() {
    if (this.ctx.world.network.isServer) return
    if (this.yogaNode) {
      this.parent.yogaNode?.removeChild(this.yogaNode)
      this.yogaNode.free()
      this.yogaNode = null
      this.box = null
    }
    this._image = null
    this._imageLoaded = false
  }

  get src() {
    return this._src
  }

  set src(value) {
    if (this._src === value) return
    this._src = value || defaults.src
    if (this._src) {
      this.loadImage(this._src)
    } else {
      this._image = null
      this._imageLoaded = false
      this.ui?.redraw()
    }
  }

  get width() {
    return this._width
  }

  set width(value) {
    if (this._width === value) return
    this._width = isNumber(value) ? value : defaults.width
    this.yogaNode?.setWidth(this._width === null ? undefined : this._width * this.ui._res)
    this.ui?.redraw()
  }

  get height() {
    return this._height
  }

  set height(value) {
    if (this._height === value) return
    this._height = isNumber(value) ? value : defaults.height
    this.yogaNode?.setHeight(this._height === null ? undefined : this._height * this.ui._res)
    this.ui?.redraw()
  }

  get objectFit() {
    return this._objectFit
  }

  set objectFit(value) {
    if (this._objectFit === value) return
    this._objectFit = value || defaults.objectFit
    this.ui?.redraw()
  }

  get backgroundColor() {
    return this._backgroundColor
  }

  set backgroundColor(value) {
    if (this._backgroundColor === value) return
    this._backgroundColor = value || defaults.backgroundColor
    this.ui?.redraw()
  }

  get cursor() {
    return this._cursor
  }

  set cursor(value) {
    this._cursor = value
  }

  get onPointerDown() {
    return this._onPointerDown
  }

  set onPointerDown(value) {
    this._onPointerDown = value
  }

  get onPointerUp() {
    return this._onPointerUp
  }

  set onPointerUp(value) {
    this._onPointerUp = value
  }

  getProxy() {
    if (!this.proxy) {
      const self = this
      const proxy = {
        get src() {
          return self.src
        },
        set src(value) {
          self.src = value
        },
        get width() {
          return self.width
        },
        set width(value) {
          self.width = value
        },
        get height() {
          return self.height
        },
        set height(value) {
          self.height = value
        },
        get objectFit() {
          return self.objectFit  
        },
        set objectFit(value) {
          self.objectFit = value
        },
        get backgroundColor() {
          return self.backgroundColor
        },
        set backgroundColor(value) {
          self.backgroundColor = value
        }
      }

      // Inherit from Node's proxy
      this.proxy = Object.create(super.getProxy(), Object.getOwnPropertyDescriptors(proxy))
    }
    return this.proxy
  }
}