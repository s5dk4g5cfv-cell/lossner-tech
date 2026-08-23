/**
 * Kept temporarily so existing callers receive an explicit deprecation response.
 * The previous UI never exposed speech controls, and the old response contract
 * did not match the client. Remove this route only in a separately approved
 * breaking-change release.
 */
export function POST() {
  return Response.json(
    { error: 'Speech synthesis is not available in the Sites edition.' },
    { status: 410 },
  )
}
