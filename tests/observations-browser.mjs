import { chromium, expect } from '@playwright/test'
import { readFileSync, readdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'
import YAML from 'yaml'

const base = process.argv[process.argv.indexOf('--base-url') + 1]
assert(base && /^https?:\/\//.test(base), 'Supply --base-url http(s)://…')
const out = mkdtempSync(join(tmpdir(), 'observations-browser-'))
const records = readdirSync('content/Journal').filter(f => f.endsWith('.md')).map(file => {
  const [, front, body] = readFileSync(`content/Journal/${file}`, 'utf8').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  return { file, metadata: YAML.parse(front), body: body.trim() }
})
// Independent expected strings, not the implementation's formatter.
const labels = { '2025-08-20': 'August 20, 2025', '2025-08-21': 'August 21, 2025', '2026-09-24': 'September 24, 2026' }
const browser = await chromium.launch({ headless: true })
try {
  for (const [name, viewport, timezoneId] of [
    ['desktop', { width: 1440, height: 1000 }, 'America/Chicago'],
    ['mobile', { width: 390, height: 844 }, 'Pacific/Kiritimati'],
  ]) {
    const context = await browser.newContext({ viewport, timezoneId })
    const page = await context.newPage()
    page.setDefaultTimeout(10000)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(base, { waitUntil: 'networkidle' })
    const listResponse = await context.request.get(`${base}/api/content?directory=Journal`)
    assert.equal(listResponse.status(), 200)
    const listed = (await listResponse.json()).files
    assert.equal(listed.length, records.length)
    if (name === 'mobile') await page.getByRole('button', { name: 'Open navigation', exact: true }).click()
    await page.getByRole('button', { name: /05 Observations/ }).filter({ visible: true }).click()
    for (const record of records) {
      const { title, date } = record.metadata
      const apiRecord = listed.find(x => x.name === record.file)
      assert(apiRecord, `Legacy listing includes ${record.file}`)
      assert.equal(apiRecord.metadata.date, date)
      const button = page.getByRole('button', { name: `${title} Published ${labels[date]}`, exact: true }).filter({ visible: true })
      await expect(button).toBeVisible()
      await expect(button.locator('time')).toHaveAttribute('datetime', date)
    }
    await page.screenshot({ path: join(out, `${name}-listing.png`) })
    for (const record of records) {
      const { title, date } = record.metadata
      await page.getByRole('button', { name: `${title} Published ${labels[date]}`, exact: true }).filter({ visible: true }).click()
      const article = page.locator('article').filter({ has: page.getByRole('heading', { name: title, exact: true }) })
      await expect(article).toBeVisible()
      await expect(article.locator('time')).toHaveText(labels[date])
      await expect(article.locator('time')).toHaveAttribute('datetime', date)
      await expect(article.locator('p').first()).toHaveText('Observations')
      await expect(article).toContainText(`Published ${labels[date]}`)
      // Let the interface's smooth scroll finish before asserting the visible viewport.
      await page.waitForTimeout(1000)
      await expect(article.locator('time')).toBeInViewport()
      const timeBox = await article.locator('time').boundingBox()
      assert(timeBox && timeBox.x >= 0 && timeBox.x + timeBox.width <= viewport.width, 'Date fits viewport')
      await page.screenshot({ path: join(out, `${name}-${record.file}.png`) })
      const response = await context.request.get(`${base}/api/content?directory=Journal&file=${record.file}`)
      assert.equal(response.status(), 200)
      const data = await response.json()
      assert.equal(data.metadata.date, date)
      assert.equal(data.title, title)
      assert.equal(data.content, record.body)
      console.log(`PASS ${name}: ${record.file}: Published ${labels[date]}; legacy API body/date/title unchanged`)
      if (name === 'mobile') await page.getByRole('button', { name: 'Open navigation', exact: true }).click()
    }
    assert.deepEqual(errors, [])
    await context.close()
  }
  console.log(`PASS desktop/mobile UI and API; screenshots: ${out}`)
} finally { await browser.close() }
