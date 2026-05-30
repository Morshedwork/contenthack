import { demoModels, demoModelRouting } from '@/lib/demo/data'
import type { AIModel, ModelRouting } from '@/types'
import { generateOutput } from '@/lib/ai/generate'
import { requireOpenAI } from '@/lib/ai/openai'

export function getModels(): AIModel[] {
  return demoModels.filter((m) => m.id !== 'mock')
}

export function getModelRouting(): ModelRouting[] {
  return demoModelRouting
}

export function getModelById(id: string): AIModel | undefined {
  return getModels().find((m) => m.id === id)
}

export function getModelPerformance() {
  return {
    avgResponseTime: '1.2s',
    estimatedCost: '$12.40',
    successRate: 97.2,
    contentQualityScore: 91,
    leadQualityScore: 86,
  }
}

export async function generateTaskOutput(taskType: string, input: string): Promise<string> {
  requireOpenAI()
  return generateOutput(taskType, input)
}

export function getRequiredEnvVars() {
  return ['OPENAI_API_KEY']
}
