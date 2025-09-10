export default async function handler(req, res) {
  const app = await import('../dist/index.js')
  return app.default.fetch(req, {
    env: process.env,
    executionCtx: {
      waitUntil: () => {},
      passThroughOnException: () => {}
    }
  })
}