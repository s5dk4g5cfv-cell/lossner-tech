import { listContentRecords, type ContentMetadata } from './content'

type ResumeEntry = {
  title: string
  metadata: ContentMetadata
  body: string
}

async function readDirectoryEntries(directory: string) {
  return listContentRecords(directory).map(entry => ({
    name: entry.filename,
    title: entry.title,
    metadata: entry.metadata,
    body: entry.body,
  }))
}

function metadataText(metadata: ContentMetadata, key: string) {
  const value = metadata[key]
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

function summarizeBody(body: string, maxLength = 400) {
  if (!body) return ''
  const paragraphs = body.split(/\n{2,}/).map(block => block.replace(/\s+/g, ' ').trim()).filter(Boolean)
  const summary = paragraphs[0] ?? ''
  if (summary.length <= maxLength) return summary
  return summary.slice(0, maxLength).trimEnd() + '…'
}

function formatExperience(items: ResumeEntry[]) {
  if (!items.length) return ''
  return items
    .map(item => {
      const title = item.title || 'Role'
      const companyName = metadataText(item.metadata, 'company')
      const company = companyName ? ` at ${companyName}` : ''
      const start = metadataText(item.metadata, 'start') || '????-??'
      const end = metadataText(item.metadata, 'end') || '????-??'
      const summary = summarizeBody(item.body, 260)
      return `- ${title}${company} (${start} – ${end})\n  ${summary}`
    })
    .join('\n')
}

function formatProjects(items: ResumeEntry[]) {
  if (!items.length) return ''
  return items
    .map(item => {
      const title = item.title || 'Project'
      const roleValue = metadataText(item.metadata, 'role')
      const timelineValue = metadataText(item.metadata, 'timeline')
      const statusValue = metadataText(item.metadata, 'status')
      const role = roleValue ? ` — ${roleValue}` : ''
      const timeline = timelineValue ? ` (${timelineValue})` : ''
      const status = statusValue === 'in-progress' ? ' [IN PROGRESS]' : statusValue === 'completed' ? ' [COMPLETED]' : ''
      const summary = summarizeBody(item.body, 240)
      return `- ${title}${role}${timeline}${status}\n  ${summary}`
    })
    .join('\n')
}

function formatEducation(items: ResumeEntry[]) {
  if (!items.length) return ''
  return items
    .map(item => {
      const title = item.title || metadataText(item.metadata, 'degree') || 'Education'
      const schoolName = metadataText(item.metadata, 'school')
      const school = schoolName ? ` at ${schoolName}` : ''
      const start = metadataText(item.metadata, 'start') || '????-??'
      const end = metadataText(item.metadata, 'end') || '????-??'
      const summary = summarizeBody(item.body, 220)
      return `- ${title}${school} (${start} – ${end})\n  ${summary}`
    })
    .join('\n')
}

function formatSkills(items: ResumeEntry[]) {
  if (!items.length) return ''
  return items
    .map(item => {
      const title = item.title || 'Skill'
      const summary = summarizeBody(item.body, 200)
      return `- ${title}: ${summary}`
    })
    .join('\n')
}

function formatJournal(items: ResumeEntry[]) {
  if (!items.length) return ''
  return items
    .map(item => {
      const title = item.title || 'Entry'
      const dateValue = metadataText(item.metadata, 'date')
      const date = dateValue ? ` (${dateValue})` : ''
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
