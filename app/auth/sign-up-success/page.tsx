import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SignUpSuccessPage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-background">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-foreground/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-foreground/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-6">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl font-display tracking-tight text-foreground">COMPUTE</span>
          <span className="text-[10px] font-mono text-muted-foreground mt-0.5">TM</span>
        </Link>
        <Link 
          href="/" 
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 bg-foreground/10 rounded-full flex items-center justify-center">
                <Mail className="w-10 h-10 text-foreground" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-background" />
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-display tracking-tight text-foreground mb-3">
            Check your inbox
          </h1>
          <p className="text-muted-foreground mb-8">
            We&apos;ve sent a confirmation link to your email address. Click the link to activate your account and start deploying agents.
          </p>

          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3 text-left">
              <div className="w-2 h-2 bg-foreground rounded-full mt-2 shrink-0" />
              <p className="text-sm text-muted-foreground">
                If you don&apos;t see the email, check your spam folder or request a new confirmation link.
              </p>
            </div>
          </div>

          <Button 
            asChild
            variant="outline"
            className="rounded-full"
          >
            <Link href="/auth/login">
              Return to sign in
            </Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 lg:px-12 py-6">
        <p className="text-center text-xs text-muted-foreground">
          Need help? Contact support@compute.ai
        </p>
      </footer>
    </div>
  )
}
