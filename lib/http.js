// Small wrapper: POST only, JSON body in, JSON out, errors logged.
export function route(handler) {
  return async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
    try {
      res.status(200).json(await handler(req.body || {}));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Something went wrong" });
    }
  };
}
