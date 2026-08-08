// Static HTML snapshot generator for search-engine crawlers that don't run JS.
// This site is a single page (one route), so a single snapshot is enough.
//
// Setup (not included in package.json by default, to keep `npm install`
// lightweight and network-independent):
//   npm install --save-dev puppeteer
//
// Usage:
//   npm run build
//   npm run preview            # keep this running in one terminal
//   npm run prerender          # in a second terminal
//
// This overwrites dist/index.html with the fully-rendered DOM, so crawlers
// that fetch dist/index.html directly (no JS execution) still see the
// real content, while the JS bundle still hydrates it for real visitors.

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PREVIEW_URL = process.env.PRERENDER_URL || 'http://localhost:4173/'
const OUTPUT = path.join(__dirname, '../dist/index.html')

async function run() {
  let puppeteer
  try {
    puppeteer = (await import('puppeteer')).default
  } catch {
    console.error(
      'Puppeteer n\'est pas installé. Lancez : npm install --save-dev puppeteer'
    )
    process.exit(1)
  }

  const browser = await puppeteer.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.goto(PREVIEW_URL, { waitUntil: 'networkidle0' })
    const html = await page.content()
    writeFileSync(OUTPUT, html)
    console.log(`Snapshot statique écrit dans ${OUTPUT}`)
  } finally {
    await browser.close()
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
