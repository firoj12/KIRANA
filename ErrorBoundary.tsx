import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[KiranaTrack] Uncaught error caught by ErrorBoundary:", error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="bg-card border-2 border-destructive/20 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground">Something went wrong</h2>
              <p className="text-xs text-muted-foreground mt-1">
                An unexpected application error occurred. Your database and local storage records remain safe.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-muted/40 rounded-xl border text-left overflow-x-auto text-[11px] font-mono text-destructive max-h-32">
                {this.state.error.message}
              </div>
            )}

            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
