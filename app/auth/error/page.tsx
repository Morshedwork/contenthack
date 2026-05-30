import Link from 'next/link'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="relative min-h-screen flex flex-col bg-background">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-destructive/5 rounded-full blur-3xl" />
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
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>
          </div>
          
          <h1 className="text-3xl font-display tracking-tight text-foreground mb-3">
            Authentication Error
          </h1>
          <p className="text-muted-foreground mb-6">
            We encountered an issue while processing your request.
          </p>

          {params?.error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-destructive font-mono">
                {params.error}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button 
              asChild
              className="bg-foreground text-background hover:bg-foreground/90 rounded-full"
            >
              <Link href="/auth/login">
                Try signing in again
              </Link>
            </Button>
            <Button 
              asChild
              variant="outline"
              className="rounded-full"
            >
              <Link href="/auth/sign-up">
                Create a new account
              </Link>
            </Button>
          </div>
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
