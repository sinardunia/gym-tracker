import { Component, type ErrorInfo, type ReactNode } from 'react'
import { I18nContext, type I18n } from '../i18n'
import { Button, Card, Screen } from './ui'

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
        <Screen>
          <Card>
            <h1>{tr('error.title')}</h1>
            <div className="flex gap-2 flex-wrap [&_button]:flex-1 [&_.file-button]:flex-1">
              <Button type="button" onClick={() => window.location.reload()}>
                {tr('error.reload')}
              </Button>
            </div>
          </Card>
        </Screen>
      )
    }
    return this.props.children
  }
}