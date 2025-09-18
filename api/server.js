// Vercel entry point - loads the built server
export default import('../dist/server.js').then(m => m.default || m.app || m)