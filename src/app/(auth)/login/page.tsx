import React from "react";
import Image from "next/image";
import Link from "next/link";
// Agar aap lucide-react use kar rahe hain toh icons yahan se import karein
// npm install lucide-react
import { EyeOff } from "lucide-react"; 

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 font-sans">
      {/* Main Container */}
      <div className="w-full max-w-full flex gap-10 lg:gap-20 items-center justify-center">
        
        {/* Left Panel - Branding (Hidden on mobile, visible on desktop) */}
        <div className="hidden md:flex flex-col justify-center items-center w-[448px] h-[604px] bg-[#D21B8B1A] rounded-[14px] shadow-lg">
          {/* Actual Logo from public folder */}
          <div className="relative flex justify-center items-center w-full">
            <Image 
              src="/ChatTmLogo.png" // Yahan apni image ka exact naam likhein jo public folder mein hai
              alt="ChatTm Logo" 
              width={200} // Apne design ke hisaab se size adjust kar sakte hain
              height={100} 
              className="object-contain"
              priority // Isse LCP (Largest Contentful Paint) optimize hota hai aur image jaldi load hoti hai
            />
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex-1 flex flex-col justify-center w-full max-w-[384px]">
          <h1 className="text-[24px] font-bold text-[#0B1C30] mb-8">
            Welcome Back 👋
          </h1>

          <form className="flex flex-col gap-4">
            {/* Email / Phone Input */}
            <div>
              <input
                type="text"
                placeholder="Email or Phone Number"
                className="w-full h-[50px] px-4 border border-[#D8D2D2] rounded-[10px] text-[#0B1C30] placeholder-gray-400 focus:outline-none focus:border-[#00696F] focus:ring-1 focus:ring-[#00696F] transition-all"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                className="w-full h-[50px] px-4 border border-[#D8D2D2] rounded-[10px] text-[#0B1C30] placeholder-gray-400 focus:outline-none focus:border-[#00696F] focus:ring-1 focus:ring-[#00696F] transition-all"
              />
              <button 
                type="button" 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <EyeOff size={20} />
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end mt-1">
              <Link 
                href="/forgot-password" 
                className="text-sm text-[#00696F] font-medium hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full h-[50px] bg-[#00696F] text-white font-semibold rounded-[10px] mt-2 hover:bg-[#005a5f] transition-colors"
            >
              Login
            </button>
          </form>

          {/* OR Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-[#C1C1C1]"></div>
            <span className="px-4 text-[#C1C1C1] text-sm font-medium">OR</span>
            <div className="flex-1 border-t border-[#C1C1C1]"></div>
          </div>

          {/* Social Login Buttons */}
          <div className="flex flex-col gap-4">
            <button className="w-full h-[50px] flex items-center justify-center gap-3 border border-[#D8D2D2] rounded-[10px] text-[#0B1C30] font-semibold hover:bg-gray-50 transition-colors">
              {/* Google SVG Icon Placeholder */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <button className="w-full h-[50px] flex items-center justify-center gap-3 border border-[#D8D2D2] rounded-[10px] text-[#0B1C30] font-semibold hover:bg-gray-50 transition-colors">
              {/* Apple SVG Icon Placeholder */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.05 2.53.68 3.14.68.65 0 2.11-.84 3.79-.69 1.48.06 2.76.62 3.52 1.6-3.1 1.66-2.58 5.61.35 6.64-1.04 2.27-2.11 4.19-2.8 4.74zM12.03 7.25c-.15-2.31 1.93-4.32 4.14-4.53.37 2.45-2.08 4.67-4.14 4.53z"/>
              </svg>
              Continue with Apple
            </button>
          </div>

          {/* Sign Up Link */}
          <p className="text-center mt-8 text-sm text-[#0B1C30]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#00696F] font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}