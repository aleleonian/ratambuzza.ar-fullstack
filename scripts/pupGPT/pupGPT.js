const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const filesToUpload = [
  path.resolve(__dirname, 'avatars/marian.png'),
  path.resolve(__dirname, 'avatars/butis.png'),
  path.resolve(__dirname, 'avatars/latigo.png'),
];

const prompt = `Create a SNES-style pixel art composition using the 3 uploaded avatars. They should be holding an imaginary camera and smiling, as if taking a group selfie. In the background, you can see a landscape of Rio. Render in smooth 16-bit shading with warm colors.`;

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: './chrome_data', // previously authenticated session
    defaultViewport: null,
  });

  const page = await browser.newPage();
  await page.goto('https://chat.openai.com/', { waitUntil: 'networkidle2' });

  // Ensure ChatGPT is fully loaded
  await page.waitForSelector('textarea');

  // Upload files
  for (const file of filesToUpload) {
    const [fileChooser] = await Promise.all([
      page.waitForFileChooser(),
      page.click('button:has-text("Upload")').catch(() => {
        console.warn("Fallback: trying file input directly");
      }),
    ]);

    if (fileChooser) {
      await fileChooser.accept([file]);
    } else {
      // fallback: simulate drag-and-drop
      const input = await page.$('input[type="file"]');
      if (input) await input.uploadFile(file);
    }
  }

  // Type the prompt and submit
  await page.type('textarea', prompt, { delay: 10 });
  await page.keyboard.press('Enter');

  // Wait for image to load
  await page.waitForSelector('img', { timeout: 60_000 });

  // Scrape image URL
  const imageUrl = await page.evaluate(() => {
    const img = Array.from(document.querySelectorAll('img')).find(i =>
      i.src.startsWith('https://files.oaiusercontent.com/')
    );
    return img?.src;
  });

  if (!imageUrl) {
    console.error('No image URL found');
    await browser.close();
    return;
  }

  // Download image
  const imageBuffer = await page.evaluate(async (url) => {
    const response = await fetch(url);
    return Array.from(new Uint8Array(await response.arrayBuffer()));
  }, imageUrl);

  const buffer = Buffer.from(imageBuffer);
  const outputPath = path.resolve(__dirname, `postcard-${Date.now()}.png`);
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Image saved to ${outputPath}`);

  await browser.close();
})();
