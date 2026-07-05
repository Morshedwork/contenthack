import { VoiceManager } from '@/components/voice/voice-manager'

export default function VoicePage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-display tracking-tight mb-1">Voice Command Center</h1>
        <p className="text-muted-foreground text-sm">
          Speak to your AI manager — G-Brain executes every agent, G-Stack routes the models, CrustData
          grounds the analysis, and ElevenLabs delivers the briefing out loud
        </p>
      </div>
      <VoiceManager />
    </>
  )
}
