import { Component, type ErrorInfo, type ReactNode } from 'react'
import { I18nContext, type I18n } from '../i18n'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  static contextType = I18nContext
  declare context: I18n

  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      const { tr } = this.context
      return (
        <main className="screen">
          <div className="card">
            <h1>{tr('error.title')}</h1>
            <div className="backup-actions">
              <button
                type="button"
                className="primary"
                onClick={() => window.location.reload()}
              >
                {tr('error.reload')}
              </button>
            </div>
          </div>
        </main>
      )
    }
    return this.props.children
  }
}