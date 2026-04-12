import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { conversationId } = await req.json()
  if (!conversationId) return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })

  const supabase = await createSupabaseAdminClient()

  // Get last 10 messages for context
  const { data: messages } = await supabase
    .from('messages')
    .select('direction, body, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (!messages?.length) {
    return NextResponse.json({ suggestions: [] })
  }

  // Get conversation context
  const { data: conv } = await supabase
    .from('conversations')
    .select('contact, channel, internal_note, contact_id, intent')
    .eq('id', conversationId)
    .single()

  let contactName: string | null = null
  if (conv?.contact_id) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('display_name, notes_internal')
      .eq('id', conv.contact_id)
      .single()
    contactName = contact?.display_name || null
  }

  // Build the conversation history for the prompt (oldest first)
  const conversation = messages.reverse().map(m =>
    `${m.direction === 'inbound' ? 'CLIENTE' : 'BOT/ANGEL'}: ${m.body || '(sin texto)'}`
  ).join('\n')

  const prompt = `Eres asistente de Angel Anderson, dueño de CaboRojo.com y *7711 (bot SMS/WhatsApp para vecinos de Cabo Rojo, PR).

CONTEXTO:
- Canal: ${conv?.channel || 'sms'}
- Cliente: ${contactName || 'Sin nombre'} (${conv?.contact || ''})
- Notas internas: ${conv?.internal_note || 'ninguna'}
- Último intent: ${conv?.intent || 'unknown'}

CONVERSACIÓN RECIENTE (último al final):
${conversation}

TAREA: Genera 3 respuestas cortas que Angel podría enviar manualmente al cliente AHORA. Cada respuesta debe ser:
- Máximo 200 caracteres
- En español boricua natural (no formal)
- Útil y específica al contexto
- Variada en tono: una directa/útil, una cálida/personal, una con call-to-action

Responde SOLO con un JSON array de 3 strings, sin markdown:
["respuesta 1", "respuesta 2", "respuesta 3"]`

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'ARRAY',
              items: { type: 'STRING' },
            },
          },
        }),
      }
    )

    if (!geminiRes.ok) {
      const err = await geminiRes.text()
      console.error('[suggest] Gemini API error:', err)
      return NextResponse.json({ error: 'Gemini API error', details: err }, { status: 500 })
    }

    const data = await geminiRes.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'

    let suggestions: string[] = []
    try {
      suggestions = JSON.parse(text)
    } catch (e) {
      console.error('[suggest] JSON parse failed:', e, 'text:', text.slice(0, 500))
    }

    return NextResponse.json({ suggestions: suggestions.slice(0, 3) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to generate suggestions' }, { status: 500 })
  }
}
