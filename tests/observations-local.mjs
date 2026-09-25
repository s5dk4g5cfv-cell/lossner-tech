import { spawn } from 'node:child_process'
import { once } from 'node:events'
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '0'], { stdio: ['ignore', 'pipe', 'pipe'] })
let output = ''
const stopped = once(server, 'exit')
try {
  const base = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Server startup timeout: ${output}`)), 30000)
    server.stdout.on('data', chunk => {
      output += chunk
      const url = output.match(/http:\/\/127\.0\.0\.1:(\d+)/)
      if (url && output.includes('Ready')) { clearTimeout(timeout); resolve(url[0]) }
    })
    server.stderr.on('data', chunk => { output += chunk })
    server.once('exit', code => { clearTimeout(timeout); reject(new Error(`Server exited ${code}: ${output}`)) })
  })
  console.log(`Local production server: ${base}`)
  const test = spawn(process.execPath, ['tests/observations-browser.mjs', '--base-url', base], { stdio: 'inherit' })
  const [code] = await once(test, 'exit')
  process.exitCode = code ?? 1
} finally {
  server.kill('SIGTERM')
  await stopped
}
