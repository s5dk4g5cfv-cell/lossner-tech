import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import YAML from 'yaml'

const CONTENT_ROOT = path.join(process.cwd(), 'content')
const DIRECTORY_PATTERN = /^[A-Za-z0-9_-]+$/
const FILE_PATTERN = /^[A-Za-z0-9._-]+$/

function sanitizeSegment(value: string | null, type: 'directory' | 'file'): string | null {
  if (!value) return null
  const decoded = decodeURIComponent(value)
  const pattern = type === 'directory' ? DIRECTORY_PATTERN : FILE_PATTERN
  if (!pattern.test(decoded)) {
    throw new Error(`Invalid ${type} segment: ${decoded}`)
  }
  return decoded
}

function parseFrontmatter(content: string) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!match) {
    return {
      metadata: {},
      body: content.trim()
    }
  }

  let metadata: Record<string, any> = {}
  try {
    metadata = YAML.parse(match[1]) ?? {}
  } catch (error) {
    console.error('Failed to parse frontmatter', error)
  }

  return {
    metadata,
    body: match[2].trim()
  }
}

function deriveOrder(filename: string, metadataOrder?: unknown): number {
  if (typeof metadataOrder === 'number') {
    return metadataOrder
  }
  const match = filename.match(/^(\d+)[-_]/)
  if (match) {
    return parseInt(match[1], 10)
  }
  return 999
}

function deriveTitle(filename: string, metadataTitle?: unknown): string {
  if (typeof metadataTitle === 'string' && metadataTitle.trim().length > 0) {
    return metadataTitle.trim()
  }
  return filename
    .replace(/^\d+[_-]?/, '')
    .replace(/\.md$/i, '')
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

async function ensureContentRoot() {
  try {
    const stats = await fs.stat(CONTENT_ROOT)
    if (!stats.isDirectory()) {
      throw new Error('Content root exists but is not a directory')
    }
  } catch (error) {
    throw new Error('Content directory not found. Add content/ to the project root.')
  }
}

async function listDirectories() {
  const entries = await fs.readdir(CONTENT_ROOT, { withFileTypes: true })
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => ({
      name: entry.name,
      path: path.join('content', entry.name)
    }))
}

async function listDirectoryFiles(directory: string) {
  const directoryPath = path.join(CONTENT_ROOT, directory)
  const entries = await fs.readdir(directoryPath, { withFileTypes: true })
  const files = await Promise.all(
    entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
      .map(async entry => {
        const fullPath = path.join(directoryPath, entry.name)
        const fileContent = await fs.readFile(fullPath, 'utf8')
        const { metadata, body } = parseFrontmatter(fileContent)
        const derivedTitle = deriveTitle(entry.name, metadata.title)
        const order = deriveOrder(entry.name, metadata.order)
        const resultMetadata = { ...metadata }
        delete resultMetadata.title
        delete resultMetadata.order

        return {
          name: entry.name,
          title: derivedTitle,
          order,
          metadata: resultMetadata,
          downloadUrl: null,
          content: body
        }
      })
  )

  return files
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order
      return a.title.localeCompare(b.title)
    })
    .map(({ content, ...rest }) => rest)
}

async function readFileContent(directory: string, filename: string) {
  const filePath = path.join(CONTENT_ROOT, directory, filename)
  const content = await fs.readFile(filePath, 'utf8')
  const { metadata, body } = parseFrontmatter(content)
  const resultMetadata = { ...metadata }
  delete resultMetadata.title
  delete resultMetadata.order

  return {
    title: deriveTitle(filename, metadata.title),
    content: body,
    metadata: resultMetadata,
    filename
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureContentRoot()

    const { searchParams } = new URL(request.url)
    const directory = sanitizeSegment(searchParams.get('directory'), 'directory')
    const file = sanitizeSegment(searchParams.get('file'), 'file')

    if (directory && file) {
      const payload = await readFileContent(directory, file)
      return NextResponse.json(payload)
    }

    if (directory) {
      const files = await listDirectoryFiles(directory)
      return NextResponse.json({ files })
    }

    const directories = await listDirectories()
    return NextResponse.json({ directories })
  } catch (error: any) {
    console.error('Content API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to load content',
        details: error?.message ?? 'Unknown error'
      },
      { status: 500 }
    )
  }
}
