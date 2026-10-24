import { generateText, Output } from 'ai'
import { z } from 'zod'
import { WIKI_HEADERS } from '@/lib/wikipedia'

const bodySchema = z.object({
  lang: z.enum(['es', 'en']),
  title: z.string().min(2).max(200),
})

const profileSchema = z.object({
  summary: z.string().describe('Resumen en español de 2 oraciones sobre el deportista'),
  age: z.string().describe('Edad actual en años si se puede deducir, o cadena vacía'),
  achievements: z.array(z.string()).describe('Logros deportivos principales, máximo 6'),
  recognitions: z.array(z.string()).describe('Premios y reconocimientos, máximo 5'),
  studies: z.string().describe('Estudios mencionados o cadena vacía'),
  timeline: z
    .array(z.object({ year: z.string(), text: z.string() }))
    .describe('Hitos de su trayectoria en orden cronológico, máximo 8'),
})

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  const { lang, title } = parsed.data

  try {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      formatversion: '2',
      prop: 'extracts',
      explaintext: '1',
      redirects: '1',
      titles: title,
    })
    const res = await fetch(`https://${lang}.wikipedia.org/w/api.php?${params}`, {
      headers: WIKI_HEADERS,
    })
    const data = (await res.json()) as { query?: { pages?: { extract?: string }[] } }
    const article = data.query?.pages?.[0]?.extract?.slice(0, 9000)
    if (!article) return Response.json({ error: 'Sin datos' }, { status: 404 })

    const { output } = await generateText({
      model: 'anthropic/claude-haiku-5.5',
      output: Output.object({ schema: profileSchema }),
      prompt: `Hoy es ${new Date().toISOString().slice(0, 10)}. Extraé un perfil deportivo en español usando SOLO la información de este artículo de Wikipedia. No inventes datos.\n\n${article}`,
    })
    return Response.json({ profile: output })
  } catch (error) {
    console.error('athlete-enrich failed', error)
    return Response.json({ error: 'No pudimos armar el perfil' }, { status: 502 })
  }
}
