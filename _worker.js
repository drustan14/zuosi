/**

CF Worker: 简单反代 env.URL，密码为 env.PASSWORD

带美化主页 UI */


export default { async fetch(request, env) { const TARGET = env.URL; const PASSWORD = env.PASSWORD; if (!TARGET) return new Response('Missing env.URL', { status: 500 });

const reqUrl = new URL(request.url);

// 美化后的主页 UI
if (reqUrl.pathname === '/' || reqUrl.pathname === '/index.html') {
  const html = `

<!doctype html>

<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>CFWorker 反代面板</title>
  <style>
    :root{--bg1:#0f172a;--bg2:#0b1220;--card:#0b1226;--accent:#7c3aed;--glass:rgba(255,255,255,0.06);--muted:rgba(255,255,255,0.6)}
    html,body{height:100%;margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Helvetica Neue",Arial}
    body{
      background: radial-gradient(1200px 600px at 10% 10%, rgba(124,58,237,0.12), transparent 10%),
                  radial-gradient(900px 500px at 90% 90%, rgba(14,165,233,0.08), transparent 10%),
                  linear-gradient(180deg,var(--bg1),var(--bg2));
      color:#e6eef8;display:flex;align-items:center;justify-content:center;padding:24px;
    }
    .wrap{width:100%;max-width:980px;display:grid;grid-template-columns:1fr 420px;gap:28px}
    .hero{padding:32px;border-radius:16px;background:linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01));box-shadow:0 8px 30px rgba(2,6,23,0.6);backdrop-filter: blur(6px)}
    .logo{display:flex;align-items:center;gap:14px}
    .logo svg{width:48px;height:48px}
    h1{margin:0;font-size:22px}
    p.lead{margin-top:8px;color:var(--muted);max-width:56ch}.card{background:var(--card);padding:20px;border-radius:12px;box-shadow:0 6px 24px rgba(2,6,23,0.5);border:1px solid rgba(255,255,255,0.03)}
label{display:block;font-size:13px;color:var(--muted);margin-bottom:6px}
input[type="text"],input[type="password"],select{width:100%;padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,0.04);background:var(--glass);color:inherit;font-size:14px;outline:none}
.row{display:flex;gap:12px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;border:none;cursor:pointer;background:linear-gradient(90deg,var(--accent),#06b6d4);color:#fff;font-weight:600}
.muted{color:var(--muted);font-size:13px}
.meta{margin-top:12px;font-size:13px;color:var(--muted);display:flex;justify-content:space-between;align-items:center}

.foot{grid-column:1/-1;margin-top:18px;text-align:center;color:var(--muted);font-size:13px}

@media (max-width:880px){.wrap{grid-template-columns:1fr;}.hero{order:2}.card{order:1}}

  </style>
</head>
<body>
  <div class="wrap">
    <div class="hero card">
      <div class="logo">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="4" fill="rgba(255,255,255,0.04)"/>
          <path d="M7 12h10M7 8h10M7 16h6" stroke="white" stroke-opacity="0.9" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div>
          <h1>CFWorker 反代面板</h1>
          <p class="lead">使用此面板输入密码即可通过本 Worker 访问目标站点。响应中的 URL 将被替换为当前代理的地址。</p>
        </div>
      </div>
      <div style="margin-top:18px">
        <div style="display:grid;grid-template-columns:1fr 160px;gap:12px">
          <div>
            <label>目标地址 (env.URL)</label>
            <input type="text" id="target" value="${TARGET}" readonly />
          </div>
          <div>
            <label>当前代理</label>
            <input type="text" id="proxy" value="${reqUrl.origin}" readonly />
          </div>
        </div>
        <div style="margin-top:12px">
          <label>访问路径 (可留空表示根目录)</label>
          <input type="text" id="path" placeholder="/ 或 /index.html 或 /some/page" />
        </div>
      </div>
    </div><div class="card" style="display:flex;flex-direction:column;gap:12px;align-items:stretch">
  <div>
    <label>密码</label>
    <input type="password" id="pw" placeholder="输入访问密码" />
  </div>
  <div>
    <label>认证方式</label>
    <select id="mode">
      <option value="query">查询参数 (?pw=)</option>
      <option value="bearer">Authorization: Bearer</option>
      <option value="header">x-proxy-password Header</option>
    </select>
  </div>

  <div style="display:flex;gap:8px">
    <button class="btn" id="open">访问</button>
    <button class="btn" id="curl" style="background:transparent;border:1px solid rgba(255,255,255,0.06);color:inherit">复制 curl</button>
  </div>

  <div class="meta">
    <div class="muted">注：如果服务器返回重定向，Location 会被改写为代理地址。</div>
    <div class="muted">安全提示：不要在不受信任的环境粘贴密码。</div>
  </div>
</div>

<div class="foot">快速提示：你也可以使用 <code>Authorization: Bearer &lt;PASSWORD&gt;</code> 或者 <code>x-proxy-password</code> 请求头进行认证。</div>

  </div>  <script>
    (function(){
      const el = id => document.getElementById(id);
      function normPath(p){ if(!p) return '/'; return p.startsWith('/')? p : '/' + p }
      function buildUrl(){
        const mode = el('mode').value;
        const pw = el('pw').value;
        const path = normPath(el('path').value || '/');
        const base = location.origin + path;
        if(mode === 'query') return base + '?pw=' + encodeURIComponent(pw);
        return base; // for header/bearer we'll use curl or instruct to use header
      }

      el('open').addEventListener('click', ()=>{
        const mode = el('mode').value;
        const pw = el('pw').value;
        if(!pw) return alert('请输入密码');
        if(mode === 'query'){
          window.location.href = buildUrl();
        } else if(mode === 'bearer'){
          // 使用 fetch 并设置 Authorization header，然后把返回的 HTML 替换打开新窗口
          fetch(location.origin + normPath(el('path').value || '/'), {headers:{'Authorization':'Bearer ' + pw}})
            .then(r=>{
              if(r.status===401) throw new Error('Unauthorized');
              return r.text();
            })
            .then(t=>{
              const win = window.open('about:blank');
              win.document.open(); win.document.write(t); win.document.close();
            }).catch(e=>alert(e.message || e));
        } else {
          // header 模式：通过 fetch 加自定义头
          fetch(location.origin + normPath(el('path').value || '/'), {headers:{'x-proxy-password': pw}})
            .then(r=>{
              if(r.status===401) throw new Error('Unauthorized');
              return r.text();
            })
            .then(t=>{
              const win = window.open('about:blank');
              win.document.open(); win.document.write(t); win.document.close();
            }).catch(e=>alert(e.message || e));
        }
      });

      el('curl').addEventListener('click', ()=>{
        const mode = el('mode').value;
        const pw = el('pw').value;
        const path = normPath(el('path').value || '/');
        if(!pw) return alert('请输入密码以生成 curl');
        let cmd = '';
        if(mode === 'query'){
          cmd = `curl -L "${location.origin}${path}?pw=${encodeURIComponent(pw)}"`;
        } else if(mode === 'bearer'){
          cmd = `curl -L -H 'Authorization: Bearer ${pw}' "${location.origin}${path}"`;
        } else {
          cmd = `curl -L -H 'x-proxy-password: ${pw}' "${location.origin}${path}"`;
        }
        navigator.clipboard.writeText(cmd).then(()=>alert('已复制 curl 到剪贴板'));
      });
    })();
  </script></body>
</html>
      `;
      return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }// 验证密码：支持 Authorization: Bearer, x-proxy-password header, 或 ?pw=xxx
const authHeader = request.headers.get('authorization') || '';
const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
const provided = reqUrl.searchParams.get('pw') || request.headers.get('x-proxy-password') || bearer;
if (provided !== PASSWORD) {
  return new Response('Unauthorized', { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="CF-Proxy"' } });
}

// 构造上游 URL：把请求的 path+search 拼到 env.URL 上
const upstream = new URL(reqUrl.pathname + reqUrl.search, TARGET);
const headers = new Headers(request.headers);
headers.delete('host');

const upstreamReq = new Request(upstream.toString(), {
  method: request.method,
  headers,
  body: request.body,
  redirect: 'manual',
});

const resp = await fetch(upstreamReq);

// 复制响应头并准备可能的替换
const newHeaders = new Headers(resp.headers);
const targetOrigin = (new URL(TARGET)).origin; // e.g. https://example.com
const proxyOrigin = reqUrl.protocol + '//' + reqUrl.host; // 当前反代 origin

// 如果有重定向 Location，替换为代理 origin
if (newHeaders.has('location')) {
  const loc = newHeaders.get('location');
  if (loc && loc.startsWith(targetOrigin)) {
    newHeaders.set('location', loc.replace(targetOrigin, proxyOrigin));
  }
}

const contentType = (newHeaders.get('content-type') || '').toLowerCase();

// 仅对 HTML 做文本替换
if (contentType.includes('text/html')) {
  let text = await resp.text();

  // 简单且覆盖大多数情况的替换：
  const escapeRegExp = s => s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
  const reOrigin = new RegExp(escapeRegExp(targetOrigin), 'g');
  text = text.replace(reOrigin, proxyOrigin);

  const targetHost = (new URL(TARGET)).host; // host:port
  const reProtoRel = new RegExp('//' + escapeRegExp(targetHost), 'g');
  text = text.replace(reProtoRel, '//' + reqUrl.host);

  newHeaders.delete('content-length');

  return new Response(text, { status: resp.status, headers: newHeaders });
}

// 非 HTML，直接透传（stream）
return new Response(resp.body, { status: resp.status, headers: newHeaders });

} };

