import { useEffect } from 'react'

const STORAGE_KEY = 'pane_configs'
const WHITELISTED_IDS = ['code'] // Add your whitelisted IDs here
let configs = {}
let count = 0
let layer = 0

// Load saved configs from localStorage only for whitelisted IDs
try {
  const savedConfigs = localStorage.getItem(STORAGE_KEY)
  if (savedConfigs) {
    const parsedConfigs = JSON.parse(savedConfigs)
    // Only load whitelisted configs
    configs = Object.keys(parsedConfigs)
      .filter(key => WHITELISTED_IDS.includes(key))
      .reduce((obj, key) => {
        obj[key] = parsedConfigs[key]
        return obj
      }, {})
  }
} catch (error) {
  console.error('Error loading pane configs:', error)
}

// Save configs to localStorage (only whitelisted)
const saveConfigs = () => {
  try {
    // Only save whitelisted configs
    const configsToSave = Object.keys(configs)
      .filter(key => WHITELISTED_IDS.includes(key))
      .reduce((obj, key) => {
        obj[key] = configs[key]
        return obj
      }, {})
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configsToSave))
  } catch (error) {
    console.error('Error saving pane configs:', error)
  }
}

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
      if (WHITELISTED_IDS.includes(id)) {
        saveConfigs()
      }
    }

    layer++
    const pane = paneRef.current
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

      // Calculate new position
      const newX = config.x + e.movementX
      const newY = config.y + e.movementY

      // Get window dimensions
      const maxX = window.innerWidth - pane.offsetWidth
      const maxY = window.innerHeight - pane.offsetHeight

      // Clamp coordinates to keep window visible
      config.x = Math.min(Math.max(0, newX), maxX)
      config.y = Math.min(Math.max(0, newY), maxY)

      pane.style.top = `${config.y}px`
      pane.style.left = `${config.x}px`
      if (WHITELISTED_IDS.includes(id)) {
        saveConfigs()
      }
    }

    const onPointerUp = e => {
      moving = false
    }

    const onResize = new ResizeObserver(entries => {
      const entry = entries[0]
      if (entry) {
        config.width = entry.contentRect.width
        config.height = entry.contentRect.height
        if (WHITELISTED_IDS.includes(id)) {
          saveConfigs()
        }
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
