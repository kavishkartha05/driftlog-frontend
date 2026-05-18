export default async function handler(req, res) {
  const path = req.url.replace(/^\/api\/notion/, '')

  const headers = {}
  if (req.headers['authorization']) headers['authorization'] = req.headers['authorization']
  if (req.headers['notion-version']) headers['notion-version'] = req.headers['notion-version']
  if (req.headers['content-type']) headers['content-type'] = req.headers['content-type']

  const notionRes = await fetch(`https://api.notion.com${path}`, {
    method: req.method,
    headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
  })

  const data = await notionRes.text()
  res.status(notionRes.status)
  res.setHeader('Content-Type', notionRes.headers.get('content-type') || 'application/json')
  res.end(data)
}
