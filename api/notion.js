export default async function handler(req, res) {
  res.status(200).json({ url: req.url, method: req.method })
}
