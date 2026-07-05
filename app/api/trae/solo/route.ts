import { apiError, apiFromError, apiSuccess } from '@/lib/api-utils'
import { mergeCrustdataSignals } from '@/lib/ai/crustdata'
import { generateContentDrafts } from '@/lib/ai/generate'
import { withAI } from '@/lib/ai/layer'
import { runTraeSoloTopicGeneration, TRAE_SOLO_CAPABILITIES, validateTopicBrief } from '@/lib/trae/solo'
import { MODEL_TASK, resolveTaskModel } from '@/lib/models/routing'
import { resolveApiWorkspaceContext } from '@/lib/workspace/api-context'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'
import type { GeneratedTopic, Platform } from '@/types'

type TraeSoloAction = 'capabilities' | 'generate_topics' | 'generate_content'

interface TraeSoloRequest {
  action: TraeSoloAction
  brief?: Parameters<typeof validateTopicBrief>[0]
  topic?: GeneratedTopic
  platform?: string
}

export async function GET() {
  return apiSuccess(TRAE_SOLO_CAPABILITIES)
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TraeSoloRequest
    const action = body.action || 'generate_topics'
    const ctx = await resolveApiWorkspaceContext(request)
    const ws = await getWorkspace(ctx)

    switch (action) {
      case 'capabilities':
        return apiSuccess(TRAE_SOLO_CAPABILITIES)

      case 'generate_topics': {
        if (!body.brief) return apiError('brief is required for generate_topics', 400)
        validateTopicBrief(body.brief)
        const modelConfig = resolveTaskModel(MODEL_TASK.CONTENT_GENERATION, ws.modelRouting)
        const dataSignals = mergeCrustdataSignals({}, ws.brandProfile, ws.research, ws.campaign)
        const result = await runTraeSoloTopicGeneration({
          ...body.brief,
          modelConfig,
          research: ws.research,
          signals: dataSignals,
        })
        await patchWorkspace(
          {
            topics: result.topics,
            campaign: {
              ...ws.campaign,
              platforms: body.brief.platforms?.length ? body.brief.platforms : ws.campaign.platforms,
            },
          },
          ctx,
        )
        return apiSuccess(result)
      }

      case 'generate_content': {
        const topic = body.topic
        const platform: Platform =
          body.platform === 'linkedin' ||
          body.platform === 'instagram' ||
          body.platform === 'facebook' ||
          body.platform === 'x' ||
          body.platform === 'tiktok' ||
          body.platform === 'youtube' ||
          body.platform === 'email' ||
          body.platform === 'carousel'
            ? body.platform
            : 'linkedin'
        if (!topic?.title) return apiError('topic with title is required for generate_content', 400)

        const contentModelConfig = resolveTaskModel(MODEL_TASK.CONTENT_GENERATION, ws.modelRouting)
        const { result: drafts, live } = await withAI(() =>
          generateContentDrafts({
            platform,
            topic: topic.title,
            campaignId: ws.campaign.id,
            brandProfile: ws.brandProfile,
            research: ws.research,
            signals: mergeCrustdataSignals({ topic: topic.title }, ws.brandProfile, ws.research, ws.campaign),
            modelConfig: contentModelConfig,
          }),
        )

        if (drafts.length) {
          await patchWorkspace({ contentDrafts: [...drafts, ...ws.contentDrafts] }, ctx)
        }

        return apiSuccess({
          agent: 'trae-solo',
          task: 'content_generation',
          status: 'completed',
          topic,
          platform,
          draft: drafts[0] ?? null,
          drafts,
          live,
        })
      }

      default:
        return apiError(`Unknown action: ${action}`, 400)
    }
  } catch (err) {
    return apiFromError(err, 'TRAE Solo request failed')
  }
}
