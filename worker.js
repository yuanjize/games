/**
 * Cloudflare Workers for Static Game Site
 * 使用 Assets 绑定服务静态文件
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 从 Assets 中获取文件
    // 处理根路径和目录索引
    let assetPath = pathname;

    // 如果是根路径，返回 index.html
    if (pathname === '/' || pathname === '') {
      assetPath = '/index.html';
    }
    // 如果路径是目录（没有扩展名），尝试添加 index.html
    else if (!pathname.includes('.') || pathname.endsWith('/')) {
      assetPath = pathname.endsWith('/') ? pathname + 'index.html' : pathname + '/index.html';
    }

    // 从 Assets 获取文件
    let response = await env.ASSETS.fetch(new URL(assetPath, request.url));

    // 如果文件不存在，尝试去掉开头的斜杠
    if (!response || response.status === 404) {
      const altPath = assetPath.startsWith('/') ? assetPath.slice(1) : '/' + assetPath;
      response = await env.ASSETS.fetch(new URL(altPath, request.url));
    }

    // 如果仍然 404，对于 SPA 路由，回退到 index.html
    if (!response || response.status === 404) {
      response = await env.ASSETS.fetch(new URL('/index.html', request.url));
    }

    // 添加安全头
    if (response) {
      response = new Response(response.body, response);
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');

      // 为 HTML 文件添加 CSP
      const contentType = response.headers.get('Content-Type') || '';
      if (contentType.includes('text/html')) {
        response.headers.set(
          'Content-Security-Policy',
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self';"
        );
      }
    }

    return response || new Response('Not Found', { status: 404 });
  },
};
