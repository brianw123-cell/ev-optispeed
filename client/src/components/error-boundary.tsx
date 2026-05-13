import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crashed:", error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background" data-testid="app-error">
        <div className="max-w-md w-full bg-card border border-destructive/40 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h1 className="text-lg font-semibold text-foreground">Something went wrong</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            The app hit an unexpected error and couldn't continue. Try reloading the page. If
            this keeps happening, please report it.
          </p>
          {this.state.error?.message && (
            <pre className="text-xs bg-muted rounded p-2 mb-4 overflow-auto max-h-32 text-muted-foreground">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReload}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            data-testid="button-reload"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
