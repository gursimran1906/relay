export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Error
          </h1>
          <p className="text-gray-600 mb-6">
            Sorry, we couldn't complete your authentication. This could be due
            to:
          </p>
          <ul className="text-left text-gray-600 mb-6 space-y-2">
            <li>• An expired or invalid authentication link</li>
            <li>• A network connection issue</li>
            <li>• The authentication session has timed out</li>
          </ul>
          <div className="space-y-3">
            <a
              href="/auth/login"
              className="block w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-900 transition-colors"
            >
              Try Signing In Again
            </a>
            <a
              href="/auth/signup"
              className="block w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Create New Account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
