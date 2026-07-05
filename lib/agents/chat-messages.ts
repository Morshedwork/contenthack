export type ChatMode = 'basic' | 'agent'

const BASIC_CHAT_WELCOME =
  "Hi! I'm in **Basic Chat** mode — ask me anything about content marketing, copywriting, or strategy. I won't run agents here; switch to **Agent Mode** when you want to execute your pipeline."

const AGENT_CHAT_WELCOME =
  "I'm your **autonomous ContentOps agent** — tell me the outcome you want and I'll plan, run the right agents, and show you live progress.\n\nTry: **\"Research Japan SMEs and draft LinkedIn posts\"** · **\"Launch the full campaign pipeline\"** · **\"Find leads and draft outreach\"**"

export function getChatWelcomeMessage(mode: ChatMode): string {
  return mode === 'basic' ? BASIC_CHAT_WELCOME : AGENT_CHAT_WELCOME
}

export const BASIC_SUGGESTED_PROMPTS = [
  'Brainstorm 5 LinkedIn post ideas for my campaign',
  'What makes a strong hook for a 30-second video?',
  'Help me rewrite a caption to sound more professional',
  'How should I structure a weekly content calendar?',
  'Give feedback on messaging for a free AI audit offer',
  'Explain the difference between TOFU and BOFU content',
] as const

export const AGENT_SUGGESTED_PROMPTS = [
  'Run market research focused on Japan SME automation',
  'Generate LinkedIn posts about our free AI audit offer',
  'Find qualified leads and draft personalized outreach',
  'Run the full content workflow end to end',
  'What is the status of all agents?',
  'Create video scripts for a 60-second explainer reel',
] as const
