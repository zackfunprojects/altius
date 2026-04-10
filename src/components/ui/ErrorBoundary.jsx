import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-terminal-dark flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <h1 className="font-display text-2xl text-catalog-cream mb-4">
              Something went wrong
            </h1>
            <p className="font-body text-trail-brown mb-6">
              The trail hit an unexpected obstacle. Try reloading the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-signal-orange text-white font-ui font-semibold rounded-md hover:bg-signal-orange/90 transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
