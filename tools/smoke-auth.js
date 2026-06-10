const http = require('http');

const BASE = { host: 'localhost', port: 4000 };

function httpRequest(path, method = 'GET', body = null, cookies = []) {
  const opts = {
    hostname: BASE.host,
    port: BASE.port,
    path,
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (cookies && cookies.length) {
    opts.headers.Cookie = cookies.join('; ');
  }

  return new Promise((resolve, reject) => {
    const req = http.request(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        let data = raw;
        try {
          data = JSON.parse(raw);
        } catch (e) {
          // not JSON
        }
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  try {
    const unique = Date.now();
    const email = `smoke+${unique}@example.com`;
    const password = 'Passw0rd!';
    const username = `smoke${unique}`;

    console.log('Registering user:', email);
    const reg = await httpRequest('/api/auth/register', 'POST', { email, password, username, role: 'VIEWER' });
    console.log('Register status:', reg.status);
    console.log('Register body:', reg.body);
    const setCookie = reg.headers['set-cookie'] || [];
    console.log('Set-Cookie on register:', setCookie);

    console.log('\nLogging in user');
    const login = await httpRequest('/api/auth/login', 'POST', { email, password });
    console.log('Login status:', login.status);
    console.log('Login body:', login.body);
    const loginCookies = login.headers['set-cookie'] || setCookie;
    console.log('Set-Cookie on login:', loginCookies);

    const cookieHeader = (loginCookies || []).map(c => c.split(';')[0]);
    console.log('\nCalling /auth/refresh with cookie:', cookieHeader);
    const refresh = await httpRequest('/api/auth/refresh', 'POST', null, cookieHeader);
    console.log('Refresh status:', refresh.status);
    console.log('Refresh body:', refresh.body);

    if (refresh.status === 200) {
      console.log('\nSmoke test passed: refresh returned 200 and session restored.');
    } else {
      console.log('\nSmoke test may have failed: refresh status', refresh.status);
    }
  } catch (err) {
    console.error('Smoke test error', err);
    process.exit(1);
  }
})();
