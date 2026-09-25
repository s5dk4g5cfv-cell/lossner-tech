// Operational read only: resolves the public alias through Vercel, not local Git.
// Run with VERCEL_TOKEN supplied, or the existing CORA Vercel environment file.
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
if (!process.env.VERCEL_TOKEN) {
  const envFile = join(homedir(), '.cora', 'vercel.env')
  if (existsSync(envFile)) process.loadEnvFile(envFile)
}
assert(process.env.VERCEL_TOKEN, 'VERCEL_TOKEN is required for provider identity; no login or credential changes performed')
const response = await fetch('https://api.vercel.com/v13/deployments/lossner.tech?teamId=team_BNrbt2KJSiG4Iv35VYuQ9KEy', {
  headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` },
})
assert.equal(response.status, 200, `Vercel identity HTTP ${response.status}`)
const deployment = await response.json()
assert.equal(deployment.projectId, 'prj_3VTCbSluz3tkRHdmnXXzIsRTxkpc')
assert.equal(deployment.readyState, 'READY')
assert.equal(deployment.target, 'production')
assert(deployment.alias?.includes('lossner.tech'), 'Deployment must serve the public alias')
const sha = deployment.meta?.githubCommitSha
assert.match(sha ?? '', /^[a-f0-9]{40}$/, 'Provider must report a GitHub source revision')
console.error(`Vercel ${deployment.id}: READY production, alias lossner.tech, source ${sha}`)
console.log(sha)
