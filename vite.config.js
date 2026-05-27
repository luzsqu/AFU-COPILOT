import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      {
        name: 'jira-server-proxy',
        configureServer(server) {
          server.middlewares.use('/api/jira-proxy', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }
            let raw = '';
            req.on('data', chunk => { raw += chunk.toString(); });
            req.on('end', async () => {
              try {
                const { baseUrl, path, method, auth, body: jiraBody } = JSON.parse(raw);
                const url = `${(baseUrl || '').replace(/\/$/, '')}${path}`;
                const fetchOpts = {
                  method: method || 'GET',
                  headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  }
                };
                if (jiraBody && method !== 'GET') fetchOpts.body = jiraBody;

                const jiraRes = await fetch(url, fetchOpts);
                const text    = await jiraRes.text();
                res.statusCode = jiraRes.status;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(text);
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message }));
              }
            });
          });
        }
      }
    ],
    server: {
      proxy: {
        '/proxy/groq': {
          target: 'https://api.groq.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/proxy\/groq/, '')
        },
        '/proxy/openai': {
          target: 'https://api.openai.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/proxy\/openai/, '')
        },
        '/proxy/anthropic': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/proxy\/anthropic/, '')
        },
        '/proxy/xai': {
          target: 'https://api.x.ai',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/proxy\/xai/, '')
        }
      }
    }
  };
});
