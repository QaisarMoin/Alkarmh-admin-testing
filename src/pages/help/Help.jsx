import { useState } from 'react'
import { FiChevronDown, FiChevronRight, FiBook, FiHelpCircle, FiMessageCircle } from 'react-icons/fi'
import PageHeader from '../../components/ui/PageHeader'

const Help = () => {
  const [expandedSection, setExpandedSection] = useState(null)
  
  const faqs = [
    {
      category: 'Getting Started',
      icon: <FiBook className="h-5 w-5" />,
      questions: [
        {
          q: 'How do I add a new product?',
          a: 'To add a new product, go to the Products section and click the "Add Product" button. Fill in the required information including product name, description, price, and inventory details.'
        },
        {
          q: 'How do I process orders?',
          a: 'Navigate to the Orders section to view all orders. Click on an order to view details. You can update the order status, add tracking information, and manage fulfillment from there.'
        },
        {
          q: 'How do I manage inventory?',
          a: 'Inventory can be managed through the Products section. Each product has stock levels that you can update. You can also set low stock alerts in the Settings.'
        }
      ]
    },
    {
      category: 'Orders & Shipping',
      icon: <FiMessageCircle className="h-5 w-5" />,
      questions: [
        {
          q: 'How do I fulfill an order?',
          a: 'To fulfill an order, go to the order details page and click "Process". Update the status to "Shipped" once the item has been sent, and add tracking information if available.'
        },
        {
          q: 'Can I customize shipping methods?',
          a: 'Yes, you can customize shipping methods in the Settings section. You can add different shipping options, set prices, and specify delivery estimates.'
        },
        {
          q: 'How do I handle returns?',
          a: 'For returns, locate the order in question and create a return request. You can then process refunds and update inventory accordingly.'
        }
      ]
    },
    {
      category: 'Account & Settings',
      icon: <FiHelpCircle className="h-5 w-5" />,
      questions: [
        {
          q: 'How do I update store information?',
          a: 'Go to the Settings section to update your store information, including store name, contact details, and business address.'
        },
        {
          q: 'How do I manage user permissions?',
          a: 'User permissions can be managed in the Settings under the "Users & Permissions" section. You can add new users and assign different roles and access levels.'
        },
        {
          q: 'How do I set up notifications?',
          a: 'In Settings, navigate to the "Notifications" section. Here you can configure email notifications for orders, inventory alerts, and other important events.'
        }
      ]
    }
  ]

  return (
    <div>
      <PageHeader 
        title="Help Center"
        subtitle="Find answers to common questions and learn how to use the platform"
        breadcrumbs={[
          { text: 'Dashboard', link: '/' },
          { text: 'Help' }
        ]}
      />
      
      {/* Search */}
      <div className="card mb-6">
        <div className="max-w-2xl mx-auto">
          <label htmlFor="help-search" className="sr-only">Search help articles</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiHelpCircle className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="help-search"
              className="form-input pl-10"
              placeholder="Search for help articles..."
            />
          </div>
        </div>
      </div>
      
      {/* FAQ Sections */}
      <div className="space-y-6">
        {faqs.map((section, sectionIndex) => (
          <div key={section.category} className="card">
            <button
              className="w-full flex items-center justify-between text-left"
              onClick={() => setExpandedSection(expandedSection === sectionIndex ? null : sectionIndex)}
            >
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
                  {section.icon}
                </div>
                <h2 className="text-lg font-medium text-gray-900 ml-3">
                  {section.category}
                </h2>
              </div>
              {expandedSection === sectionIndex ? (
                <FiChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <FiChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            {expandedSection === sectionIndex && (
              <div className="mt-4 space-y-4">
                {section.questions.map((item, index) => (
                  <div key={index} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                    <h3 className="text-base font-medium text-gray-900 mb-2">
                      {item.q}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Contact Support */}
      <div className="mt-8 bg-primary-50 rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-primary-900 mb-2">
          Need more help?
        </h2>
        <p className="text-primary-600 mb-4">
          Our support team is available 24/7 to assist you with any questions.
        </p>
        <button className="btn btn-primary">
          Contact Support
        </button>
      </div>
    </div>
  )
}

export default Help