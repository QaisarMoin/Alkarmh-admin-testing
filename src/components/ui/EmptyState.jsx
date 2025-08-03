import { Link } from 'react-router-dom'

const EmptyState = ({ 
  title = 'No data available', 
  description = 'Get started by creating your first item.',
  icon,
  actionLink,
  actionText = 'Create new',
}) => {
  return (
    <div className="text-center py-12 px-4">
      {icon && (
        <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-500 max-w-md mx-auto mb-4">{description}</p>
      
      {actionLink && (
        <Link
          to={actionLink}
          className="btn btn-primary inline-flex items-center"
        >
          {actionText}
        </Link>
      )}
    </div>
  )
}

export default EmptyState