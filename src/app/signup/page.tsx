'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios'; 
import { User, Mail, Lock, ArrowRight, Phone } from 'lucide-react';

export default function SignUp() {
  const navigate = useRouter();

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-august-pen-gay.onrender.com/api/v1';

  // --- Initial Form Submit ---
  const handleSignUpClick = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name')?.toString() || '',
      telephone: formData.get('telephone')?.toString() || '',
      email: formData.get('email')?.toString() || '',
      password: formData.get('password')?.toString() || '',
    };

    // basic validation
    if (!/^[0-9]{9,10}$/.test(data.telephone)) {
      setError('เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลักเท่านั้น');
      return;
    }
    if (data.password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    // Save data and show modal
    setPendingFormData(data);
    setShowPrivacyModal(true);
  };

  // --- Final Registration API Call ---
  const completeRegistration = async () => {
    setShowPrivacyModal(false);
    setIsLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/register`, {
        ...pendingFormData,
        role: 'user' 
      }, {
        withCredentials: true
      });

      const token = res.data.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('userRole', 'user');
      }

      navigate.push('/dashboard');

    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.response?.data?.message || err.response?.data?.msg || 'ไม่สามารถสมัครสมาชิกได้ อีเมลนี้อาจมีผู้ใช้งานแล้ว');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex relative">
      
      {/* --- 1. Privacy Modal --- */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-sm shadow-xl max-w-2xl w-full overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
            
            {/* Modal Header */}
            <div className="bg-[#b14a4a] text-white p-6 text-center">
              <h2 className="text-2xl font-serif tracking-tight">Privacy Policy</h2>
            </div>

            {/* Modal Content - Scrollable if needed */}
            <div className="p-8 space-y-6 text-gray-800 leading-relaxed max-h-[70vh] overflow-y-auto">
              <p>
                Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Fusce
                dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut
                fermentum massa justo sit amet risus. Donec id elit non mi porta gravida at eget
                metus. Sed posuere consectetur est at lobortis. Donec id elit non mi porta gravida
                at eget metus.
              </p>
              <p>
                Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut
                fermentum massa justo sit amet risus. Donec sed odio dui. Integer posuere erat a
                ante venenatis dapibus posuere velit aliquet. Cum sociis natoque penatibus et
                magnis dis parturient montes, nascetur ridiculus mus. Praesent commodo cursus
                magna, vel scelerisque nisl consectetur et. Donec id elit non mi porta gravida at
                eget metus.
              </p>
              <p>
                Donec ullamcorper nulla non metus auctor fringilla. Integer posuere erat a ante
                venenatis dapibus posuere velit aliquet. Praesent commodo cursus magna, vel
                scelerisque nisl consectetur et. Donec id elit non mi porta gravida at eget metus.
                Cras justo odio, dapibus ac facilisis in, egestas eget quam. Vivamus sagittis lacus
                vel augue laoreet rutrum faucibus dolor auctor. Etiam porta sem malesuada
                magna mollis euismod.
              </p>
              <p>
                Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut
                fermentum massa justo sit amet risus. Duis mollis, est non commodo luctus, nisi
                erat porttitor ligula, eget lacinia odio sem nec elit. Nullam quis risus eget urna
                mollis ornare vel eu leo.
              </p>
            </div>

            {/* Modal Footer (Buttons) */}
            <div className="bg-gray-50 px-8 py-6 flex justify-end gap-4 border-t border-gray-100">
              <button
                onClick={() => setShowPrivacyModal(false)} // Just closes, stays on signup page
                className="bg-[#1a1a1a] text-white px-8 py-3 text-sm font-semibold tracking-wider hover:bg-black transition rounded-sm uppercase"
              >
                I Disagree
              </button>
              <button
                onClick={completeRegistration} // Calls API and redirects
                className="bg-[#1a1a1a] text-white px-8 py-3 text-sm font-semibold tracking-wider hover:bg-black transition rounded-sm uppercase"
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Original Signup Page Layout --- */}
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900">
        <img 
          src="https://picsum.photos/seed/signup/1000/1200" 
          alt="Workspace" 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <h2 className="text-4xl font-bold mb-4">Join our community of innovators.</h2>
          <p className="text-lg text-gray-300 max-w-md">
            Get access to premium workspaces, networking events, and a global community of professionals.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background-light dark:bg-background-dark">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Create your account</h2>
            <p className="mt-2 text-sm text-text-muted-light dark:text-text-muted-dark">
              Start your 7-day free trial today. No credit card required.
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          {/* Form action calls the interceptor function */}
          <form className="mt-8 space-y-6" onSubmit={handleSignUpClick}>
            <div className="space-y-4">
              {/* --- Full Name --- */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-text-muted-light dark:text-text-muted-dark" />
                  </div>
                  <input id="name" name="name" type="text" required placeholder="Jane Doe" className="..." />
                </div>
              </div>

              {/* --- Telephone --- */}
              <div>
                <label htmlFor="telephone" className="block text-sm font-medium mb-1">Telephone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-text-muted-light dark:text-text-muted-dark" />
                  </div>
                  <input id="telephone" name="telephone" type="tel" required placeholder="0812345678" className="..." />
                </div>
              </div>

              {/* --- Email --- */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-text-muted-light dark:text-text-muted-dark" />
                  </div>
                  <input id="email" name="email" type="email" required placeholder="jane@example.com" className="..." />
                </div>
              </div>
              
              {/* --- Password --- */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-text-muted-light dark:text-text-muted-dark" />
                  </div>
                  <input id="password" name="password" type="password" required placeholder="••••••••" className="..." />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white transition-colors ${
                  isLoading ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover'
                }`}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
                {!isLoading && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-text-muted-light dark:text-text-muted-dark">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:text-primary-hover">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}