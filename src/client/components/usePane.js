import { debounce } from 'lodash-es'
import { useEffect } from 'react'
import { storage } from '../../core/storage'

const STORAGE_KEY = 'panes'

let configs = storage.get(STORAGE_KEY, {})
let count = 0
let layer = 0

const persist = debounce(() => storage.set(STORAGE_KEY, configs), 300)

export function usePane(id, paneRef, headRef) {
  useEffect(() => {
    let config = configs[id]
    if (!config) {
      count++
      config = {
        y: count * 20,
        x: count * 20,
        width: paneRef.current.offsetWidth,
        height: paneRef.current.offsetHeight,
        layer: 0,
      }
      configs[id] = config
      persist()
    }

    layer++
    const pane = paneRef.current

    // ensure pane is within screen bounds so it can't get lost
    const maxX = window.innerWidth - pane.offsetWidth
    const maxY = window.innerHeight - pane.offsetHeight
    config.x = Math.min(Math.max(0, config.x), maxX)
    config.y = Math.min(Math.max(0, config.y), maxY)

    pane.style.top = `${config.y}px`
    pane.style.left = `${config.x}px`
    pane.style.width = `${config.width}px`
    pane.style.height = `${config.height}px`
    pane.style.zIndex = `${layer}`

    const head = headRef.current

    const onPanePointerDown = () => {
      layer++
      pane.style.zIndex = `${layer}`
    }

    let moving = false
    const onHeadPointerDown = e => {
      moving = true
    }

    const onPointerMove = e => {
      if (!moving) return
      config.x += e.movementX
      config.y += e.movementY
      pane.style.top = `${config.y}px`
      pane.style.left = `${config.x}px`
      persist()
    }

    const onPointerUp = e => {
      moving = false
    }

    const onResize = new ResizeObserver(entries => {
      const entry = entries[0]
      if (entry) {
        config.width = entry.contentRect.width
        config.height = entry.contentRect.height
        persist()
      }
    })

    head.addEventListener('pointerdown', onHeadPointerDown)
    pane.addEventListener('pointerdown', onPanePointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    onResize.observe(pane)

    return () => {
      head.removeEventListener('pointerdown', onHeadPointerDown)
      pane.removeEventListener('pointerdown', onPanePointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      onResize.disconnect()
    }
  }, [])
}
