import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import YAML from 'yaml'
import { publicationDate } from '../lib/publicationDate.mjs'

const parse = raw => YAML.parse(raw.match(/^---\n([\s\S]*?)\n---/)[1])
const expected = {
  'why-i-built-this-site.md': ['2025-08-20', 'August 20, 2025', 'eb92137bdca18cc9b0ba0e5998edc601cc65754f'],
  'ai-gold-rush-dot-com-echo.md': ['2025-08-21', 'August 21, 2025', 'eb92137bdca18cc9b0ba0e5998edc601cc65754f'],
  'what-are-we-making-room-for.md': ['2026-09-24', 'September 24, 2026', 'f14ff93eb00b91cac452ed0fbf4cdfcb55e3932d'],
}
for (const [file, [iso, label, original]] of Object.entries(expected)) {
  test(`${file}: recorded publication date, original evidence, body preservation and edit stability`, () => {
    const path = `content/Journal/${file}`
    const raw = readFileSync(path, 'utf8')
    const historical = execFileSync('git', ['show', `${original}:${path}`], { encoding: 'utf8' })
    assert.equal(parse(historical).date, iso)
    assert.equal(parse(raw).date, iso)
    assert.deepEqual(publicationDate(parse(raw).date), { iso, label })
    // A throwaway edited document, never a mutation of the published article.
    const edited = raw.replace(/title: .*/, 'title: A revised title') + '\nAn unrelated body edit.\n'
    assert.deepEqual(publicationDate(parse(edited).date), { iso, label })
    assert.equal(raw, execFileSync('git', ['show', `955090ce553a5157d62354a486bfea94652a27c9:${path}`], { encoding: 'utf8' }))
  })
}
test('the audit covers every existing entry', () => {
  assert.deepEqual(readdirSync('content/Journal').filter(f => f.endsWith('.md')).sort(), Object.keys(expected).sort())
})
test('missing, invalid and rollover dates are explicitly unknown, never today', () => {
  for (const value of [undefined, null, '', 20260924, '2025-02-29', '2026-09-31', 'bad', '2026-09-24T01:00:00Z']) {
    assert.equal(publicationDate(value), null)
  }
  assert.equal(publicationDate('2024-02-29').label, 'February 29, 2024')
})
test('calendar labels do not drift with the viewer timezone', () => {
  for (const TZ of ['America/Chicago', 'America/Los_Angeles', 'Pacific/Kiritimati', 'UTC']) {
    const result = execFileSync(process.execPath, ['--input-type=module', '-e',
      "import { publicationDate } from './lib/publicationDate.mjs'; console.log(publicationDate('2026-09-24').label)"],
      { encoding: 'utf8', env: { ...process.env, TZ } })
    assert.equal(result.trim(), 'September 24, 2026')
  }
})
