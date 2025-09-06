"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setMsg("If that email exists, a reset link has been sent.");
  }

  return (
    <>
      <Header />
      <div className="w-full min-h-screen flex justify-center bg-white px-4">
        <div className="w-full max-w-[480px] my-16 text-black">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-left">Forgot password</h2>
          <p className="text-gray-600 text-sm md:text-base mb-8 leading-relaxed text-left">
            Enter the email for your Lessn account. You'll receive a reset link.
          </p>

          <form className="flex flex-col gap-6" onSubmit={submit} autoComplete="on">
            <div className="text-left">
              <label className="block text-sm font-medium mb-2">Enter User Email</label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Enter your email"
                className="w-full py-3 px-4 rounded-full border border-purple-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {msg && <p className="text-sm text-gray-700">{msg}</p>}
            <div className="text-left">
              <button type="submit" className="w-[200px] py-3 rounded-full bg-purple-600 text-white font-semibold">
                Reset Password
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <a href="/login" className="text-blue-500 hover:underline">Back to login</a>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
