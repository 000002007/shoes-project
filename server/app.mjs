import { createServer } from 'node:http';
import { getProvider } from './provider.mjs';
import { normalizeModelName } from './normalize.mjs';
import { validateAttributes } from './attributes.mjs';

const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',').map((s) => s.trim()).filter(Boolean);

function setCors(req, res) {
  const origin = req.headers.origin;
  if (origin && (CORS_ORIGINS.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // Origin отражается выборочно — помечаем, чтобы кэши/прокси не смешивали ответы.
  res.setHeader('Vary', 'Origin');
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8') || '{}';
  return JSON.parse(raw);
}

// Создаёт http-сервер. Провайдер можно передать (удобно для тестов);
// по умолчанию берётся из env через getProvider().
export function createApp(provider = getProvider()) {
  return createServer(async (req, res) => {
    setCors(req, res);
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    try {
      if (req.method === 'GET' && req.url === '/api/health') {
        return json(res, 200, { ok: true });
      }

      if (req.method === 'POST' && req.url === '/api/lookup') {
        const body = await readJsonBody(req).catch(() => null);
        const model = body && typeof body.model === 'string' ? body.model.trim() : '';
        if (!model) return json(res, 400, { error: 'model_required', message: 'Укажите название модели.' });

        const normalized = normalizeModelName(model);
        let attrs;
        try {
          attrs = await provider.lookup(model);
        } catch (e) {
          if (e?.code === 'LLM_NOT_CONFIGURED') {
            return json(res, 503, { error: 'llm_not_configured', message: 'LLM-провайдер не настроен. Введите атрибуты вручную.' });
          }
          throw e;
        }

        const attributes = validateAttributes(attrs);
        return json(res, 200, { normalized, attributes });
      }

      return json(res, 404, { error: 'not_found' });
    } catch {
      return json(res, 500, { error: 'internal_error' });
    }
  });
}

const defaultProvider = getProvider();
export const providerKind = defaultProvider.kind;
export const server = createApp(defaultProvider);
