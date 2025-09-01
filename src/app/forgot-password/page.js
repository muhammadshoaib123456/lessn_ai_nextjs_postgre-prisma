import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ForgotPassword = () => {
  return (
    <>
      <Header />
      <div className="w-full min-h-screen flex justify-center bg-white px-4">
        <div className="w-full max-w-[480px] my-16 text-black">
          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-left">
            Forgot password
          </h2>

          {/* Description */}
          <p className="text-gray-600 text-sm md:text-base mb-8 leading-relaxed text-left">
            To reset your password, please enter the email associated with your
            Lessn Account. You will receive an email with the reset password link
            at the email address provided. If you haven’t received the email yet,
            try again after 90 seconds.
          </p>

          {/* Form */}
          <form className="flex flex-col gap-6">
            {/* Email Field */}
            <div className="text-left">
              <label className="block text-sm font-medium mb-2">
                Enter User Email
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full py-3 px-4 rounded-full border border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            {/* Submit Button (left aligned) */}
            <div className="text-left">
              <button
                type="submit"
                className="w-[200px] py-3 rounded-full bg-purple-600 text-white font-semibold hover:bg-purple-700 transition"
              >
                Reset Password
              </button>
            </div>
          </form>

          {/* Back to login (centered) */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-blue-500 hover:underline text-sm md:text-base"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ForgotPassword;
