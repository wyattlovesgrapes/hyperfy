/**
 * PhysX Loader
 *
 * This function is passed into world.init() providing a browser specific method for loading PhysX.
 * Currently we are using a fork of physx-js-webidl and a custom build, modifying `PhysXWasmBindings.cmake` to use:
 *
 * -s MODULARIZE=1
 * -s EXPORT_NAME=PhysX
 * -s ENVIRONMENT=web,worker
 *
 * The .js and .wasm file is in the public folder, and index.html includes a <script> tag for the js, and it all correctly
 * locates the wasm etc.
 *
 */
let promise
export function loadPhysX() {
  if (!promise) {
    promise = new Promise(async resolve => {
      globalThis.PHYSX = await globalThis.PhysX()
      const version = PHYSX.PHYSICS_VERSION
      const allocator = new PHYSX.PxDefaultAllocator()
      const errorCb = new PHYSX.PxDefaultErrorCallback()
      const foundation = PHYSX.CreateFoundation(version, allocator, errorCb)
      resolve({ version, allocator, errorCb, foundation })
    })
  }
  return promise
}
