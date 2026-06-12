import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary-400 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-white">B</span>
            </div>
            <span className="text-3xl font-bold text-white">
              Bijak<span className="text-primary-300">Beli</span>
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Smart Grocery<br />Price Comparison
          </h1>
          <p className="text-lg text-gray-300 max-w-md">
            Compare prices across AEON Big, BP Mall, and Square One Mall in Batu Pahat. 
            Save money on every grocery trip.
          </p>
          <div className="flex gap-6 mt-12">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">3</p>
              <p className="text-sm text-gray-400">Stores</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">500+</p>
              <p className="text-sm text-gray-400">Products</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">30%</p>
              <p className="text-sm text-gray-400">Avg Savings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-slate-900">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
