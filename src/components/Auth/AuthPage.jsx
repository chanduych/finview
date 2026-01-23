import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

const AuthPage = ({ onSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col p-4 overflow-y-auto">
      <div className="w-full max-w-md mx-auto my-auto">
        {/* Logo/Branding */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
              Investment Tracker
            </h1>
          </div>
          <p className="text-sm md:text-base text-slate-600">
            Track your portfolio, analyze performance, and make informed decisions
          </p>
        </div>

        {/* Auth Forms */}
        {mode === 'login' ? (
          <LoginForm
            onToggleMode={() => setMode('signup')}
            onSuccess={onSuccess}
          />
        ) : (
          <SignupForm
            onToggleMode={() => setMode('login')}
            onSuccess={onSuccess}
          />
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-xs md:text-sm text-slate-500">
          <p>Secure authentication powered by Supabase</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
