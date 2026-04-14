import { useNavigate } from 'react-router-dom'
import FourColorBar from '../components/brand/FourColorBar'
import WordMark from '../components/brand/WordMark'

export default function NotFoundView() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-catalog-cream flex flex-col">
      <FourColorBar />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <WordMark size="lg" />
          <h1 className="font-display text-4xl text-ink mt-8 mb-4">404</h1>
          <p className="font-body text-trail-brown text-lg mb-6">
            This trail does not exist. The mountain has many paths, but this is not one of them.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-summit-cobalt text-white font-ui font-semibold rounded-md hover:bg-summit-cobalt/90 transition-colors"
          >
            Return to Base Camp
          </button>
        </div>
      </div>
    </div>
  )
}
