import { useState } from 'react'
import { FiSearch, FiFilter, FiX } from 'react-icons/fi'

const SearchFilter = ({ 
  onSearch, 
  placeholder = 'Search...',
  filters = [],  // Array of filter options
  onFilterChange,
  showFilterButton = true,
  onClear // <-- new prop
}) => {
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState({})
  
  const handleSearch = (e) => {
    e.preventDefault()
    onSearch(query, selectedFilters)
  }
  
  const handleFilterChange = (filterName, value) => {
    const updatedFilters = {
      ...selectedFilters,
      [filterName]: value
    }
    
    // If value is empty, remove the filter
    if (!value) {
      delete updatedFilters[filterName]
    }
    
    setSelectedFilters(updatedFilters)
    
    // Call parent handler if provided
    if (onFilterChange) {
      onFilterChange(updatedFilters)
    }
  }
  
  const clearFilters = () => {
    setSelectedFilters({})
    if (onFilterChange) {
      onFilterChange({})
    }
    if (onClear) {
      onClear();
    }
  }
  
  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  const handleRemoveFilter = (filterName) => {
    const updatedFilters = { ...selectedFilters };
    delete updatedFilters[filterName];
    setSelectedFilters(updatedFilters);
    if (onFilterChange) onFilterChange(updatedFilters);
    if (onSearch) onSearch(query, updatedFilters); // Refresh table
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="flex items-center">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="form-input pl-10 pr-4 py-2 w-full"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary ml-2"
        >
          Search
        </button>
        
        {showFilterButton && (
          <button 
            type="button"
            onClick={toggleFilters}
            className="ml-2 btn btn-secondary flex items-center"
          >
            Filters
          </button>
        )}
      </form>
      
      {/* Filters Panel */}
      {showFilters && filters.length > 0 && (
        <div className="bg-white p-4 rounded-md shadow-subtle mb-4 animate-fade-in">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-700">Filters</h3>
            
            <div className="flex items-center">
              {Object.keys(selectedFilters).length > 0 && (
                <button 
                  type="button" 
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 mr-2"
                >
                  Clear all
                </button>
              )}
              
              <button 
                onClick={toggleFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <div key={filter.name} className="form-group mb-0">
                <label htmlFor={filter.name} className="form-label">
                  {filter.label}
                </label>
                
                {filter.type === 'select' ? (
                  <select
                    id={filter.name}
                    className="form-input"
                    value={selectedFilters[filter.name] || ''}
                    onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                  >
                    <option value="">All</option>
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : filter.type === 'date' ? (
                  <input
                    type="date"
                    id={filter.name}
                    className="form-input"
                    value={selectedFilters[filter.name] || ''}
                    onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    id={filter.name}
                    className="form-input"
                    value={selectedFilters[filter.name] || ''}
                    onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                    placeholder={filter.placeholder || ''}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                onSearch(query, selectedFilters)
                setShowFilters(false)
              }}
              className="btn btn-primary"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
      
      {/* Render active filter capsules */}
      {Object.entries(selectedFilters).length > 0 && (
        <div className="mt-2 flex items-center flex-wrap">
          <span className="text-sm mr-2">Active filters:</span>
          {Object.entries(selectedFilters).map(([key, value]) => (
            <span key={key} className="bg-gray-100 rounded-full px-3 py-1 text-sm flex items-center mr-2 mb-2">
              {(() => {
                const filterDef = filters.find(f => f.name === key);
                let displayValue = value;
            if (filterDef?.type === 'select') {
                  const option = filterDef.options.find(o => o.value === value);
                  if (option) displayValue = option.label;
            }
                return `${filterDef?.label || key}: ${displayValue}`;
              })()}
                <button
                type="button"
                className="ml-2 text-gray-500 hover:text-gray-700"
                onClick={() => handleRemoveFilter(key)}
              >
                ×
                </button>
              </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchFilter