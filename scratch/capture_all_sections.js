const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const scratchDir = 'C:\\Users\\anani\\.gemini\\antigravity\\brain\\31f74c38-89ca-4962-b82d-11829e033e68\\scratch';
const htmlUrl = 'file:///c:/Users/anani/Downloads/ETS/etsagbonougla.net/index.html';

const viewports = [
  { name: '1440_desktop', width: 1440, height: 900 },
  { name: '1024_tablet_ls', width: 1024, height: 768 },
  { name: '768_tablet_pt', width: 768, height: 1024 },
  { name: '390_mobile', width: 390, height: 844 },
  { name: '320_small_mob', width: 320, height: 600 }
];

async function runTest() {
  const profile = path.join(scratchDir, 'chromeprof_capture');
  const port = 9226;

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
          const res = JSON.parse(msg.data);
          if (res.id === id) {
            ws.removeEventListener('message', handler);
            resolve(res.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });

      ws.onopen = async () => {
        console.log('Connected to CDP websocket');

        for (const vp of viewports) {
          console.log(`\n=== Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ===`);

          // Resize viewport
          await send('Emulation.setDeviceMetricsOverride', {
            width: vp.width,
            height: vp.height,
            deviceScaleFactor: 1,
            mobile: vp.width <= 768
          });

          // Reset scroll
          await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0);' });
          await new Promise(r => setTimeout(r, 300));

          // Check overflow at top
          const overflowCheck1 = await send('Runtime.evaluate', {
            expression: `({
              scrollWidth: document.documentElement.scrollWidth,
              innerWidth: window.innerWidth,
              hasOverflow: document.documentElement.scrollWidth > window.innerWidth
            })`,
            returnByValue: true
          });
          console.log('Top overflow check:', overflowCheck1.result.value);

          // Capture Hero screenshot
          const heroSnap = await send('Page.captureScreenshot', { format: 'png' });
          const heroPath = path.join(scratchDir, `shot_${vp.name}_hero.png`);
          fs.writeFileSync(heroPath, Buffer.from(heroSnap.data, 'base64'));
          console.log(`Saved: ${heroPath}`);

          // Scroll step by step through the page to trigger all IntersectionObservers and scroll progress
          const totalHeightRes = await send('Runtime.evaluate', {
            expression: 'document.documentElement.scrollHeight',
            returnByValue: true
          });
          const totalHeight = totalHeightRes.result.value;

          const step = Math.round(vp.height * 0.7);
          for (let y = 0; y <= totalHeight; y += step) {
            await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${y});` });
            await new Promise(r => setTimeout(r, 60));
          }

          // Let animations settle
          await new Promise(r => setTimeout(r, 600));

          // Check overflow after scrolling
          const overflowCheck2 = await send('Runtime.evaluate', {
            expression: `({
              scrollWidth: document.documentElement.scrollWidth,
              innerWidth: window.innerWidth,
              hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
              unrevealedMasks: document.querySelectorAll('[data-reveal="mask"]:not(.is-in)').length,
              unrevealedEls: document.querySelectorAll('[data-reveal]:not(.is-in)').length
            })`,
            returnByValue: true
          });
          console.log('Scrolled overflow & reveal status:', overflowCheck2.result.value);

          // Capture Solutions / Product section screenshot
          await send('Runtime.evaluate', {
            expression: `(() => {
              const el = document.getElementById('solutions');
              if (el) window.scrollTo(0, el.offsetTop - 20);
            })()`
          });
          await new Promise(r => setTimeout(r, 400));
          const solSnap = await send('Page.captureScreenshot', { format: 'png' });
          const solPath = path.join(scratchDir, `shot_${vp.name}_solutions.png`);
          fs.writeFileSync(solPath, Buffer.from(solSnap.data, 'base64'));

          // Capture Product stage screenshot
          await send('Runtime.evaluate', {
            expression: `(() => {
              const el = document.querySelector('.h-product');
              if (el) window.scrollTo(0, el.offsetTop);
            })()`
          });
          await new Promise(r => setTimeout(r, 400));
          const prodSnap = await send('Page.captureScreenshot', { format: 'png' });
          const prodPath = path.join(scratchDir, `shot_${vp.name}_product.png`);
          fs.writeFileSync(prodPath, Buffer.from(prodSnap.data, 'base64'));
        }

        console.log('\nAll viewport captures completed successfully!');
        ws.close();
        proc.kill();
      };
    });
  });
}

runTest();
