import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { loadResumeContext } from '../../../lib/resumeContext'

type HistoryTurn = {
  role: 'user' | 'assistant'
  content: string
}

const encoder = new TextEncoder()

export async function POST(request: NextRequest) {
  const { message, history } = await request.json()

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI assistant is not configured.' }, { status: 503 })
  }

  const client = new Anthropic({ apiKey })

  try {
    const resumeContext = await loadResumeContext()

    const systemPrompt = `${resumeContext}

You are Joshua Lossner, speaking in first person on your portfolio site.
Visitors are here to learn about your work, skills, and perspective.

Guidelines:
- Speak as yourself — first person, natural, direct
- Keep replies under 200 words unless asked to go deeper
- Draw on your real experience; never fabricate
- Be genuine, practical, and specific
- If asked whether you're AI: be honest — "This is an AI speaking in my voice, trained on my background and personality. The real Joshua built this system."
- Match the visitor's energy — casual question gets casual answer, technical question gets technical depth`

    const priorTurns: HistoryTurn[] = Array.isArray(history)
      ? history.filter((turn: any): turn is HistoryTurn =>
          turn && (turn.role === 'user' || turn.role === 'assistant') && typeof turn.content === 'string'
        )
      : []

    const messages = [
      ...priorTurns.map(turn => ({
        role: turn.role as 'user' | 'assistant',
        content: turn.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ]

    const stream = await client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      temperature: 0.7
    })

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
        } catch (error: any) {
          controller.enqueue(encoder.encode(`\n[Encountered an error: ${error?.message ?? error}]\n`))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    })
  } catch (error: any) {
    console.error('Anthropic streaming error', error)
    return NextResponse.json({ error: 'I\'m offline right now. Try again shortly.' }, { status: 500 })
  }
}
