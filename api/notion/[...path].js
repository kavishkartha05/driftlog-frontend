export default async function handler(req, res) {
  const path = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path || ''
  res.status(200).json({ url: req.url, path: req.query.path })
}
