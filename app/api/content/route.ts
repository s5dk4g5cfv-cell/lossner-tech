import {
  PUBLIC_CONTENT_DIRECTORIES,
  listContentDirectories,
  listContentRecords,
  readContentRecord,
} from '../../../lib/content'

const DIRECTORY_PATTERN = /^[A-Za-z0-9_-]+$/
const FILE_PATTERN = /^[A-Za-z0-9._-]+$/

function sanitizeSegment(value: string | null, type: 'directory' | 'file'): string | null {
  if (!value) return null
  const pattern = type === 'directory' ? DIRECTORY_PATTERN : FILE_PATTERN
  if (!pattern.test(value)) {
    throw new Error(`Invalid ${type} segment`)
  }
  return value
}

export function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const directory = sanitizeSegment(searchParams.get('directory'), 'directory')
    const file = sanitizeSegment(searchParams.get('file'), 'file')

    if (directory && !PUBLIC_CONTENT_DIRECTORIES.has(directory)) {
      return Response.json({ error: 'Content directory not found' }, { status: 404 })
    }

    if (directory && file) {
      const record = readContentRecord(directory, file)
      if (!record || record.metadata.hidden === true) {
        return Response.json({ error: 'Content file not found' }, { status: 404 })
      }
      return Response.json({
        title: record.title,
        content: record.body,
        metadata: record.metadata,
        filename: record.filename,
      })
    }

    if (directory) {
      const files = listContentRecords(directory).map(record => ({
        directory: record.directory,
        title: record.title,
        order: record.order,
        metadata: record.metadata,
        name: record.filename,
        downloadUrl: null,
      }))
      return Response.json({ files })
    }

    return Response.json({ directories: listContentDirectories(true) })
  } catch (error: unknown) {
    console.error('Content API error:', error)
    return Response.json(
      {
        error: 'Failed to load content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
