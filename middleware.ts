const ADMIN_CREDENTIAL_SHA256 = '0f7ad3cbd705e74dd14da52352e806ae1f3158ad9880f21ac27f5335f154dd81';

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function continueRequest() {
  return new Response(null, {
    status: 200,
    headers: {
      'x-middleware-next': '1',
    },
  });
}

export default async function middleware(request: Request) {
  const authorization = request.headers.get('authorization') || '';

  if (authorization.startsWith('Basic ')) {
    try {
      const credentials = atob(authorization.slice(6));
      const candidateHash = await sha256Hex(credentials);
      if (candidateHash === ADMIN_CREDENTIAL_SHA256) {
        return continueRequest();
      }
    } catch {
      // Invalid Basic Auth payload: fall through to challenge.
    }
  }

  return new Response('Acceso administrativo protegido.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="ELAN Base Admin", charset="UTF-8"',
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/public-publish'],
};
