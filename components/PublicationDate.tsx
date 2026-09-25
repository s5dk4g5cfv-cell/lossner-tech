import { publicationDate } from '../lib/publicationDate.mjs'

export default function PublicationDate({ value }: { value: unknown }) {
  const date = publicationDate(value)
  if (!date) return <span>Publication date unknown</span>
  return <span>Published <time dateTime={date.iso}>{date.label}</time></span>
}
