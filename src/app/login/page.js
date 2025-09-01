import React from "react";
import Header from "@/components/Header"
import Footer from "@/components/Footer"

const Login = () => {
  return (
    <>
      <Header />

      <div className="bg-white min-h-[654px] flex justify-center items-center font-sans px-4">
        <div className="w-full max-w-[410px] text-black">
          {/* Top Title Section */}
          <div className="mb-10">
            <h2 className="text-center  font-sans text-2xl text-black ">
              Log in to your account
            </h2>
          </div>

          {/* Main Form Section */}
          <div className="flex flex-col gap-[20px]">
            {/* Google button */}
            <button className="flex items-center justify-center w-full py-3 rounded-full bg-[#EBF5FA] text-black text-base cursor-pointer border border-[#A7D5EC]">
              <img src="/Google.svg" alt="Google" className="w-5 h-5 mr-2" />
              Sign in with Google
            </button>

            {/* Microsoft button */}
            <button className="flex items-center justify-center w-full py-3 rounded-full bg-[#EBF5FA] text-black text-base cursor-pointer border border-[#A7D5EC]">
              <img src="/Microsoft.svg" alt="Microsoft" className="w-5 h-5 mr-2" />
              Sign in with Microsoft
            </button>

            {/* Divider */}
            <div className="flex items-center text-gray-500">
              <hr className="flex-1 border-gray-400" />
              <span className="px-2 text-sm">OR</span>
              <hr className="flex-1 border-gray-400" />
            </div>

            {/* Email Input */}
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

            {/* Password Input */}
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
              {/* Eye Icon */}
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg cursor-pointer">
                <svg
                  width="25"
                  height="20"
                  viewBox="0 0 25 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    opacity="0.52"
                    d="M24.2746 17.7527L1.85033 0.896094C1.78882 0.848742 1.71822 0.813503 1.64255 0.792389C1.56688 0.771274 1.48762 0.764698 1.40931 0.773035C1.331 0.781372 1.25516 0.80446 1.18613 0.840979C1.1171 0.877499 1.05622 0.926735 1.00698 0.985878L0.631987 1.43624C0.582628 1.4954 0.545885 1.56334 0.523861 1.63617C0.501837 1.709 0.494965 1.7853 0.503637 1.86069C0.51231 1.93607 0.536357 2.00908 0.574403 2.07552C0.612448 2.14196 0.663746 2.20054 0.72536 2.2479L23.1497 19.1045C23.2112 19.1519 23.2818 19.1871 23.3575 19.2082C23.4331 19.2293 23.5124 19.2359 23.5907 19.2276C23.669 19.2192 23.7448 19.1961 23.8139 19.1596C23.8829 19.1231 23.9438 19.0739 23.993 19.0147L24.368 18.5644C24.4174 18.5052 24.4541 18.4373 24.4761 18.3644C24.4982 18.2916 24.505 18.2153 24.4964 18.1399C24.4877 18.0645 24.4636 17.9915 24.4256 17.9251C24.3876 17.8586 24.3363 17.8001 24.2746 17.7527ZM11.6297 6.0509L16.6841 9.85066C16.6009 7.68936 14.7679 5.96184 12.5 5.96184C12.2075 5.96237 11.9158 5.99221 11.6297 6.0509ZM13.3703 13.9501L8.31588 10.1503C8.3995 12.3112 10.2324 14.0388 12.5 14.0388C12.7925 14.0382 13.0842 14.0084 13.3703 13.9501ZM12.5 4.80799C16.1993 4.80799 19.5907 6.79117 21.4221 10.0003C20.9732 10.7901 20.4184 11.5199 19.7722 12.171L21.1874 13.2347C21.9753 12.4242 22.6428 11.5128 23.171 10.5264C23.2568 10.3632 23.3015 10.1829 23.3015 10.0001C23.3015 9.81729 23.2568 9.63702 23.171 9.47386C21.1356 5.65859 17.1097 3.07722 12.5 3.07722C11.1238 3.07722 9.81096 3.32963 8.57649 3.75547L10.3168 5.064C11.027 4.90895 11.7545 4.80799 12.5 4.80799ZM12.5 15.1926C8.80074 15.1926 5.40972 13.2094 3.5779 10.0003C4.02743 9.21051 4.58277 8.48085 5.22972 7.82999L3.81452 6.76629C3.02672 7.57668 2.35929 8.48796 1.8312 9.47422C1.74542 9.63738 1.70073 9.81765 1.70073 10.0005C1.70073 10.1833 1.74542 10.3636 1.8312 10.5267C3.86476 14.342 7.89064 16.9234 12.5 16.9234C13.8762 16.9234 15.189 16.6692 16.4235 16.2451L14.6832 14.937C13.973 15.0916 13.2459 15.1926 12.5 15.1926Z"
                    fill="#9500DE"
                  />
                </svg>
              </span>
            </div>

            {/* Terms */}
            <p className="text-xs text-center text-gray-600">
              By signing in you agree to our{" "}
              <a href="/privacy" className="text-blue-400 hover:underline">
                Privacy Policy
              </a>{" "}
              and{" "}
              <a href="/terms" className="text-blue-400 hover:underline">
                Terms of Service
              </a>
            </p>

            {/* Checkbox + Forgot password */}
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="w-4 h-4 accent-purple-600" />
                Remember me
              </label>
              <a href="/forgot-password" className="text-blue-400 text-sm hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Login Button - Centered */}
            <div className="flex justify-center">
              <button className="w-[97px] py-3 rounded-full bg-purple-600 text-white text-base font-semibold hover:bg-purple-700 transition">
                Login
              </button>
            </div>

            {/* Signup Link */}
            <a
              href="/signup"
              className="block text-center text-blue-400 text-sm hover:underline"
            >
              Sign up for free
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Login;
