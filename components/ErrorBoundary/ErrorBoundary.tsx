import { Colors } from "@/constants/Colors";
import { errorHandler } from "@/utils/errorHandling";
import React, { Component, ErrorInfo, ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

/**
 * Comprehensive Error Boundary component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error
    errorHandler.handle(error, "ErrorBoundary");

    // Store error info for debugging
    this.setState({ errorInfo });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to crash analytics in production
    if (!__DEV__) {
      // TODO: Add crash analytics logging
      console.error("Error Boundary caught an error:", error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: Props): void {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error state if resetKeys have changed
    if (hasError && resetKeys && prevProps.resetKeys !== resetKeys) {
      if (resetKeys.some((key, idx) => prevProps.resetKeys?.[idx] !== key)) {
        this.resetErrorBoundary();
      }
    }

    // Reset error state if any props changed and resetOnPropsChange is true
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  retryWithDelay = (): void => {
    // Reset after a short delay to prevent immediate re-error
    this.resetTimeoutId = setTimeout(() => {
      this.resetErrorBoundary();
    }, 1000);
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Custom fallback if provided
      if (fallback) {
        return fallback(error, errorInfo!);
      }

      // Default error UI
      return (
        <View style={styles.errorContainer}>
          <View style={styles.errorContent}>
            <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
            <Text style={styles.errorMessage}>
              {__DEV__ ? error.message : "An unexpected error occurred"}
            </Text>

            {__DEV__ && (
              <View style={styles.debugSection}>
                <Text style={styles.debugTitle}>Debug Information:</Text>
                <Text style={styles.debugText}>{error.stack}</Text>
                {errorInfo && (
                  <Text style={styles.debugText}>
                    Component Stack: {errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={this.resetErrorBoundary}
              >
                <Text style={styles.buttonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.delayedRetryButton}
                onPress={this.retryWithDelay}
              >
                <Text style={styles.buttonText}>Retry in 1s</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundPrimary,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorContent: {
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: 12,
    padding: 24,
    maxWidth: 400,
    width: "100%",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.dark.danger,
    textAlign: "center",
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: Colors.dark.secondary,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  debugSection: {
    backgroundColor: Colors.dark.backgroundPrimary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.primary,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: Colors.dark.secondary,
    fontFamily: "monospace",
    lineHeight: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  retryButton: {
    flex: 1,
    backgroundColor: Colors.dark.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  delayedRetryButton: {
    flex: 1,
    backgroundColor: Colors.dark.secondary,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  buttonText: {
    color: Colors.dark.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}

/**
 * Hook to trigger error boundary from within a component
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const throwError = React.useCallback((error: Error | string) => {
    const errorObj = typeof error === "string" ? new Error(error) : error;
    setError(errorObj);
  }, []);

  if (error) {
    throw error;
  }

  return throwError;
}

export default ErrorBoundary;
