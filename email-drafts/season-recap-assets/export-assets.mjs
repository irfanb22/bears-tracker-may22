import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const repoRoot = path.resolve(new URL('../../..', import.meta.url).pathname);
const host = '127.0.0.1';
const port = 43123;

const assets = [
  {
    pagePath: '/email-drafts/season-recap-assets/community-accuracy.html',
    outputPath: '/public/email/recap-2025/community-accuracy.png',
    viewport: { width: 1400, height: 1200 },
  },
  {
    pagePath: '/email-drafts/season-recap-assets/caleb-record.html',
    outputPath: '/public/email/recap-2025/caleb-record.png',
    viewport: { width: 1400, height: 700 },
  },
  {
    pagePath: '/email-drafts/season-recap-assets/playoff-split.html',
    outputPath: '/public/email/recap-2025/playoff-split.png',
    viewport: { width: 1200, height: 900 },
  },
  {
    pagePath: '/email-drafts/season-recap-assets/odunze-stats.html',
    outputPath: '/public/email/recap-2025/rome-odunze.png',
    viewport: { width: 1400, height: 900 },
  },
  {
    pagePath: '/email-drafts/season-recap-assets/offense-surprise.html',
    outputPath: '/public/email/recap-2025/offense-surprise.png',
    viewport: { width: 900, height: 700 },
  },
  {
    pagePath: '/email-drafts/season-recap-assets/draft-pick.html',
    outputPath: '/public/email/recap-2025/draft-pick.png',
    viewport: { width: 1400, height: 1000 },
  },
];

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.js') return 'text/javascript; charset=utf-8';
  return 'application/octet-stream';
}

const server = http.createServer(async (req, res) => {
  try {
    const requestPath = new URL(req.url, `http://${host}:${port}`).pathname;
    const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(repoRoot, safePath);

    if (!filePath.startsWith(repoRoot)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    const data = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType(filePath) });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

async function main() {
  await new Promise((resolve) => server.listen(port, host, resolve));

  const browser = await chromium.launch({ headless: true });
  try {
    for (const asset of assets) {
      const page = await browser.newPage({
        viewport: asset.viewport,
        deviceScaleFactor: 2,
      });

      await page.goto(`http://${host}:${port}${asset.pagePath}`, {
        waitUntil: 'networkidle',
      });

      const target = page.locator('[data-export-root]');
      await target.screenshot({
        path: path.join(repoRoot, asset.outputPath),
      });

      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
