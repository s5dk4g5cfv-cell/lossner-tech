import assert from 'node:assert/strict'
import test from 'node:test'

const workerUrl = new URL('../dist/server/index.js', import.meta.url)
workerUrl.searchParams.set('test', `${process.pid}-${Date.now()}`)
const { default: worker } = await import(workerUrl.href)

const env = {
  ASSETS: {
    fetch: async () => new Response('Not found', { status: 404 }),
  },
}

const ctx = {
  waitUntil() {},
  passThroughOnException() {},
}

function request(path, init) {
  return worker.fetch(new Request(`https://preview.lossner.test${path}`, init), env, ctx)
}

test('renders the lossner.tech terminal with honest AI labeling and social metadata', async () => {
  const response = await request('/', {
    headers: {
      host: 'preview.lossner.test',
      'x-forwarded-host': 'preview.lossner.test',
      'x-forwarded-proto': 'https',
    },
  })
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type') ?? '', /^text\/html\b/i)

  const html = await response.text()
  assert.match(html, /<title>Joshua Lossner \/\/ Personal Data System<\/title>/i)
  assert.match(html, /PERSONAL DATA SYSTEM/)
  assert.match(html, /AI REPRESENTATION/)
  assert.match(html, /https:\/\/preview\.lossner\.test\/og\.png/)
  assert.doesNotMatch(html, /codex-preview/i)
})

test('serves the complete public content inventory', async () => {
  const expectedCounts = {
    Experience: 7,
    Skills: 7,
    Projects: 10,
    Education: 4,
    Journal: 2,
    About: 1,
  }

  for (const [directory, expectedCount] of Object.entries(expectedCounts)) {
    const response = await request(`/api/content?directory=${directory}`)
    assert.equal(response.status, 200, directory)
    const payload = await response.json()
    assert.equal(payload.files.length, expectedCount, directory)
  }
})

test('keeps prompt-only and hidden records out of the public content API', async () => {
  const voiceResponse = await request('/api/content?directory=Voice')
  assert.equal(voiceResponse.status, 404)

  const hiddenProject = await request('/api/content?directory=Projects&file=11_coherenceism-blog.md')
  assert.equal(hiddenProject.status, 404)
})

test('bounds public AI requests before provider access', async () => {
  const malformedRequest = await request('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{not-json',
  })
  assert.equal(malformedRequest.status, 400)

  const missingConfiguration = await request('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: 'Tell me about Joshua.' }),
  })
  assert.equal(missingConfiguration.status, 503)

  const oversizedRequest = await request('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: 'x'.repeat(2_001) }),
  })
  assert.equal(oversizedRequest.status, 413)
})

test('streams the public assistant through the OpenAI Responses API', async () => {
  const originalFetch = globalThis.fetch
  const originalApiKey = process.env.OPENAI_API_KEY
  const originalModel = process.env.OPENAI_MODEL
  let requestBody

  process.env.OPENAI_API_KEY = 'test-openai-key'
  process.env.OPENAI_MODEL = 'gpt-5.6-luna'
  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url

    assert.equal(url, 'https://api.openai.com/v1/responses')
    requestBody = JSON.parse(String(init?.body))

    return new Response(
      'event: response.output_text.delta\ndata: {"type":"response.output_text.delta","delta":"Hello from OpenAI.","item_id":"item_1","output_index":0,"content_index":0,"logprobs":[],"sequence_number":1}\n\n',
      {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      },
    )
  }

  try {
    const response = await request('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Tell me about Joshua.' }),
    })

    assert.equal(response.status, 200)
    assert.equal(await response.text(), 'Hello from OpenAI.')
    assert.equal(requestBody.model, 'gpt-5.6-luna')
    assert.equal(requestBody.stream, true)
    assert.equal(requestBody.store, false)
    assert.match(requestBody.instructions, /AI representation of Joshua/)
  } finally {
    globalThis.fetch = originalFetch

    if (originalApiKey === undefined) {
      delete process.env.OPENAI_API_KEY
    } else {
      process.env.OPENAI_API_KEY = originalApiKey
    }

    if (originalModel === undefined) {
      delete process.env.OPENAI_MODEL
    } else {
      process.env.OPENAI_MODEL = originalModel
    }
  }
})

test('returns an explicit deprecation response for the former speech endpoint', async () => {
  const response = await request('/api/speech', { method: 'POST' })
  assert.equal(response.status, 410)
  assert.deepEqual(await response.json(), {
    error: 'Speech synthesis is not available in the Sites edition.',
  })
})
