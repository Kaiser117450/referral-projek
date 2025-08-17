export default function TestCSSPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-red-800 mb-8 text-center">
          🎨 CSS Test Page
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Test Card 1 */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Primary Colors
            </h2>
            <div className="space-y-2">
              <div className="h-8 bg-red-500 rounded"></div>
              <div className="h-8 bg-red-600 rounded"></div>
              <div className="h-8 bg-red-700 rounded"></div>
            </div>
          </div>

          {/* Test Card 2 */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Utility Classes
            </h2>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Padding: p-6</div>
              <div className="text-sm text-gray-600">Margin: mb-3</div>
              <div className="text-sm text-gray-600">Border: rounded-lg</div>
            </div>
          </div>

          {/* Test Card 3 */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Responsive Grid
            </h2>
            <div className="text-sm text-gray-600">
              This card should be responsive and show different layouts on different screen sizes.
            </div>
          </div>
        </div>

        {/* Test Button */}
        <div className="mt-8 text-center">
          <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200">
            🚀 Test Button with Hover Effects
          </button>
        </div>

        {/* Test Animation */}
        <div className="mt-8 text-center">
          <div className="inline-block animate-bounce bg-red-500 text-white p-4 rounded-full">
            🏀 Bouncing Ball
          </div>
        </div>
      </div>
    </div>
  );
}
