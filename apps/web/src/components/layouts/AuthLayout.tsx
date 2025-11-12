import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">XEM</h1>
          <p className="text-gray-600">
            eXecution & Expenditure Management System
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
