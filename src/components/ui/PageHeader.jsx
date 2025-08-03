import { Link } from 'react-router-dom'
import { FiChevronRight } from 'react-icons/fi'

const PageHeader = ({ title, subtitle, breadcrumbs = [], actionButton }) => {
  return (
    <div className="mb-6">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="mb-2">
          <ol className="flex text-sm text-gray-500">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && <FiChevronRight className="mx-2 h-4 w-4 text-gray-400" />}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-gray-700">{crumb.text}</span>
                ) : (
                  <Link 
                    to={crumb.link} 
                    className="text-gray-500 hover:text-primary-600 hover:underline"
                  >
                    {crumb.text}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        
        {actionButton && (
          <div className="mt-4 sm:mt-0">
            {actionButton}
          </div>
        )}
      </div>
    </div>
  )
}

export default PageHeader