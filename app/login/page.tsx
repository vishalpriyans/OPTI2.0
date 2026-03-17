"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-400 to-emerald-400 p-8 text-center">
            <div className="mb-4 flex justify-center">
              <Image 
                src="/optiqueue-logo.png" 
                alt="OptiQueue Logo" 
                width={80} 
                height={80}
                className="rounded-lg"
              />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              OptiQueue
            </h1>
            <p className="text-blue-100 text-sm">
              Efficiency that Saves Lives
            </p>
          </div>

          {/* Login Options */}
          <div className="p-6 space-y-4">
            <p className="text-gray-600 text-center text-sm mb-6">
              Choose your portal to access the system
            </p>

            {/* Admin Login Button */}
            <button
              onClick={() => router.push("/admin-login")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 transition-colors duration-200 flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold">Admin Portal</div>
                  <div className="text-blue-100 text-xs">System Administration</div>
                </div>
              </div>
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Doctor Login Button */}
            <button
              onClick={() => router.push("/doctor-login")}
              className="w-full bg-rose-400 hover:bg-rose-500 text-white rounded-xl p-4 transition-colors duration-200 flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-rose-300 p-2 rounded-lg">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold">Doctor Portal</div>
                  <div className="text-rose-100 text-xs">Patient Management</div>
                </div>
              </div>
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 text-center">
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>System Online</span>
              </div>
              <div className="w-px h-3 bg-gray-300"></div>
              <span>© 2025 OptiQueue</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

