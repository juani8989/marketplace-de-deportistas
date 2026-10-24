import { generateText, Output } from 'ai'
import { z } from 'zod'
import { isWikimediaUrl, WIKI_HEADERS } from '@/lib/wikipedia'

const DATA_URL_PREFIX = 'data:image/jpeg;base64,'

const bodySchema = z.object({
  selfie: z
    .string()
    .startsWith(DATA_URL_PREFIX)
    .max(3_000_000),
  referenceUrl: z.string().refine(isWikimediaUrl),
})

const resultSchema = z.object({
  faceDetected: z.boolean().describe('La selfie muestra claramente un rostro humano'),
  samePerson: z.boolean().describe('Ambas fotos muestran a la misma persona'),
  confidence: z.number().min(0).max(100),
  reason: z.string().describe('Explicación breve en español para el usuario'),
})

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  const { selfie, referenceUrl } = parsed.data

  try {
    const refRes = await fetch(referenceUrl, { headers: WIKI_HEADERS })
    if (!refRes.ok) throw new Error(`reference image ${refRes.status}`)
    const reference = new Uint8Array(await refRes.arrayBuffer())

    const { output } = await generateText({
      model: 'anthropic/claude-sonnet-5.5',
      output: Output.object({ schema: resultSchema }),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Verificación de identidad para una app de deportistas. La imagen 1 es una foto pública del deportista. La imagen 2 es una selfie tomada ahora por quien dice ser esa persona. Compará rasgos faciales estables (forma del rostro, ojos, nariz, cejas, orejas) teniendo en cuenta diferencias de edad, luz, peinado y barba. Sé conservador: si hay dudas, samePerson es false. Si la selfie es una foto de una pantalla o de una imagen impresa, samePerson es false.',
            },
            { type: 'file', mediaType: 'image', data: reference },
            { type: 'file', mediaType: 'image', data: selfie.slice(DATA_URL_PREFIX.length) },
          ],
        },
      ],
    })

    const verified = output.faceDetected && output.samePerson && output.confidence >= 60
    return Response.json({ verified, confidence: output.confidence, reason: output.reason })
  } catch (error) {
    console.error('verify-selfie failed', error)
    return Response.json({ error: 'No pudimos verificar la selfie ahora.' }, { status: 502 })
  }
}
