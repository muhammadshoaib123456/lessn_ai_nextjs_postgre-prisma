import React from "react";
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import Link from "next/link";

const Register = () => {
  return (
    <>
      <Header />

      {/* Wrapper with margin top & bottom */}
      <div className="bg-white min-h-[654px] flex justify-center items-center font-sans px-4 my-12">
        <div className="w-full max-w-[410px] text-black">
          {/* Top Title Section */}
          <div className="mb-6">
            <h2 className="text-center font-sans text-3xl text-black">
              Create an account
            </h2>
            <p className="text-center text-sm text-gray-600 mt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-400 hover:underline">
                Login
              </Link>
            </p>
          </div>

          {/* Main Form Section */}
          <div className="flex flex-col gap-[20px]">
            {/* Google button */}
            <button className="flex items-center justify-center w-full py-3 rounded-full bg-[#EBF5FA] text-black text-base cursor-pointer border border-[#A7D5EC]">
              <img src="/Google.svg" alt="Google" className="w-5 h-5 mr-2" />
              Sign up with Google
            </button>

            {/* Microsoft button */}
            <button className="flex items-center justify-center w-full py-3 rounded-full bg-[#EBF5FA] text-black text-base cursor-pointer border border-[#A7D5EC]">
              <img src="/Microsoft.svg" alt="Microsoft" className="w-5 h-5 mr-2" />
              Sign up with Microsoft
            </button>

            {/* Divider */}
            <div className="flex items-center text-gray-500">
              <hr className="flex-1 border-gray-400" />
              <span className="px-2 text-sm">OR</span>
              <hr className="flex-1 border-gray-400" />
            </div>

            {/* First Name */}
            <div className="relative">
              <input
                type="text"
                placeholder="First Name"
                className="w-full py-3 pl-10 pr-3 rounded-full border border-purple-600 bg-white text-black text-base focus:outline-none "
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600 text-lg">
               <svg width="18" height="19" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.15 10.9375C11.141 10.9375 10.6559 11.5 9 11.5C7.34414 11.5 6.8625 10.9375 5.85 10.9375C3.24141 10.9375 1.125 13.0539 1.125 15.6625V16.5625C1.125 17.4941 1.88086 18.25 2.8125 18.25H15.1875C16.1191 18.25 16.875 17.4941 16.875 16.5625V15.6625C16.875 13.0539 14.7586 10.9375 12.15 10.9375ZM15.1875 16.5625H2.8125V15.6625C2.8125 13.9891 4.17656 12.625 5.85 12.625C6.36328 12.625 7.19648 13.1875 9 13.1875C10.8176 13.1875 11.6332 12.625 12.15 12.625C13.8234 12.625 15.1875 13.9891 15.1875 15.6625V16.5625ZM9 10.375C11.7949 10.375 14.0625 8.10742 14.0625 5.3125C14.0625 2.51758 11.7949 0.25 9 0.25C6.20508 0.25 3.9375 2.51758 3.9375 5.3125C3.9375 8.10742 6.20508 10.375 9 10.375ZM9 1.9375C10.8598 1.9375 12.375 3.45273 12.375 5.3125C12.375 7.17227 10.8598 8.6875 9 8.6875C7.14023 8.6875 5.625 7.17227 5.625 5.3125C5.625 3.45273 7.14023 1.9375 9 1.9375Z" fill="#9500DE"/>
</svg>

              </span>
            </div>

           

            {/* Email */}
            <div className="relative">
              <input
                type="email"
                placeholder="Email"
                className="w-full py-3 pl-10 pr-3 rounded-full border border-purple-600 bg-white text-black text-base focus:outline-none "
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600 text-lg">
                {/* Email Icon */}
                <svg
                  width="18"
                  height="14"
                  viewBox="0 0 18 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16.3125 0.25H1.6875C0.755508 0.25 0 1.00551 0 1.9375V12.0625C0 12.9945 0.755508 13.75 1.6875 13.75H16.3125C17.2445 13.75 18 12.9945 18 12.0625V1.9375C18 1.00551 17.2445 0.25 16.3125 0.25ZM16.3125 1.9375V3.37205C15.5242 4.01397 14.2675 5.01213 11.5809 7.11584C10.9889 7.58155 9.81605 8.7004 9 8.68736C8.18409 8.70054 7.01089 7.58138 6.41907 7.11584C3.73289 5.01244 2.47588 4.01407 1.6875 3.37205V1.9375H16.3125ZM1.6875 12.0625V5.53743C2.49307 6.17907 3.63547 7.07945 5.37673 8.44295C6.14514 9.04782 7.49081 10.3831 9 10.375C10.5018 10.3831 11.8304 9.06719 12.623 8.44323C14.3642 7.07977 15.5069 6.17914 16.3125 5.53746V12.0625H1.6875Z"
                    fill="#9500DE"
                  />
                </svg>
              </span>
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                className="w-full py-3 pl-10 pr-10 rounded-full border border-purple-600 bg-white text-black text-base focus:outline-none "
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600 text-lg">
                {/* Lock Icon */}
                <svg
                  width="16"
                  height="18"
                  viewBox="0 0 16 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14.1875 9.00002H5.46874V5.37541C5.46874 3.98323 6.58319 2.82659 7.97537 2.81253C9.38162 2.79847 10.5312 3.94104 10.5312 5.34377V5.90627C10.5312 6.37385 10.9074 6.75002 11.375 6.75002H12.5C12.9676 6.75002 13.3437 6.37385 13.3437 5.90627V5.34377C13.3437 2.39066 10.9355 -0.0105122 7.98241 3.46119e-05C5.02929 0.0105815 2.65624 2.44339 2.65624 5.39651V9.00002H1.8125C0.880858 9.00002 0.125 9.75587 0.125 10.6875V16.3125C0.125 17.2441 0.880858 18 1.8125 18H14.1875C15.1191 18 15.875 17.2441 15.875 16.3125V10.6875C15.875 9.75587 15.1191 9.00002 14.1875 9.00002ZM9.40623 14.3438C9.40623 15.1207 8.77694 15.75 7.99998 15.75C7.22303 15.75 6.59374 15.1207 6.59374 14.3438V12.6563C6.59374 11.8793 7.22303 11.25 7.99998 11.25C8.77694 11.25 9.40623 11.8793 9.40623 12.6563V14.3438Z"
                    fill="#9500DE"
                  />
                </svg>
              </span>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <input
                type="password"
                placeholder="Confirm Password"
                className="w-full py-3 pl-10 pr-3 rounded-full border border-purple-600 bg-white text-black text-base focus:outline-none "
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600 text-lg">
                {/* Lock Icon */}
                <svg
                  width="16"
                  height="18"
                  viewBox="0 0 16 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14.1875 9.00002H5.46874V5.37541C5.46874 3.98323 6.58319 2.82659 7.97537 2.81253C9.38162 2.79847 10.5312 3.94104 10.5312 5.34377V5.90627C10.5312 6.37385 10.9074 6.75002 11.375 6.75002H12.5C12.9676 6.75002 13.3437 6.37385 13.3437 5.90627V5.34377C13.3437 2.39066 10.9355 -0.0105122 7.98241 3.46119e-05C5.02929 0.0105815 2.65624 2.44339 2.65624 5.39651V9.00002H1.8125C0.880858 9.00002 0.125 9.75587 0.125 10.6875V16.3125C0.125 17.2441 0.880858 18 1.8125 18H14.1875C15.1191 18 15.875 17.2441 15.875 16.3125V10.6875C15.875 9.75587 15.1191 9.00002 14.1875 9.00002ZM9.40623 14.3438C9.40623 15.1207 8.77694 15.75 7.99998 15.75C7.22303 15.75 6.59374 15.1207 6.59374 14.3438V12.6563C6.59374 11.8793 7.22303 11.25 7.99998 11.25C8.77694 11.25 9.40623 11.8793 9.40623 12.6563V14.3438Z"
                    fill="#9500DE"
                  />
                </svg>
              </span>
            </div>

            {/* Terms */}
            <p className="text-xs text-center text-gray-600">
              By signing up you agree to our{" "}
              <a href="/privacy" className="text-blue-400 hover:underline">
                Privacy Policy
              </a>{" "}
              and{" "}
              <a href="/terms" className="text-blue-400 hover:underline">
                Terms of Service
              </a>
            </p>

            {/* Register Button */}
            <div className="flex justify-center">
              <button className="w-[140px] py-3 rounded-full bg-purple-600 text-white text-base font-semibold hover:bg-purple-700 transition">
                Register
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Register;
