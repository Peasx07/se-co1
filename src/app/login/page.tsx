'use client';

import React, { useState, useEffect } from 'react'; // 🟢 1. อย่าลืม import useEffect
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
  const navigate = useRouter();
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 🟢 2. เพิ่ม useEffect เพื่อ "ล้างไพ่" ทุกครั้งที่เปิดหน้า Login
  useEffect(() => {
    // ลบข้อมูลใน LocalStorage ทิ้งให้หมด
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    
    // ยิง API ไปบอก Backend ว่าขอลบ Cookie อันเก่าทิ้งด้วย (ดัก Error ไว้เผื่อยังไม่ได้ล็อกอิน)
    axios.get('http://localhost:5000/api/v1/auth/logout', { withCredentials: true })
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); 
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email')?.toString() || '';
    const password = formData.get('password')?.toString() || '';

    try {
      const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
        email,
        password
      }, {
        withCredentials: true 
      });

      const token = loginRes.data.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
      }

      const meRes = await axios.get('http://localhost:5000/api/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${token}` 
        },
        withCredentials: true
      });

      const userRole = meRes.data.data.role; 
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('userRole', userRole);
      }
      
      // 🟢 3. แก้ไขการเปลี่ยนหน้าตรงนี้ เพื่อป้องกัน Cache ของ Next.js
      if (userRole === 'admin') {
        // ใช้ window.location.href เพื่อให้หน้าเว็บโหลดใหม่ทั้งหมด (ล้าง State เก่า)
        window.location.href = '/admin'; 
      } else {
        window.location.href = '/dashboard';
      }

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.msg || err.response?.data?.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setIsLoading(false);
    }
  };

  // ... (ส่วน return UI ด้านล่างเหมือนเดิมทุกประการครับ) ...

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background-light dark:bg-background-dark">
      <div className="max-w-md w-full space-y-8 bg-surface-light dark:bg-surface-dark p-8 rounded-2xl shadow-sm border border-border-light dark:border-border-dark">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">W</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
          <p className="mt-2 text-sm text-text-muted-light dark:text-text-muted-dark">
            Sign in to your account to continue
          </p>
        </div>
        
        {/* ✅ กล่องแสดงข้อความ Error (ถ้ามี) */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm text-center">
            {error}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-text-muted-light dark:text-text-muted-dark" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-3 py-3 pl-10 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors text-text-light dark:text-text-dark"
                  placeholder="jane@example.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-text-muted-light dark:text-text-muted-dark" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none relative block w-full px-3 py-3 pl-10 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors text-text-light dark:text-text-dark"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-text-muted-light dark:text-text-muted-dark">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-primary hover:text-primary-hover">
                Forgot password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white transition-colors ${
                isLoading ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
              }`}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
              {!isLoading && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        </form>

        {/* ... (ส่วนโค้ดปุ่ม Google/Github ด้านล่างยังคงเหมือนเดิม ไม่ต้องแก้ครับ) ... */}
        
        <p className="mt-8 text-center text-sm text-text-muted-light dark:text-text-muted-dark">
          Don't have an account?{' '}
          <Link href="/signup" className="font-medium text-primary hover:text-primary-hover">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}