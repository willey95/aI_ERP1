export default function ReportsPage() {
  return (
    <div>
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="text-6xl mb-4">📈</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reports & Analytics</h2>
        <p className="text-gray-500 mb-6">
          This feature is coming soon. Here you'll be able to generate various reports including:
        </p>
        <div className="max-w-md mx-auto text-left">
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Project execution reports</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Budget variance analysis</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Cash flow projections</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Financial performance metrics</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Risk assessment dashboards</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Export to Excel/PDF</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
