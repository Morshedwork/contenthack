import { apiSuccess } from '@/lib/api-utils'
import { getConfiguredOAuthPlatforms } from '@/lib/integrations/oauth'

export async function GET() {
  return apiSuccess({
    configured: getConfiguredOAuthPlatforms(),
  })
}
