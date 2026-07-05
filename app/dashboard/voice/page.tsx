import { LiveVoiceAssistant } from '@/components/assistant/live-voice-assistant'

export default function VoicePage() {
  return (
    <div className="flex justify-center px-2 py-2 sm:px-4 sm:py-4">
      <LiveVoiceAssistant variant="page" className="w-full max-w-6xl" />
    </div>
  )
}
