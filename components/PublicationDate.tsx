import { publicationDate } from '../lib/publicationDate.mjs'

export default function PublicationDate({ value, original = false }: { value: unknown; original?: boolean }) {
  const date = publicationDate(value)
  if (!date) return <span>Publication date unknown</span>
  return <span>{original ? 'Originally published' : 'Published'} <time dateTime={date.iso}>{date.label}</time></span>
}
