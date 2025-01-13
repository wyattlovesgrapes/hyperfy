import { useEffect } from 'react'

const configs = {}

let count = 0
let layer = 0

export function usePane(id, paneRef, headRef) {
  useEffect(() => {
    let config = configs[id]
    if (!config) {
      count++
      config = {
        y: count * 20,
        x: count * 20,
        layer: 0,
      }
      configs[id] = config
    }
    layer++
    const pane = paneRef.current
    pane.style.top = `${config.y}px`
    pane.style.left = `${config.x}px`
    pane.style.zIndex = `${layer}`
    const head = headRef.current
    const onPanePointerDown = () => {
      layer++
      pane.style.zIndex = `${layer}`
    }
    let moving
    const onHeadPointerDown = e => {
      moving = true
    }
    const onPointerMove = e => {
      if (!moving) return
      config.x += e.movementX
      config.y += e.movementY
      pane.style.top = `${config.y}px`
      pane.style.left = `${config.x}px`
    }
    const onPointerUp = e => {
      moving = false
    }
    head.addEventListener('pointerdown', onHeadPointerDown)
    pane.addEventListener('pointerdown', onPanePointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      head.removeEventListener('pointerdown', onHeadPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [])
}
