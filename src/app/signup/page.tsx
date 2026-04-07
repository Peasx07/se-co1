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
  const [pendingFormData, setPendingFormData] = useState<any>(null);

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
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm">
          {/* Container หลัก: เพิ่มขอบสีส้มและมุมโค้งมน */}
          <div className="bg-white border-[12px] md:border-[3px] border-[#f97316] rounded-[32px] shadow-2xl max-w-2xl w-full flex flex-col transform transition-all duration-300 scale-100 max-h-[90vh]">

            {/* Modal Header: พื้นหลังสีขาว ตัวอักษรสีดำ ตัวหนา */}
            <div className="bg-white p-6 text-center border-b border-gray-100 rounded-t-[20px]">
              <h2 className="text-2xl md:text-3xl font-bold text-black tracking-tight">Privacy Policy</h2>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-6 md:p-8 space-y-6 text-gray-700 leading-relaxed overflow-y-auto">
              <p>
                Welcome to our platform. Your privacy is critically important to us. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your information when you create an
                account or visit our website. When you register, we may collect personal identifiable
                information such as your full name, email address, and telephone number to establish and
                manage your account.
              </p>
              <p>
                We use the information we collect in various ways, including to provide, operate, and
                maintain our services. Furthermore, your data helps us to understand and analyze how you
                use our platform, allowing us to improve, personalize, and expand our offerings. We may
                also use your information to communicate with you for customer service, updates, and
                security alerts.
              </p>
              <p>
                We are committed to protecting your personal data. We implement a variety of industry-standard
                security measures to maintain the safety of your personal information. However, please be
                aware that no method of transmission over the internet or method of electronic storage is
                100% secure. While we strive to use commercially acceptable means to protect your personal
                data, we cannot guarantee its absolute security.
              </p>
              <p>
                We do not sell, trade, or otherwise transfer your personally identifiable information to
                outside parties without your consent, except to trusted third parties who assist us in
                operating our website or conducting our business, so long as those parties agree to keep
                this information confidential. By clicking "I Agree", you consent to our privacy practices
                as described in this document.
              </p>
            </div>

            {/* Modal Footer (Buttons): ปรับเลย์เอาต์ปุ่มและสีสัน */}
            <div className="bg-white px-6 md:px-8 py-6 flex flex-col sm:flex-row justify-between gap-4 border-t border-gray-100 rounded-b-[20px]">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="w-full sm:w-1/2 bg-gray-200 text-black px-6 py-3.5 text-sm font-bold tracking-wider hover:bg-gray-300 transition-colors rounded-xl uppercase"
              >
                I Disagree
              </button>
              <button
                onClick={completeRegistration}
                className="w-full sm:w-1/2 bg-[#f97316] text-white px-6 py-3.5 text-sm font-bold tracking-wider hover:bg-[#ea580c] transition-colors rounded-xl uppercase shadow-md shadow-orange-500/20"
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

          <form className="mt-8 space-y-6" onSubmit={handleSignUpClick}>
            <div className="space-y-4">
              {/* --- Full Name --- */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-text-muted-light dark:text-text-muted-dark" />
                  </div>
                  <input id="name" name="name" type="text" required placeholder="Jane Doe" className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] sm:text-sm transition-colors text-gray-900 dark:text-white" />
                </div>
              </div>

              {/* --- Telephone --- */}
              <div>
                <label htmlFor="telephone" className="block text-sm font-medium mb-1">Telephone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-text-muted-light dark:text-text-muted-dark" />
                  </div>
                  <input id="telephone" name="telephone" type="tel" required placeholder="0812345678" className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] sm:text-sm transition-colors text-gray-900 dark:text-white" />
                </div>
              </div>

              {/* --- Email --- */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-text-muted-light dark:text-text-muted-dark" />
                  </div>
                  <input id="email" name="email" type="email" required placeholder="jane@example.com" className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] sm:text-sm transition-colors text-gray-900 dark:text-white" />
                </div>
              </div>

              {/* --- Password --- */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-text-muted-light dark:text-text-muted-dark" />
                  </div>
                  <input id="password" name="password" type="password" required placeholder="••••••••" className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] sm:text-sm transition-colors text-gray-900 dark:text-white" />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white transition-colors ${isLoading ? 'bg-[#f97316]/70 cursor-not-allowed' : 'bg-[#f97316] hover:bg-[#ea580c]'
                  }`}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
                {!isLoading && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-text-muted-light dark:text-text-muted-dark">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-[#f97316] hover:text-[#ea580c]">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}