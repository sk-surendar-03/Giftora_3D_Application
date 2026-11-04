import { useState } from 'react'
import SalesReportTab from './SalesReportTab.jsx'
import OrdersReportTab from './OrdersReportTab.jsx'
import ProductsReportTab from './ProductsReportTab.jsx'
import CustomersReportTab from './CustomersReportTab.jsx'

const TABS = [
  { id: 'sales', label: 'Sales', Component: SalesReportTab },
  { id: 'orders', label: 'Orders', Component: OrdersReportTab },
  { id: 'products', label: 'Products', Component: ProductsReportTab },
  { id: 'customers', label: 'Customers', Component: CustomersReportTab },
]

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales')
  const Active = TABS.find((t) => t.id === activeTab).Component

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Reports</h1>

      <div className="mt-6 flex gap-2 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              activeTab === tab.id ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <Active />
      </div>
    </div>
  )
}
