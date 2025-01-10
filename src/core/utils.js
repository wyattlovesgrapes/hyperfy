import { some } from 'lodash-es'
import { customAlphabet } from 'nanoid'

/**
 * UUID
 *
 * alphanumeric @ 21 characters
 * ~30 million years needed, in order to have a 1% probability of at least one collision.
 * see: https://zelark.github.io/nano-id-cc/
 *
 */
export const uuid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 21)

/**
 *
 * Micro UUID (for anon usernames etc)
 *
 * alphanumeric @ 6 characters
 * ~7 days or 33K IDs needed, in order to have a 1% probability of at least one collision.
 * see: https://zelark.github.io/nano-id-cc/
 *
 */
export const muid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 6)

export function clamp(n, low, high) {
  return Math.max(Math.min(n, high), low)
}

export function hasRole(arr, ...roles) {
  // also includes temporary roles (prefixed with `~`)
  return some(roles, role => arr.includes(role) || arr.includes(`~${role}`))
}

export function addRole(arr, role) {
  if (!hasRole(arr, role)) {
    arr.push(role)
  }
}

export function serializeRoles(roles) {
  // remove temporary (~) roles
  roles = roles.filter(role => !role.startsWith('~'))
  // convert to string
  return roles.join(',')
}
