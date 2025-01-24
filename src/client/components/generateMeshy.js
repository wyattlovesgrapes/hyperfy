import { uuid } from '../../core/utils'
import { hashFile } from '../../core/utils-client'

const apiKey = process.env.PUBLIC_MESHY_API_KEY
const baseUrl = 'https://api.meshy.ai'
const proxyUrl = process.env.PUBLIC_PROXY_URL

let current

export async function generateMeshy(world, prompt) {
  if (!apiKey) return

  current = null

  // spawn empty app
  const blueprint = {
    id: uuid(),
    version: 0,
    model: 'asset://crash-block.glb', // TODO: swap with hyper block
    script: null,
    config: {},
    preload: false,
  }
  world.blueprints.add(blueprint, true)
  const hit = world.stage.raycastPointer(world.controls.pointer.position)[0]
  const position = hit ? hit.point.toArray() : [0, 0, 0]
  const appData = {
    id: uuid(),
    type: 'app',
    blueprint: blueprint.id,
    position,
    quaternion: [0, 0, 0, 1],
    mover: world.network.id,
    uploader: null,
    state: {},
  }
  const app = world.entities.add(appData, true)

  // create meshy task
  console.log('prompt', prompt)
  const resp = await fetch(`${baseUrl}/openapi/v2/text-to-3d`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mode: 'preview',
      prompt,
      art_style: 'realistic',
      should_remesh: true,
    }),
  })
  const taskData = await resp.json()
  const previewTaskId = taskData.result

  // poll task for glb url
  let modelUrl
  while (!modelUrl) {
    const resp = await fetch(`${baseUrl}/openapi/v2/text-to-3d/${previewTaskId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await resp.json()
    if (data.status === 'SUCCEEDED') {
      modelUrl = data.model_urls.glb
      break
    } else {
      console.log('not ready yet')
    }
    await new Promise(resolve => setTimeout(resolve, 5000))
  }
  console.log('modelUrl', modelUrl)

  // fetch glb as a file
  const file = await fetchGLBAsFile(modelUrl)
  const hash = await hashFile(file)
  const filename = `${hash}.glb`
  const url = `asset://${filename}`
  world.loader.insert('model', url, file)
  const version = app.blueprint.version + 1
  world.blueprints.modify({ id: blueprint.id, version, model: url })
  await world.network.upload(file)
  world.network.send('blueprintModified', { id: blueprint.id, version, model: url })

  current = {
    app,
    previewTaskId,
  }
}

export async function textureMeshy(world) {
  if (!current) return
  const { app, previewTaskId } = current
  current = null

  // create refine task
  const resp = await fetch(`${baseUrl}/openapi/v2/text-to-3d`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mode: 'refine',
      preview_task_id: previewTaskId,
      enable_pbr: true,
    }),
  })
  const data = await resp.json()
  const taskId = data.result

  // poll task for glb url
  let modelUrl
  while (!modelUrl) {
    const resp = await fetch(`${baseUrl}/openapi/v2/text-to-3d/${taskId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await resp.json()
    if (data.status === 'SUCCEEDED') {
      modelUrl = data.model_urls.glb
      break
    } else {
      console.log('not ready yet')
    }
    await new Promise(resolve => setTimeout(resolve, 5000))
  }
  console.log('modelUrl', modelUrl)

  // fetch glb as a file
  const file = await fetchGLBAsFile(modelUrl)
  const hash = await hashFile(file)
  const filename = `${hash}.glb`
  const url = `asset://${filename}`
  world.loader.insert('model', url, file)
  const version = app.blueprint.version + 1
  world.blueprints.modify({ id: app.blueprint.id, version, model: url })
  await world.network.upload(file)
  world.network.send('blueprintModified', { id: app.blueprint.id, version, model: url })
}

async function fetchGLBAsFile(url) {
  url = `${proxyUrl}/${url}`
  const response = await fetch(url)
  const blob = await response.blob()
  return new File([blob], 'model.glb', { type: 'model/gltf-binary' })
}
