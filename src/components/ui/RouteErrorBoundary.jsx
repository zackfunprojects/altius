import { Component } from 'react'

/**
 * Per-route error boundary. Catches errors within a single route
 * without crashing the entire app.
 */
export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-catalog-cream flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <h2 className="font-display text-2xl text-ink mb-4">
              Trail obstruction
            </h2>
            <p className="font-body text-trail-brown mb-6">
              Something went wrong on this page. Try going back or reloading.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { this.setState({ hasError: false }); window.history.back() }}
                className="px-5 py-2 border border-trail-brown/30 text-trail-brown font-ui text-sm rounded-md hover:bg-trail-brown/5 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2 bg-signal-orange text-white font-ui text-sm font-semibold rounded-md hover:bg-signal-orange/90 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
