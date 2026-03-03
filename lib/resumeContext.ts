import { promises as fs } from 'fs'
import path from 'path'
import YAML from 'yaml'

type FrontmatterResult = {
  metadata: Record<string, any>
  body: string
}

const CONTENT_ROOT = path.join(process.cwd(), 'content')

function parseFrontmatter(source: string): FrontmatterResult {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!match) {
    return { metadata: {}, body: source.trim() }
  }

  let metadata: Record<string, any> = {}
  try {
    metadata = YAML.parse(match[1]) ?? {}
  } catch (error) {
    console.error('Failed to parse frontmatter in resume context loader', error)
  }

  return {
    metadata,
    body: match[2].trim()
  }
}

async function readDirectoryEntries(directory: string) {
  const dirPath = path.join(CONTENT_ROOT, directory)
  const entries = await fs.readdir(dirPath, { withFileTypes: true })
  const files = entries.filter(entry => entry.isFile() && entry.name.endsWith('.md'))
  return Promise.all(files.map(async entry => {
    const fullPath = path.join(dirPath, entry.name)
    const content = await fs.readFile(fullPath, 'utf8')
    const parsed = parseFrontmatter(content)
    return {
      name: entry.name,
      metadata: parsed.metadata,
      body: parsed.body
    }
  }))
}

function summarizeBody(body: string, maxLength = 400) {
  if (!body) return ''
  const paragraphs = body.split(/\n{2,}/).map(block => block.replace(/\s+/g, ' ').trim()).filter(Boolean)
  const summary = paragraphs[0] ?? ''
  if (summary.length <= maxLength) return summary
  return summary.slice(0, maxLength).trimEnd() + '…'
}

function formatExperience(items: Array<{ metadata: Record<string, any>; body: string }>) {
  if (!items.length) return ''
  return items
    .map(item => {
      const title = item.metadata.title ?? 'Role'
      const company = item.metadata.company ? ` at ${item.metadata.company}` : ''
      const start = item.metadata.start ?? '????-??'
      const end = item.metadata.end ?? '????-??'
      const summary = summarizeBody(item.body, 260)
      return `- ${title}${company} (${start} – ${end})\n  ${summary}`
    })
    .join('\n')
}

function formatProjects(items: Array<{ metadata: Record<string, any>; body: string }>) {
  if (!items.length) return ''
  return items
    .map(item => {
      const title = item.metadata.title ?? 'Project'
      const role = item.metadata.role ? ` — ${item.metadata.role}` : ''
      const timeline = item.metadata.timeline ? ` (${item.metadata.timeline})` : ''
      const status = item.metadata.status === 'in-progress' ? ' [IN PROGRESS]' : item.metadata.status === 'completed' ? ' [COMPLETED]' : ''
      const summary = summarizeBody(item.body, 240)
      return `- ${title}${role}${timeline}${status}\n  ${summary}`
    })
    .join('\n')
}

function formatEducation(items: Array<{ metadata: Record<string, any>; body: string }>) {
  if (!items.length) return ''
  return items
    .map(item => {
      const title = item.metadata.title ?? item.metadata.degree ?? 'Education'
      const school = item.metadata.school ? ` at ${item.metadata.school}` : ''
      const start = item.metadata.start ?? '????-??'
      const end = item.metadata.end ?? '????-??'
      const summary = summarizeBody(item.body, 220)
      return `- ${title}${school} (${start} – ${end})\n  ${summary}`
    })
    .join('\n')
}

function formatSkills(items: Array<{ metadata: Record<string, any>; body: string }>) {
  if (!items.length) return ''
  return items
    .map(item => {
      const title = item.metadata.title ?? 'Skill'
      const summary = summarizeBody(item.body, 200)
      return `- ${title}: ${summary}`
    })
    .join('\n')
}

function formatJournal(items: Array<{ metadata: Record<string, any>; body: string }>) {
  if (!items.length) return ''
  return items
    .map(item => {
      const title = item.metadata.title ?? 'Entry'
      const date = item.metadata.date ? ` (${item.metadata.date})` : ''
      const summary = summarizeBody(item.body, 220)
      return `- ${title}${date}\n  ${summary}`
    })
    .join('\n')
}

let cachedContext: { value: string; expires: number } | null = null
const CACHE_TTL_MS = 1000 * 60 * 5

export async function loadResumeContext(): Promise<string> {
  const now = Date.now()
  if (cachedContext && cachedContext.expires > now) {
    return cachedContext.value
  }

  try {
    const voice = await readDirectoryEntries('Voice')
    const about = await readDirectoryEntries('About')
    const experience = await readDirectoryEntries('Experience')
    const education = await readDirectoryEntries('Education')
    const projects = await readDirectoryEntries('Projects')
    const skills = await readDirectoryEntries('Skills')
    const journal = await readDirectoryEntries('Journal')

    const voiceContent = voice.map(entry => entry.body).filter(Boolean).join('\n\n')
    const aboutSummary = about.map(entry => summarizeBody(entry.body, 600)).join('\n\n')
    const experienceSummary = formatExperience(experience)
    const educationSummary = formatEducation(education)
    const projectSummary = formatProjects(projects)
    const skillsSummary = formatSkills(skills)
    const journalSummary = formatJournal(journal.slice(0, 3))

    const compiled = [
      voiceContent ? `Voice & Personality:\n${voiceContent}` : null,
      aboutSummary ? `About Joshua:\n${aboutSummary}` : null,
      experienceSummary ? `Experience Highlights:\n${experienceSummary}` : null,
      educationSummary ? `Education:\n${educationSummary}` : null,
      projectSummary ? `Notable Projects:\n${projectSummary}` : null,
      skillsSummary ? `Core Skills & Focus Areas:\n${skillsSummary}` : null,
      journalSummary ? `Recent Journal Entries:\n${journalSummary}` : null
    ]
      .filter(Boolean)
      .join('\n\n')

    const finalContext = compiled || 'Joshua Lossner is an enterprise DevOps and automation leader focused on coherent systems.'

    cachedContext = {
      value: finalContext,
      expires: now + CACHE_TTL_MS
    }

    return finalContext
  } catch (error) {
    console.error('Failed to load resume context', error)
    return 'Joshua Lossner is an enterprise DevOps and automation leader focused on coherent systems.'
  }
}
