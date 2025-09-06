"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ firstName, email, password }),
    });
    const json = await res.json();
    if (!json.ok) {
      setMsg(json.message || "Failed to register");
      return;
    }
    // Auto-login after signup
    const _ = await signIn("credentials", { redirect: false, email, password, callbackUrl: "/" });
    router.push("/");
  }

  return (
    <>
      <Header />

      <div className="bg-white min-h-[654px] flex justify-center items-center font-sans px-4 my-12">
        <div className="w-full max-w-[410px] text-black">
          <div className="mb-6">
            <h2 className="text-center font-sans text-3xl text-black">Create an account</h2>
            {/* Hiding the 'Already have an account? Login' link per request */}
          </div>

          <form className="flex flex-col gap-[20px]" onSubmit={submit} autoComplete="on">
            <button type="button" className="flex items-center justify-center w-full py-3 rounded-full bg-[#EBF5FA] text-gray-500 border border-[#A7D5EC] cursor-not-allowed">
              <img src="/Google.svg" alt="Google" className="w-5 h-5 mr-2" />
              Sign up with Google (coming soon)
            </button>
            <button type="button" className="flex items-center justify-center w-full py-3 rounded-full bg-[#EBF5FA] text-gray-500 border border-[#A7D5EC] cursor-not-allowed">
              <img src="/Microsoft.svg" alt="Microsoft" className="w-5 h-5 mr-2" />
              Sign up with Microsoft (coming soon)
            </button>

            <div className="flex items-center text-gray-500">
              <hr className="flex-1 border-gray-400" />
              <span className="px-2 text-sm">OR</span>
              <hr className="flex-1 border-gray-400" />
            </div>

            <div className="relative">
              <input
                type="text"
                name="given-name"
                autoComplete="given-name"
                placeholder="First Name"
                className="w-full py-3 pl-10 pr-3 rounded-full border border-purple-600 bg-white text-black text-base focus:outline-none"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
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
            </div>

            <div className="relative">
              <input
                type="password"
                name="new-password"
                autoComplete="new-password"
                placeholder="Password (min 6 chars)"
                className="w-full py-3 pl-10 pr-10 rounded-full border border-purple-600 bg-white text-black text-base focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {msg && <p className="text-sm text-red-600 text-center">{msg}</p>}

            <p className="text-xs text-center text-gray-600">
              By signing up you agree to our <a href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</a> and{" "}
              <a href="/terms" className="text-blue-400 hover:underline">Terms</a>.
            </p>

            <div className="flex justify-center">
              <button className="w-[140px] py-3 rounded-full bg-purple-600 text-white text-base font-semibold hover:bg-purple-700 transition">
                Register
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </>
  );
}
