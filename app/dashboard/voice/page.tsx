import { LiveVoiceAssistant } from '@/components/assistant/live-voice-assistant'

export default function VoicePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <LiveVoiceAssistant variant="page" />
    </div>
  )
}
