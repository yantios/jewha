import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app = express()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, '../dist')
const PORT = process.env.PORT || 8787
const BASE = (process.env.SHNGM_API_BASE || 'https://api.shngm.io/v1').replace(/\/$/, '')
app.use(cors())
app.use(express.json())

async function upstream(path) {
  const url = `${BASE}${path}`
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'User-Agent': 'JelanWha/1.0 (catalog adapter)'
    },
    signal: AbortSignal.timeout(20000)
  })
  const body = await response.text()
  if (!response.ok) throw new Error(`Upstream API returned ${response.status}`)
  try { return JSON.parse(body) } catch { throw new Error('Upstream did not return valid JSON') }
}
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'JelanWha API adapter' }))
app.get('/api/latest', async (req, res) => {
  try { res.json(await upstream(`/manga/list?sort=latest&page=${Number(req.query.page || 1)}&page_size=${Number(req.query.page_size || 24)}`)) }
  catch (e) { res.status(502).json({ retcode: -1, message: e.message }) }
})
app.get('/api/top', async (req, res) => {
  try { res.json(await upstream(`/manga/top?filter=${encodeURIComponent(req.query.filter || 'daily')}&page=${Number(req.query.page || 1)}&page_size=${Number(req.query.page_size || 24)}`)) }
  catch (e) { res.status(502).json({ retcode: -1, message: e.message }) }
})
app.get('/api/search', async (req, res) => {
  try { res.json(await upstream(`/manga/list?q=${encodeURIComponent(req.query.q || '')}&page=${Number(req.query.page || 1)}&page_size=${Number(req.query.page_size || 24)}`)) }
  catch (e) { res.status(502).json({ retcode: -1, message: e.message }) }
})
app.get('/api/manga/:id', async (req, res) => {
  try {
    const data = await upstream(`/manga/detail/${encodeURIComponent(req.params.id)}`)
    // The provided API wrapper retrieves chapter records separately; preserve the upstream schema.
    try {
      const chapters = await upstream(`/chapter/${encodeURIComponent(req.params.id)}/list?page=1&page_size=200&sort_by=chapter_number&sort_order=desc`)
      if (data?.data) data.data.chapters = chapters?.data || []
    } catch {}
    res.json(data)
  } catch (e) { res.status(502).json({ retcode: -1, message: e.message }) }
})
app.get('/api/chapter/:id', async (req, res) => {
  try { res.json(await upstream(`/chapter/detail/${encodeURIComponent(req.params.id)}`)) }
  catch (e) { res.status(502).json({ retcode: -1, message: e.message }) }
})
// Serve the built React app from the same service so /api requests stay same-origin.
app.use(express.static(distPath))
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next()
  res.sendFile(path.join(distPath, 'index.html'), (err) => { if (err) next(err) })
})

app.listen(PORT, '0.0.0.0', () => console.log(`JelanWha listening on :${PORT}`))
