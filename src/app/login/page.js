"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();

    // Let the browser see a "real" form submit (helps password manager)
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl: next,
    });

    if (res?.ok) {
      router.push(next);
    } else {
      setMsg("Invalid email or password.");
    }
  }

  return (
    <>
      <Header />
      <div className="bg-white min-h-[654px] flex justify-center items-center font-sans px-4">
        <div className="w-full max-w-[410px] text-black">
          <div className="mb-10">
            <h2 className="text-center font-sans text-2xl text-black">
              Log in to your account
            </h2>
          </div>

          <form className="flex flex-col gap-[20px]" onSubmit={submit} autoComplete="on">
            {/* Social buttons are placeholders for now */}
            <button type="button" className="flex items-center justify-center w-full py-3 rounded-full bg-[#EBF5FA] text-gray-500 border border-[#A7D5EC] cursor-not-allowed">
              <img src="/Google.svg" alt="Google" className="w-5 h-5 mr-2" />
              Sign in with Google (coming soon)
            </button>
            <button type="button" className="flex items-center justify-center w-full py-3 rounded-full bg-[#EBF5FA] text-gray-500 border border-[#A7D5EC] cursor-not-allowed">
              <img src="/Microsoft.svg" alt="Microsoft" className="w-5 h-5 mr-2" />
              Sign in with Microsoft (coming soon)
            </button>

            <div className="flex items-center text-gray-500">
              <hr className="flex-1 border-gray-400" />
              <span className="px-2 text-sm">OR</span>
              <hr className="flex-1 border-gray-400" />
            </div>

            <div className="relative">
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Email"
                className="w-full py-3 pl-10 pr-3 rounded-full border border-purple-600 bg-white text-black text-base focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600 text-lg">
                {/* email icon svg (unchanged) */}
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.3125 0.25H1.6875C0.755508 0.25 0 1.00551 0 1.9375V12.0625C0 12.9945 0.755508 13.75 1.6875 13.75H16.3125C17.2445 13.75 18 12.9945 18 12.0625V1.9375C18 1.00551 17.2445 0.25 16.3125 0.25Z" fill="#9500DE"/></svg>
              </span>
            </div>

            <div className="relative">
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Password"
                className="w-full py-3 pl-10 pr-10 rounded-full border border-purple-600 bg-white text-black text-base focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600 text-lg">{/* lock icon */}</span>
            </div>

            {msg && <p className="text-sm text-red-600 text-center">{msg}</p>}

            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="w-4 h-4 accent-purple-600" defaultChecked />
                Remember me
              </label>
              <a href="/forgot-password" className="text-blue-400 text-sm hover:underline">
                Forgot password?
              </a>
            </div>

            <div className="flex justify-center">
              <button className="w-[120px] py-3 rounded-full bg-purple-600 text-white text-base font-semibold hover:bg-purple-700 transition">
                Login
              </button>
            </div>
            {/* Signup Link */}
            <a
              href="/register"
              className="block text-center text-blue-400 text-sm hover:underline"
            >
              Sign up for free
            </a>
          </form>

          {/* Intentionally removed the "Sign up" link per your request */}
        </div>
      </div>
      <Footer />
    </>
  );
}
