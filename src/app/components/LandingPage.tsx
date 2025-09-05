'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-yellow-400 to-red-700">
      {/* Header */}
      <header className="bg-red-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold">🍟</div>
              <h1 className="text-2xl font-bold">McDonald&apos;s</h1>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Current Time</div>
              <div className="text-lg font-mono">{currentTime}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-12">
        <div className="text-center text-white mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg">
            Burgernomics
          </h1>
          <p className="text-xl md:text-2xl mb-4 drop-shadow">
            Task Scheduler & Employee Management System
          </p>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Streamline your restaurant operations with smart employee scheduling, 
            drag-and-drop task assignments, and real-time synchronization across all devices.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-xl p-6 text-center transform hover:scale-105 transition-transform">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">Employee Management</h3>
            <p className="text-gray-600">
              Organize your crew with smart employee pools and availability tracking.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-6 text-center transform hover:scale-105 transition-transform">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">Drag & Drop Scheduling</h3>
            <p className="text-gray-600">
              Intuitive drag-and-drop interface for quick task assignments and station management.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-6 text-center transform hover:scale-105 transition-transform">
            <div className="text-4xl mb-4">🔄</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">Real-time Sync</h3>
            <p className="text-gray-600">
              All changes sync instantly across devices. Perfect for multi-station restaurants.
            </p>
          </div>
        </div>

        {/* Day Parts Section */}
        <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-white text-center mb-6">Multi-Day Part Support</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-orange-100 rounded-lg p-6 text-center">
              <div className="text-3xl mb-2">🌅</div>
              <h3 className="text-xl font-bold text-orange-800 mb-2">Breakfast Shift</h3>
              <p className="text-orange-700">
                Specialized stations for breakfast operations including hash browns, 
                breakfast assembly, and morning beverage service.
              </p>
            </div>
            <div className="bg-blue-100 rounded-lg p-6 text-center">
              <div className="text-3xl mb-2">🍔</div>
              <h3 className="text-xl font-bold text-blue-800 mb-2">Lunch/Dinner Shift</h3>
              <p className="text-blue-700">
                Full service operations with grill stations, fry stations, 
                delivery coordination, and extended menu support.
              </p>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="text-center">
          <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-8 inline-block">
            <h2 className="text-2xl font-bold text-white mb-6">Ready to Optimize Your Operations?</h2>
            <div className="space-y-4">
              <Link
                href="/scheduler"
                className="inline-block bg-yellow-400 hover:bg-yellow-500 text-red-800 font-bold py-4 px-8 rounded-lg text-xl transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🚀 Launch Task Scheduler
              </Link>
              <div className="flex justify-center space-x-4 mt-4">
                <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm">
                  ✅ Multi-Device Support
                </div>
                <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm">
                  ✅ Real-time Updates
                </div>
                <div className="bg-purple-500 text-white px-4 py-2 rounded-full text-sm">
                  ✅ CSV Import/Export
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-red-800 text-white text-center py-6 mt-12">
        <div className="container mx-auto px-6">
          <p className="text-sm opacity-90">
            McDonald&apos;s Task Scheduler - Optimizing Restaurant Operations
          </p>
          <p className="text-xs opacity-75 mt-2">
            Built with React, Next.js, and Socket.io for real-time collaboration
          </p>
        </div>
      </footer>
    </div>
  );
}
