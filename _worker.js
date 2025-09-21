export default {
  async fetch(request, env) {
    const targetURL = env.URL;       // 目标站点地址（如 https://example.com）
    const password = env.PASSWORD;   // 环境变量中的密码

    const { pathname, search } = new URL(request.url);
    const cookies = request.headers.get("Cookie") || "";
    const isAuth = cookies.includes("auth=1");

    // 如果未登录，则返回登录页或处理登录表单
    if (!isAuth) {
      if (request.method === "POST") {
        // 处理登录表单提交
        const formData = await request.formData();
        const input = formData.get("password");
        if (input === password) {
          // 登录成功：设置 Cookie 并重定向到原路径
          const response = new Response(null, { status: 302 });
          response.headers.set("Set-Cookie", "auth=1; Path=/; HttpOnly");
          response.headers.set("Location", request.url);
          return response;
        } else {
          // 密码错误：显示登录页面并提示错误
          const html = loginPageHtml("密码错误，请重试。");
          return new Response(html, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
        }
      }
      // 返回登录页面（GET 请求）
      return new Response(loginPageHtml(), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
    }

    // 已登录，继续反向代理
    // 构建目标站点 URL
    const target = new URL(targetURL);
    const fetchURL = new URL(targetURL);
    // 支持 env.URL 包含路径前缀的情况
    fetchURL.pathname = target.pathname.replace(/\/$/, "") + pathname;
    fetchURL.search = search;

    // 转发请求到目标站点
    const init = {
      method: request.method,
      headers: request.headers,
      body: request.method === "GET" || request.method === "HEAD" ? null : request.body
    };
    let res = await fetch(fetchURL.toString(), init);

    // 如果是 HTML 内容，则使用 HTMLRewriter 修改其中的链接
    const contentType = res.headers.get("Content-Type") || "";
    if (contentType.startsWith("text/html")) {
      const targetOrigin = new URL(targetURL).origin;
      const workerOrigin = new URL(request.url).origin;
      // 定义用于重写链接的类
      class UrlRewriter {
        constructor(attrName) {
          this.attrName = attrName;
        }
        element(element) {
          const attr = element.getAttribute(this.attrName);
          if (!attr) return;
          try {
            const url = new URL(attr);
            // 如果链接是绝对的目标域名，替换为 Worker 路径
            if (url.origin === targetOrigin) {
              element.setAttribute(this.attrName, workerOrigin + url.pathname + url.search + url.hash);
            }
          } catch (e) {
            // 如果链接是以 '/' 开头的相对路径，也指向目标站点根路径，替换为 Worker 域名
            if (attr.startsWith("/")) {
              element.setAttribute(this.attrName, workerOrigin + attr);
            }
            // 其他相对路径暂不处理
          }
        }
      }
      // 实例化 HTMLRewriter，并指定要处理的标签及其属性
      const rewriter = new HTMLRewriter()
        .on("a", new UrlRewriter("href"))
        .on("img", new UrlRewriter("src"))
        .on("script", new UrlRewriter("src"))
        .on("link", new UrlRewriter("href"))
        .on("iframe", new UrlRewriter("src"))
        .on("form", new UrlRewriter("action"));
      return rewriter.transform(res);
    }

    // 非 HTML 内容直接返回
    return res;
  }
};

// 登录页面的 HTML 及样式
function loginPageHtml(errorMsg = "") {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>登录验证</title>
  <style>
    body {
      display: flex; align-items: center; justify-content: center;
      height: 100vh; margin: 0; font-family: Arial, sans-serif;
      background-color: #f0f2f5;
    }
    .card {
      background: #fff; padding: 2em; border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 320px;
      text-align: center;
    }
    .card h2 { margin-bottom: 1em; color: #333; }
    .card input[type="password"] {
      width: 100%; padding: 0.5em; margin-bottom: 1em;
      border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;
    }
    .card button {
      width: 100%; padding: 0.75em; background: #0070f3;
      color: #fff; border: none; border-radius: 4px;
      font-size: 1em; cursor: pointer;
    }
    .card button:hover { background: #0055aa; }
    .error { color: #d93025; margin-bottom: 1em; }
  </style>
</head>
<body>
  <div class="card">
    <h2>请输入密码</h2>
    <p>此页面受密码保护，请输入密码以继续。</p>
    ${errorMsg ? `<p class="error">${errorMsg}</p>` : ""}
    <form method="POST">
      <input type="password" name="password" placeholder="密码" required />
      <button type="submit">登录</button>
    </form>
  </div>
</body>
</html>`;
}
