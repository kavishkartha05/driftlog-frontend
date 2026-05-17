export default async function handler(req, res) {
  const path = req.url.replace(/^\/api\/notion/, '')

  const notionRes = await fetch(`https://api.notion.com${path}`, {
    method: req.method,
    headers: {
      ...req.headers,
      host: 'api.notion.com',
    },
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
  })

  const data = await notionRes.text()
  res.status(notionRes.status)
  res.setHeader('Content-Type', notionRes.headers.get('content-type') || 'application/json')
  res.end(data)
}
