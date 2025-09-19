import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
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

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI assistant is not configured.' }, { status: 503 })
  }

  const projectId = process.env.OPENAI_PROJECT_ID
  const openai = new OpenAI({
    apiKey,
    ...(projectId ? { project: projectId } : {})
  })

  try {
    const resumeContext = await loadResumeContext()

    const systemPrompt = `You are "Alex" — Joshua Lossner's AI career advisor and systems mentor. You are speaking with someone who wants to understand Joshua's work and perspective. Maintain a calm, pragmatic tone with grounded DevOps wisdom. Use the provided context to answer with specifics when helpful.

Context about Joshua:
${resumeContext}

Guidelines:
- Keep replies under 220 words unless a deeper dive is explicitly requested.
- Prefer practical steps, patterns, and trade-offs over hype.
- Cite Joshua's real experiences when relevant; do not fabricate credentials.
- Assume the person you are speaking with is not Joshua. Answer from Joshua's perspective only when explicitly asked to adopt first person.
- If you don't know something, say so and suggest how to find out.
- Invite follow-up questions only when it furthers clarity.`

    const priorTurns: HistoryTurn[] = Array.isArray(history)
      ? history.filter((turn: any): turn is HistoryTurn =>
          turn && (turn.role === 'user' || turn.role === 'assistant') && typeof turn.content === 'string'
        )
      : []

    const input = [
      {
        role: 'system' as const,
        content: [
          {
            type: 'input_text' as const,
            text: systemPrompt
          }
        ]
      },
      ...priorTurns.map(turn => ({
        role: turn.role,
        content: [
          {
            type: turn.role === 'assistant' ? ('output_text' as const) : ('input_text' as const),
            text: turn.content
          }
        ]
      })),
      {
        role: 'user' as const,
        content: [
          {
            type: 'input_text' as const,
            text: message
          }
        ]
      }
    ]

    const stream = await openai.responses.stream({
      model: 'gpt-4.1-mini',
      input: input as any,
      temperature: 0.6,
      top_p: 0.9
    })

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'response.output_text.delta') {
              controller.enqueue(encoder.encode(event.delta))
            } else if (event.type === 'response.output_text.done') {
              break
            } else if (event.type === 'response.completed') {
              break
            }
          }
        } catch (error: any) {
          controller.enqueue(encoder.encode(`\n[Alex encountered an error: ${error?.message ?? error}]\n`))
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
    console.error('OpenAI streaming error', error)
    return NextResponse.json({ error: 'Alex is offline right now. Try again shortly.' }, { status: 500 })
  }
}
