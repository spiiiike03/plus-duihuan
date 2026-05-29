const http = require("node:http");
const { URL } = require("node:url");

const OLD_ORIGIN = "https://activate.amazo.indevs.in";
const PORT = Number(process.env.PORT || 3000);
const ASSET_VERSION = "1778483770";

const QQ_GROUP_NUMBER = "1072653807";
const QQ_GROUP_LINK = "https://qm.qq.com/q/IUNycPdTMY";
const AGENT_QQ_NUMBER = "191176548";
const AGENT_QQ_LINK = "https://qm.qq.com/q/Bz7bx904XQ";
const CODEX_PURCHASE_LINK = "https://pay.ldxp.cn/item/jzpods";

const HTML = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>PLUS成品号账号兑换</title>
  <link rel="stylesheet" href="/static/reserve_activate_console.css?v=${ASSET_VERSION}" />
  <script>
    window.TEAM_CONSOLE_BOOT = {
      apiBase: "",
      assetVersion: "${ASSET_VERSION}"
    };
  </script>
  <script defer src="/static/js/reserve_activate_console.js?v=${ASSET_VERSION}"></script>
</head>
<body class="activate-page">
  <div class="bg-orb bg-orb-a"></div>
  <div class="bg-orb bg-orb-b"></div>
  <div id="activate-app" class="app-shell">
    <main class="loading-card">
      <p class="eyebrow">PLUS GOPAY</p>
      <h1>正在载入兑换页面</h1>
      <p>请稍候，页面会自动准备卡号兑换功能。</p>
    </main>
  </div>
</body>
</html>`;

function send(res, statusCode, headers, body) {
  res.writeHead(statusCode, headers);
  res.end(body);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function proxyHeaders(req) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue;
    const lower = key.toLowerCase();
    if (["host", "connection", "content-length", "expect"].includes(lower)) continue;
    headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }
  return headers;
}

function responseHeaders(response, extra = {}) {
  const headers = {};
  response.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (["content-encoding", "content-length", "transfer-encoding"].includes(lower)) return;
    headers[key] = value;
  });
  return { ...headers, ...extra };
}

function replaceContacts(source) {
  return source
    .replace(
      /const\s+SUPPORT_QQ\s*=\s*\{\s*code:\s*".*?",\s*link:\s*".*?",?\s*\};/s,
      `const SUPPORT_QQ = {
    code: "${QQ_GROUP_NUMBER}",
    link: "${QQ_GROUP_LINK}",
  };`
    )
    .replace(
      /const\s+AGENT_QQ\s*=\s*\{\s*code:\s*".*?",\s*link:\s*".*?",?\s*\};/s,
      `const AGENT_QQ = {
    code: "${AGENT_QQ_NUMBER}",
    link: "${AGENT_QQ_LINK}",
  };`
    )
    .replace(
      /const QQ_GROUP_NUMBER = ".*?";/,
      `const QQ_GROUP_NUMBER = "${QQ_GROUP_NUMBER}";`
    )
    .replace(
      /const QQ_GROUP_LINK = ".*?";/,
      `const QQ_GROUP_LINK = "${QQ_GROUP_LINK}";`
    )
    .replace(
      /const AGENT_QQ_NUMBER = ".*?";/,
      `const AGENT_QQ_NUMBER = "${AGENT_QQ_NUMBER}";`
    )
    .replace(
      /const AGENT_QQ_LINK = ".*?";/,
      `const AGENT_QQ_LINK = "${AGENT_QQ_LINK}";`
    );
}

function replacePurchaseLinkInConfig(buffer) {
  const text = buffer.toString("utf8");
  try {
    const data = JSON.parse(text);
    if (typeof data.service_notice === "string") {
      data.service_notice = data.service_notice.replace(
        /(codex\s*接码购买链接[：:]\s*)https?:\/\/[^\s*=\n]+/i,
        `$1${CODEX_PURCHASE_LINK}`
      );
    }
    return Buffer.from(JSON.stringify(data));
  } catch (error) {
    return Buffer.from(text.replace(/https:\/\/pay\.ldxp\.cn\/item\/[A-Za-z0-9_-]+/g, CODEX_PURCHASE_LINK));
  }
}

async function proxyPage(res) {
  const response = await fetch(`${OLD_ORIGIN}/activate`, {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  const body = await response.text();
  send(res, response.status, responseHeaders(response, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
  }), body);
}

async function proxyStatic(req, res, pathname, search) {
  const versionedSearch = search || `?v=${ASSET_VERSION}`;
  const oldPath = pathname === "/static/js/reserve_activate_console.js"
    ? `/static/js/reserve_activate_console.js${versionedSearch}`
    : `${pathname}${versionedSearch}`;
  const response = await fetch(`${OLD_ORIGIN}${oldPath}`);

  if (pathname === "/static/js/reserve_activate_console.js") {
    const body = replaceContacts(await response.text());
    send(res, response.status, responseHeaders(response, {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "no-store",
    }), body);
    return;
  }

  const body = Buffer.from(await response.arrayBuffer());
  send(res, response.status, responseHeaders(response), body);
}

async function proxyApi(req, res, pathname, search) {
  const body = ["GET", "HEAD"].includes(req.method || "") ? undefined : await readRequestBody(req);
  const response = await fetch(`${OLD_ORIGIN}${pathname}${search}`, {
    method: req.method,
    headers: proxyHeaders(req),
    body,
    redirect: "manual",
  });
  let responseBody = Buffer.from(await response.arrayBuffer());
  const extraHeaders = {};
  if (pathname === "/api/public/plus-gopay-redeem-config" && response.ok) {
    responseBody = replacePurchaseLinkInConfig(responseBody);
    extraHeaders["content-type"] = "application/json; charset=utf-8";
    extraHeaders["cache-control"] = "no-store";
  }
  send(res, response.status, responseHeaders(response, extraHeaders), responseBody);
}

async function handle(req, res) {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const { pathname, search } = url;

    if (pathname === "/healthz") {
      send(res, 200, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      }, JSON.stringify({ ok: true }));
      return;
    }

    if (["/", "/activate", "/activate-plus", "/activate-team"].includes(pathname)) {
      await proxyPage(res);
      return;
    }

    if (pathname.startsWith("/api/public/")) {
      await proxyApi(req, res, pathname, search);
      return;
    }

    if (pathname.startsWith("/static/")) {
      await proxyStatic(req, res, pathname, search);
      return;
    }

    send(res, 404, { "content-type": "text/plain; charset=utf-8" }, "Not found");
  } catch (error) {
    console.error(error);
    send(res, 502, { "content-type": "text/plain; charset=utf-8" }, "Proxy error");
  }
}

if (require.main === module) {
  http.createServer(handle).listen(PORT, () => {
    console.log(`Activation contact site running at http://localhost:${PORT}`);
  });
}

module.exports = handle;
