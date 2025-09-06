"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useRouter, useParams } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = useParams(); // <-- get dynamic route param in client

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!token) return setMsg("Invalid or missing reset token.");
    if (password !== confirm) return setMsg("Passwords do not match.");
    setLoading(true);
    setMsg("");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const json = await res.json();
    setLoading(false);

    if (json.ok) {
      setMsg("Password reset! Redirecting to login…");
      setTimeout(() => router.push("/login"), 800);
    } else {
      setMsg(json.message || "Something went wrong.");
    }
  }

  return (
    <>
      <Header />
      <div className="bg-white min-h-[560px] flex justify-center items-center px-4">
        <form onSubmit={submit} className="w-full max-w-[420px] text-black space-y-4">
          <h2 className="text-2xl font-semibold mb-2">Set a new password</h2>
          <input
            type="password"
            name="new-password"
            autoComplete="new-password"
            placeholder="New password"
            className="w-full py-3 px-4 rounded-full border border-purple-600"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm password"
            className="w-full py-3 px-4 rounded-full border border-purple-600"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {msg && <p className="text-sm text-gray-700">{msg}</p>}
          <button
            disabled={loading}
            className="w-[180px] py-3 rounded-full bg-purple-600 text-white font-semibold"
          >
            {loading ? "Saving…" : "Save password"}
          </button>
        </form>
      </div>
      <Footer />
    </>
  );
}
