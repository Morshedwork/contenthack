import { apiError, apiFromError, apiSuccess } from '@/lib/api-utils'
import { extractBrandThemeFromUrl, isValidCompanyUrl } from '@/lib/ai/brand-theme'
import { hasOpenAI } from '@/lib/ai/openai'
import { getWorkspace, patchWorkspace } from '@/lib/workspace/store'
import type { BrandProfile } from '@/types'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const url = String(body.url || '').trim()
    if (!url) return apiError('url is required', 400)
    if (!isValidCompanyUrl(url)) return apiError('Invalid company URL', 400)

    const ws = await getWorkspace()
    const theme = await extractBrandThemeFromUrl(url)

    const collection = [theme, ...(ws.brandProfile.themeCollection ?? [])].slice(0, 20)
    const brandProfile: BrandProfile = {
      ...ws.brandProfile,
      themeCollection: collection,
      activeThemeId: theme.id,
      brandName: ws.brandProfile.brandName || theme.companyName,
    }

    await patchWorkspace({ brandProfile })

    return apiSuccess({ theme, brandProfile, collection, live: hasOpenAI() })
  } catch (err) {
    return apiFromError(err, 'Brand theme extraction failed')
  }
}
