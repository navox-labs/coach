const http = require("http");

const ROUTES = {
  "/coach": { host: "localhost", port: 3002 },
};
const DEFAULT_TARGET = { host: "localhost", port: 3001 };

const server = http.createServer((req, res) => {
  const match = Object.keys(ROUTES).find((prefix) =>
    req.url.startsWith(prefix)
  );
  const target = match ? ROUTES[match] : DEFAULT_TARGET;

  const proxyReq = http.request(
    {
      hostname: target.host,
      port: target.port,
      path: req.url,
      method: req.method,
      headers: req.headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on("error", (err) => {
    console.error(`Proxy error → ${target.host}:${target.port}${req.url}:`, err.message);
    res.writeHead(502);
    res.end("Bad Gateway");
  });

  req.pipe(proxyReq);
});

server.listen(3000, () => {
  console.log("Dev proxy running at http://localhost:3000");
  console.log("  /network/*  → localhost:3001");
  console.log("  /coach/*    → localhost:3002");
});
