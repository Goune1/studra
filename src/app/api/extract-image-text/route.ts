import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { aiRateLimitResponse, checkAiRateLimit } from '@/lib/ai-rate-limit'

export const maxDuration = 30

const openai = new OpenAI()

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const SORRY_RE = /\b(i cannot|i am unable|unable to|no text visible|i'm unable|cannot extract|i can't|i don't see any text)\b/i

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimit = await checkAiRateLimit(user.id, 'extract-image')
  if (!rateLimit.allowed) {
    return NextResponse.json(aiRateLimitResponse(rateLimit.reason), { status: 429 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const image = formData.get('image') as Blob | null
  if (!image) return NextResponse.json({ error: 'Missing image field' }, { status: 400 })

  if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
    return NextResponse.json({ error: 'Unsupported image type' }, { status: 415 })
  }

  if (image.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image too large (max 5 MB)' }, { status: 413 })
  }

  const buffer = Buffer.from(await image.arrayBuffer())
  const base64 = buffer.toString('base64')

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        {
          role: 'system',
          content:
            'You are an OCR assistant. Extract all the text from this course image faithfully and structure it clearly. Preserve titles, subtitles, bullet points, formulas and lists. Return only the extracted text, no commentary.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${image.type};base64,${base64}`, detail: 'high' },
            },
          ],
        },
      ],
      max_tokens: 2048,
    })

    const text = (response.choices[0]?.message?.content ?? '').trim()

    if (text.length < 30 || SORRY_RE.test(text)) {
      return NextResponse.json({ error: 'EXTRACTION_FAILED' }, { status: 422 })
    }

    return NextResponse.json({ text })
  } catch {
    return NextResponse.json({ error: 'EXTRACTION_FAILED' }, { status: 500 })
  }
}
