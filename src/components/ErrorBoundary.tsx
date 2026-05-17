import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4"
          dir="rtl"
        >
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">حدث خطأ غير متوقع</h1>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error?.message || "يرجى المحاولة مرة أخرى"}</p>
            <div className="p-4 bg-white rounded-xl border border-red-200 shadow-sm mb-4">
              <p className="text-xs text-muted-foreground/60 text-left break-all font-mono" dir="ltr">
                {this.state.error?.stack?.slice(0, 300) || "—"}
              </p>
            </div>
            <Button
              onClick={() => {
                this.handleReset();
                window.location.reload();
              }}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة تحميل الصفحة
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
