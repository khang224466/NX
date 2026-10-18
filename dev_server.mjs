import http from 'node:http';
import { createServer as createViteServer } from 'vite';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '8443', 10);

const PYTHON_CANDIDATE_PATHS = [
  process.env.PYTHON_PATH,
  'C:\\Users\\LEGION\\AppData\\Local\\Programs\\DeepSeek Harness\\resources\\runtime\\primary-runtime\\dependencies\\python\\python.exe',
  'python',
  'py'
].filter(Boolean);

function resolvePythonExecutable() {
  for (const p of PYTHON_CANDIDATE_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return 'python';
}

function resolveScriptPath(scriptName) {
  const localPath = path.resolve(__dirname, 'scripts', scriptName);
  if (fs.existsSync(localPath)) return localPath;
  const rootPath = path.resolve('D:\\scripts', scriptName);
  if (fs.existsSync(rootPath)) return rootPath;
  return localPath;
}

async function start() {
  const vite = await createViteServer({
    server: { 
      middlewareMode: true,
      watch: {
        ignored: [
          '**/vite.config.*',
          '**/.env*',
          '**/.figma/**',
          '**/node_modules/**',
          '**/data/**',
          '**/.pnpm-store/**',
          '**/SteamLibrary/**',
          '**/Riot Games/**',
          '**/VMware*/**',
          '**/dist/**',
          '**/.git/**',
          '**/nx-nexora*/**',
          '**/*Culture Trends*/**',
          '**/*SiriusXM*/**',
          '**/AI/**',
          '**/$RECYCLE.BIN/**',
          '**/System Volume Information/**',
          '**/*.log',
          '**/*.tmp'
        ]
      }
    },
    appType: 'spa'
  });

  const server = http.createServer((req, res) => {
    const url = req.url?.split('?')[0];

    // Status
    if (url === '/api/ai/status' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        hasServerKey: Boolean(process.env.GEMINI_API_KEY),
        hasGroqKey: Boolean(process.env.GROQ_API_KEY),
        recommendedModel: 'gemini-2.0-flash',
        hybridEngineReady: true,
        duckdbPath: 'data/career_guidance.duckdb',
        chromaPath: 'data/chroma_db'
      }));
      return;
    }

    // Career Query
    if (url === '/api/ai/career-query' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        let question = '';
        try {
          const parsed = JSON.parse(body || '{}');
          question = parsed.question || '';
        } catch {}

        if (!question) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Thiếu question' }));
          return;
        }

        const pythonPath = resolvePythonExecutable();
        const scriptPath = resolveScriptPath('query_api_bridge.py');

        const pyProc = spawn(pythonPath, [scriptPath, '--question', question], {
          env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
          cwd: __dirname
        });

        let stdout = '';
        let stderr = '';
        pyProc.stdout.on('data', chunk => { stdout += chunk.toString('utf-8'); });
        pyProc.stderr.on('data', chunk => { stderr += chunk.toString('utf-8'); });

        pyProc.on('close', code => {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          if (code !== 0 && !stdout.trim()) {
            res.end(JSON.stringify({ success: false, error: stderr || `Exit ${code}` }));
            return;
          }
          try {
            const parsed = JSON.parse(stdout.trim());
            res.end(JSON.stringify({ success: true, ...parsed }));
          } catch {
            res.end(JSON.stringify({ success: true, reply: stdout.trim(), source: 'HYBRID_ENGINE_RAW' }));
          }
        });
      });
      return;
    }

    // Career Data Summary
    if (url === '/api/ai/career-data-summary' && req.method === 'GET') {
      const pythonPath = resolvePythonExecutable();
      const scriptPath = resolveScriptPath('query_api_bridge.py');
      const pyProc = spawn(pythonPath, [scriptPath, '--question', 'Tỷ lệ làm trái ngành theo nhóm ngành trong tập dữ liệu CV'], {
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
        cwd: __dirname
      });
      let stdout = '';
      pyProc.stdout.on('data', chunk => { stdout += chunk.toString('utf-8'); });
      pyProc.on('close', () => {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        try {
          const parsed = JSON.parse(stdout.trim());
          res.end(JSON.stringify({
            success: true,
            databaseSummary: {
              duckdbPath: 'data/career_guidance.duckdb',
              chromaPath: 'data/chroma_db',
              mismatchAnalysis: parsed.sql_analysis?.data || []
            }
          }));
        } catch {
          res.end(JSON.stringify({ success: false, error: 'Không thể tổng hợp' }));
        }
      });
      return;
    }

    // Vite handles all client routing, HMR, assets
    vite.middlewares(req, res);
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[NEXORA HYBRID SERVER] Ready on http://localhost:${PORT}`);
  });
}

start();
