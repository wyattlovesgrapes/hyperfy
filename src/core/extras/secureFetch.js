export async function secureFetch(url, options) {
  const resp = await fetch(url, options)
  const secureResp = {
    ok: resp.ok,
    status: resp.status,
    statusText: resp.statusText,
    headers: Object.fromEntries(resp.headers.entries()),
    json: async () => await resp.json(),
    text: async () => await resp.text(),
    blob: async () => await resp.blob(),
  }
  return secureResp
}
