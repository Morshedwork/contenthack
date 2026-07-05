import { apiFromError } from '@/lib/api-utils'
import { fetchOpenRouterVideoContent, hasOpenRouter } from '@/lib/ai/openrouter'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    if (!hasOpenRouter()) {
      return apiFromError(new Error('OPENROUTER_API_KEY is not configured'), 'OpenRouter not configured')
    }

    const { jobId } = await params
    if (!jobId?.trim()) {
      return apiFromError(new Error('Job id is required'), 'Job id is required')
    }

    const { buffer, contentType } = await fetchOpenRouterVideoContent(jobId)
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err) {
    return apiFromError(err, 'Failed to fetch OpenRouter video')
  }
}
