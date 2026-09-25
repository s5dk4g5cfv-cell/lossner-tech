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
const labels = { '2025-08-20': 'August 20, 2025', '2025-08-21': 'August 21, 2025', '2026-09-24': 'September 24, 2026', '2026-01-05': 'January 5, 2026', '2026-01-12': 'January 12, 2026', '2026-01-26': 'January 26, 2026', '2026-02-09': 'February 9, 2026', '2026-07-20': 'July 20, 2026', '2026-09-07': 'September 7, 2026', '2026-09-14': 'September 14, 2026', '2026-09-21': 'September 21, 2026' }
const buttonName = record => `${record.metadata.title} ${record.metadata.originalUrl ? 'Originally published' : 'Published'} ${labels[record.metadata.date]} ${record.metadata.author ?? 'Joshua Lossner'}`
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
      const button = page.getByRole('button', { name: buttonName(record), exact: true }).filter({ visible: true })
      await expect(button).toBeVisible()
      await expect(button.locator('time')).toHaveAttribute('datetime', date)
    }
    const visibleRecords = page.getByRole('button').filter({ has: page.locator('time') }).filter({ visible: true })
    const dates = await visibleRecords.locator('time').evaluateAll(nodes => nodes.map(node => node.getAttribute('datetime')))
    assert.deepEqual(dates, records.map(record => record.metadata.date).sort().reverse())
    await page.screenshot({ path: join(out, `${name}-listing.png`) })
    for (const record of records) {
      const { title, date } = record.metadata
      await page.getByRole('button', { name: buttonName(record), exact: true }).filter({ visible: true }).click()
      const article = page.locator('article').filter({ has: page.getByRole('heading', { name: title, exact: true }) })
      await expect(article).toBeVisible()
      await expect(article.locator('time').first()).toHaveText(labels[date])
      await expect(article.locator('time').first()).toHaveAttribute('datetime', date)
      await expect(article.locator('p').first()).toHaveText('Observations')
      await expect(article).toContainText(`${record.metadata.originalUrl ? 'Originally published' : 'Published'} ${labels[date]}`)
      await expect(article).toContainText(record.metadata.author ?? 'Joshua Lossner')
      if (record.metadata.originalUrl) {
        await expect(article.getByRole('link', { name: 'Read the original on Coherenceism' })).toHaveAttribute('href', record.metadata.originalUrl)
        await expect(article).toContainText('Review date: September 25, 2026')
        await expect(article.getByRole('heading', { name: 'Sources', exact: true })).toBeAttached()
        const opening = record.body.replace(/^# [^\n]+\n+/, '').split('\n\n')[0].replace(/[*_]/g, '')
        await expect(article).toContainText(opening)
      }
      // Let the interface's smooth scroll finish before asserting the visible viewport.
      await page.waitForTimeout(1000)
      await expect(article.locator('time').first()).toBeInViewport()
      const timeBox = await article.locator('time').first().boundingBox()
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
