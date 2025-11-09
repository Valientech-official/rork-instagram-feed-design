import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AlertTriangle, Home, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  reset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  toggleDetails = () => {
    this.setState(prev => ({
      showDetails: !prev.showDetails,
    }));
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <ErrorScreen
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.reset}
          showDetails={this.state.showDetails}
          onToggleDetails={this.toggleDetails}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorScreenProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
  showDetails: boolean;
  onToggleDetails: () => void;
  theme?: 'light' | 'dark';
}

function ErrorScreen({
  error,
  errorInfo,
  onReset,
  showDetails,
  onToggleDetails,
  theme = 'light',
}: ErrorScreenProps) {
  const colors = Colors[theme];
  const styles = createStyles(colors);

  const getUserFriendlyMessage = (error: Error): string => {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('network')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    if (errorMessage.includes('timeout')) {
      return 'The request took too long. Please try again.';
    }
    if (errorMessage.includes('permission')) {
      return 'Permission denied. Please check app settings.';
    }
    if (errorMessage.includes('not found')) {
      return 'The requested resource was not found.';
    }

    return 'An unexpected error occurred. Please try again.';
  };

  const isDevelopment = __DEV__;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Error icon */}
        <View style={styles.iconContainer}>
          <AlertTriangle size={80} color={colors.error} strokeWidth={1.5} />
        </View>

        {/* Error title */}
        <Text style={styles.title}>Something went wrong</Text>

        {/* User-friendly message */}
        <Text style={styles.message}>
          {getUserFriendlyMessage(error)}
        </Text>

        {/* Error details (dev mode only or expandable) */}
        {isDevelopment && (
          <>
            <TouchableOpacity
              style={styles.detailsToggle}
              onPress={onToggleDetails}
            >
              <Text style={styles.detailsToggleText}>
                {showDetails ? 'Hide' : 'Show'} Error Details
              </Text>
              {showDetails ? (
                <ChevronUp size={20} color={colors.primary} />
              ) : (
                <ChevronDown size={20} color={colors.primary} />
              )}
            </TouchableOpacity>

            {showDetails && (
              <ScrollView style={styles.detailsContainer}>
                <View style={styles.detailsContent}>
                  <Text style={styles.detailsTitle}>Error Name:</Text>
                  <Text style={styles.detailsText}>{error.name}</Text>

                  <Text style={[styles.detailsTitle, styles.detailsSpacing]}>
                    Error Message:
                  </Text>
                  <Text style={styles.detailsText}>{error.message}</Text>

                  {error.stack && (
                    <>
                      <Text style={[styles.detailsTitle, styles.detailsSpacing]}>
                        Stack Trace:
                      </Text>
                      <Text style={styles.detailsText}>{error.stack}</Text>
                    </>
                  )}

                  {errorInfo?.componentStack && (
                    <>
                      <Text style={[styles.detailsTitle, styles.detailsSpacing]}>
                        Component Stack:
                      </Text>
                      <Text style={styles.detailsText}>
                        {errorInfo.componentStack}
                      </Text>
                    </>
                  )}
                </View>
              </ScrollView>
            )}
          </>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={onReset}>
            <RefreshCw size={20} color={colors.background} />
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              onReset();
            }}
          >
            <Home size={20} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  detailsToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  detailsContainer: {
    maxHeight: 200,
    width: '100%',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  detailsContent: {
    padding: 16,
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  detailsSpacing: {
    marginTop: 12,
  },
  detailsText: {
    fontSize: 11,
    color: colors.secondaryText,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
