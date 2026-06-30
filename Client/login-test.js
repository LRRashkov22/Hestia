const https = require('https');
const data = JSON.stringify({ email: 'admin@gmail.com', password: 'admin' });
const loginOpts = {
  hostname: 'localhost',
  port: 7147,
  path: '/api/identity/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
  rejectUnauthorized: false,
};

const req = https.request(loginOpts, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('LOGIN STATUS', res.statusCode);
    console.log(body);
    if (res.statusCode === 200) {
      try {
        const json = JSON.parse(body);
        const token = json.AccessToken || json.accessToken;
        console.log('TOKEN length', token ? token.length : 'missing');
        if (!token) return;
        const cardsOpts = {
          hostname: 'localhost',
          port: 7147,
          path: '/api/events/organizer/dashboard/cards',
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          rejectUnauthorized: false,
        };
        const req2 = https.request(cardsOpts, (res2) => {
          let body2 = '';
          res2.on('data', (ch) => { body2 += ch; });
          res2.on('end', () => {
            console.log('CARDS STATUS', res2.statusCode);
            console.log(body2);
          });
        });
        req2.on('error', (err) => console.error('CARDS ERR', err));
        req2.end();
      } catch (err) {
        console.error('JSON PARSE ERROR', err);
      }
    }
  });
});
req.on('error', (err) => console.error('LOGIN ERR', err));
req.write(data);
req.end();
