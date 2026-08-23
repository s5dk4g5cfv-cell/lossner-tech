import YAML from 'yaml'

export type ContentMetadata = Record<string, unknown>

export type ContentRecord = {
  directory: string
  filename: string
  title: string
  order: number
  metadata: ContentMetadata
  body: string
}

export const PUBLIC_CONTENT_DIRECTORIES = new Set([
  'Experience',
  'Skills',
  'Projects',
  'Education',
  'Journal',
  'About',
])

const contentModules = import.meta.glob('../content/**/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>

function parseFrontmatter(source: string): { metadata: ContentMetadata; body: string } {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!match) {
    return { metadata: {}, body: source.trim() }
  }

  try {
    const parsed = YAML.parse(match[1])
    const metadata = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as ContentMetadata
      : {}
    return { metadata, body: match[2].trim() }
  } catch (error) {
    console.error('Failed to parse content frontmatter', error)
    return { metadata: {}, body: match[2].trim() }
  }
}

function deriveOrder(filename: string, metadataOrder: unknown): number {
  if (typeof metadataOrder === 'number') return metadataOrder
  const match = filename.match(/^(\d+)[-_]/)
  return match ? Number.parseInt(match[1], 10) : 999
}

function deriveTitle(filename: string, metadataTitle: unknown): string {
  if (typeof metadataTitle === 'string' && metadataTitle.trim()) {
    return metadataTitle.trim()
  }

  return filename
    .replace(/^\d+[_-]?/, '')
    .replace(/\.md$/i, '')
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const records: ContentRecord[] = Object.entries(contentModules).flatMap(([sourcePath, source]) => {
  const match = sourcePath.match(/^\.\.\/content\/([^/]+)\/([^/]+\.md)$/)
  if (!match) return []

  const [, directory, filename] = match
  const { metadata, body } = parseFrontmatter(source)
  const normalizedMetadata = { ...metadata }
  delete normalizedMetadata.title
  delete normalizedMetadata.order

  return [{
    directory,
    filename,
    title: deriveTitle(filename, metadata.title),
    order: deriveOrder(filename, metadata.order),
    metadata: normalizedMetadata,
    body,
  }]
})

export function listContentDirectories(publicOnly = false) {
  const directories = [...new Set(records.map(record => record.directory))]
    .filter(directory => !publicOnly || PUBLIC_CONTENT_DIRECTORIES.has(directory))
    .sort()

  return directories.map(name => ({ name, path: `content/${name}` }))
}

export function listContentRecords(directory: string, includeHidden = false) {
  return records
    .filter(record => record.directory === directory)
    .filter(record => includeHidden || record.metadata.hidden !== true)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
}

export function readContentRecord(directory: string, filename: string) {
  return records.find(record => record.directory === directory && record.filename === filename) ?? null
}
