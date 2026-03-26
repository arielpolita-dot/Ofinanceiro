import { Component, type ErrorInfo, type ReactNode } from 'react'
import i18next from 'i18next'
import { Button, Text } from '../design-system'
import { logger } from '../utils/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('[ErrorBoundary] Uncaught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <Text variant="h3" align="center">{i18next.t('errorBoundary.title')}</Text>
            <Text variant="body" color="muted" align="center">
              {i18next.t('errorBoundary.description')}
            </Text>
            <div className="error-boundary-action">
              <Button variant="primary" onClick={() => window.location.reload()}>
                {i18next.t('errorBoundary.reloadButton')}
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
