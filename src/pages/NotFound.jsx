import { Link } from 'react-router-dom'
import { FiHome } from 'react-icons/fi'

const NotFound = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-9xl font-bold text-gray-200">404</h1>
      <h2 className="text-3xl font-bold text-gray-800 mt-8 mb-2">Page Not Found</h2>
      <p className="text-gray-600 max-w-md mb-8">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link to="/" className="btn btn-primary inline-flex items-center">
        <FiHome className="mr-2 h-5 w-5" />
        Back to Dashboard
      </Link>
    </div>
  )
}

export default NotFound