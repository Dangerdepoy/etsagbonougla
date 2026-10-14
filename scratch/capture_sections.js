const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const scratchDir = 'C:\\Users\\anani\\.gemini\\antigravity\\brain\\31f74c38-89ca-4962-b82d-11829e033e68\\scratch';
const htmlUrl = 'file:///c:/Users/anani/Downloads/ETS/etsagbonougla.net/index.html';

async function test() {
  const profile = path.join(scratchDir, 'chromeprof_sec_shots');
  const port = 9228;
  const proc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--window-size=1440,900',
    htmlUrl
  ]);

  await new Promise(r => setTimeout(r, 2200));

  http.get(`http://127.0.0.1:${port}/json/list`, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', async () => {
      const list = JSON.parse(d);
      const page = list.find(x => x.type === 'page');
      if (!page) {
        console.error('No page');
        proc.kill();
        return;
      }
      const ws = new WebSocket(page.webSocketDebuggerUrl);

      let msgId = 1;
      const send = (method, params = {}) => new Promise((resolve) => {
        const id = msgId++;
        const handler = (msg) => {
          const r = JSON.parse(msg.data);
          if (r.id === id) {
            ws.removeEventListener('message', handler);
            resolve(r.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });

      ws.onopen = async () => {
        // Trigger all scroll animations by scrolling down then up
        const totalHeight = (await send('Runtime.evaluate', { expression: 'document.documentElement.scrollHeight', returnByValue: true })).result.value;
        for (let y = 0; y <= totalHeight; y += 300) {
          await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${y});` });
          await new Promise(r => setTimeout(r, 40));
        }
        await new Promise(r => setTimeout(r, 400));

        const sections = [
          { sel: '.h-manifesto', name: '02_manifesto' },
          { sel: '.h-bento', name: '03_bento' },
          { sel: '.h-product', name: '04_product' },
          { sel: '.h-apps', name: '05_apps' },
          { sel: '.h-gallery', name: '06_gallery' },
          { sel: '.h-process', name: '07_process' },
          { sel: '.h-trust', name: '08_trust' },
          { sel: '.h-final', name: '09_final' }
        ];

        for (const s of sections) {
          await send('Runtime.evaluate', {
            expression: `(() => {
              const el = document.querySelector('${s.sel}');
              if (el) el.scrollIntoView({ block: 'start' });
            })()`
          });
          await new Promise(r => setTimeout(r, 400));
          const snap = await send('Page.captureScreenshot', { format: 'png' });
          const snapPath = path.join(scratchDir, `sec_${s.name}.png`);
          fs.writeFileSync(snapPath, Buffer.from(snap.data, 'base64'));
          console.log(`Captured ${s.name}`);
        }

        ws.close();
        proc.kill();
        console.log('ALL SECTIONS CAPTURED SUCCESSFULLY');
      };
    });
  });
}
test();
