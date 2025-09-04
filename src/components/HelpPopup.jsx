import React from "react";

export default function HelpPopup({ open = false, onClose = () => {} }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
      <div className="w-[700px] h-[466px] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col max-w-[96vw]">
        {/* Header */}
        <div className="h-[53px] bg-[#9500DE] text-white flex items-center justify-between px-6">
          <div className="text-base font-semibold">Our Support</div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-white/20"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 5L15 15M15 5L5 15"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1">
          {/* Left section */}
          <aside className="w-[250px] border-r border-gray-200 p-5 flex flex-col">
            <div className="space-y-4">
              {/* Video */}
              <div className="flex flex-col">
                <div className="flex items-center space-x-3 cursor-pointer hover:text-purple-700 pb-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M1.99121 5.93164H14.0088C14.6942 5.93189 15.2498 6.48743 15.25 7.17285V16.8271C15.2498 17.5126 14.6942 18.0681 14.0088 18.0684H1.99121C1.30579 18.0681 0.750246 17.5126 0.75 16.8271V7.17285C0.750246 6.48743 1.30579 5.93189 1.99121 5.93164ZM22.3252 6.03711C22.7338 5.75885 23.2498 6.06403 23.25 6.49512V17.1992C23.25 17.6335 22.7308 17.9366 22.3252 17.6572L18.083 14.7334V8.96387L22.3252 6.03711Z"
                      stroke="#333333"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <span className="text-sm font-medium">Video Conference</span>
                </div>
                <hr className="border-gray-300" />
              </div>

              {/* Audio */}
              <div className="flex flex-col">
                <div className="flex items-center space-x-3 cursor-pointer hover:text-purple-700 pb-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 9.75C9 8.92031 8.32969 8.25 7.5 8.25H6.75C5.09062 8.25 3.75 9.59531 3.75 11.25V13.5C3.75 15.1594 5.09531 16.5 6.75 16.5H7.5C8.32969 16.5 9 15.8297 9 15V9.75ZM17.25 16.5C18.9094 16.5 20.25 15.1547 20.25 13.5V11.25C20.25 9.59062 18.9047 8.25 17.25 8.25H16.5C15.6703 8.25 15 8.92031 15 9.75V15C15 15.8297 15.6703 16.5 16.5 16.5H17.25ZM12 0C5.30625 0 0.215625 5.56875 0 12V12.75C0 13.1625 0.3375 13.5 0.75 13.5H1.5C1.9125 13.5 2.25 13.1625 2.25 12.75V12C2.25 6.62344 6.62344 2.25 12 2.25C17.3766 2.25 21.75 6.62344 21.75 12H21.7453C21.75 12.1125 21.75 19.7672 21.75 19.7672C21.75 20.8641 20.8641 21.75 19.7672 21.75H15C15 20.5078 13.9922 19.5 12.75 19.5H11.25C10.0078 19.5 9 20.5078 9 21.75C9 22.9922 10.0078 24 11.25 24H19.7672C22.1063 24 24 22.1063 24 19.7672V12C23.7844 5.56875 18.6938 0 12 0Z"
                      fill="#333333"
                    />
                  </svg>
                  <span className="text-sm font-medium">Audio Call</span>
                </div>
                <hr className="border-gray-300" />
              </div>

              {/* Chat */}
              <div className="flex flex-col">
                <div className="flex items-center space-x-3 cursor-pointer hover:text-purple-700 pb-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M2.95445 13.775L3.35261 12.8777L2.68962 12.1536C1.90468 11.2965 1.5 10.3291 1.5 9.33327C1.5 6.82045 4.31796 4.1665 8.66679 4.1665C13.0156 4.1665 15.8336 6.82045 15.8336 9.33327C15.8336 11.8461 13.0156 14.5 8.66679 14.5C7.18386 14.5 5.82141 14.1634 4.68661 13.6101L3.96645 13.2589L3.27416 13.6623C3.16085 13.7283 3.04203 13.7933 2.9179 13.8562C2.93021 13.8292 2.94239 13.8022 2.95445 13.775Z"
                      fill="#333333"
                    />
                  </svg>
                  <span className="text-sm font-medium">Live Chat</span>
                </div>
                <hr className="border-gray-300" />
              </div>
            </div>

            {/* Download buttons */}
            <div className="mt-6 space-y-3">
              <img src="/google-help.svg" alt="Available on Google Play" className="w-full cursor-pointer" />
              <img src="/Windows.svg" alt="Download on Windows" className="w-full cursor-pointer" />
            </div>
          </aside>

          {/* Right section */}
          <section className="flex-1 p-6 flex flex-col bg-gradient-to-r from-[#D2D2D2] to-[#B6B5B5]">
            <h3 className="text-purple-700 font-semibold">
              We can help now on video, audio or chat.
            </h3>
            <p className="text-sm text-gray-700 mt-2">
              Our Guru team is available 24/5 with free, unlimited help and training.
            </p>

            <div className="mt-4 mb-4">
              <img
                src="/guru_nav.svg"
                alt="Support Team"
                className="rounded-lg shadow-md w-full h-[220px] object-cover"
              />
            </div>

            <p className="text-sm text-gray-700 mt-auto mb-4">
              Also available via email:{" "}
              <a href="mailto:support@company.com" className="text-purple-600 underline">
                support@company.com
              </a>{" "}
              or phone: <span className="font-medium">(855) 898-8111</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

















// import React from "react";

// export default function HelpPopup({ open = false, onClose = () => {} }) {
//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
//       <div className="w-[700px] h-auto bg-white rounded-lg shadow-xl overflow-hidden flex flex-col max-w-[96vw]">
//         {/* Header */}
//         <div className="h-[53px] bg-[#9500DE] text-white flex items-center justify-between px-6">
//           <div className="text-base font-semibold">Our Support</div>
//           <button
//             onClick={onClose}
//             className="p-1.5 rounded-md hover:bg-white/20"
//             aria-label="Close"
//           >
//             <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
//               <path
//                 d="M5 5L15 15M15 5L5 15"
//                 stroke="white"
//                 strokeWidth="2"
//                 strokeLinecap="round"
//               />
//             </svg>
//           </button>
//         </div>

//         {/* Body */}
//         <div className="flex flex-col md:flex-row flex-1">
//           {/* Left section */}
//           <aside className="w-full md:w-[250px] border-r border-gray-200 p-5 flex flex-col">
//             <div className="space-y-4">
//               {/* Video */}
//               <div className="flex flex-col">
//                 <div className="flex items-center space-x-3 cursor-pointer hover:text-purple-700 pb-2">
//                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
//                     <path
//                       d="M1.99121 5.93164H14.0088C14.6942 5.93189 15.2498 6.48743 15.25 7.17285V16.8271C15.2498 17.5126 14.6942 18.0681 14.0088 18.0684H1.99121C1.30579 18.0681 0.750246 17.5126 0.75 16.8271V7.17285C0.750246 6.48743 1.30579 5.93189 1.99121 5.93164ZM22.3252 6.03711C22.7338 5.75885 23.2498 6.06403 23.25 6.49512V17.1992C23.25 17.6335 22.7308 17.9366 22.3252 17.6572L18.083 14.7334V8.96387L22.3252 6.03711Z"
//                       stroke="#333333"
//                       strokeWidth="1.5"
//                     />
//                   </svg>
//                   <span className="text-sm font-medium">Video Conference</span>
//                 </div>
//                 <hr className="border-gray-300" />
//               </div>

//               {/* Audio */}
//               <div className="flex flex-col">
//                 <div className="flex items-center space-x-3 cursor-pointer hover:text-purple-700 pb-2">
//                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
//                     <path
//                       d="M9 9.75C9 8.92031 8.32969 8.25 7.5 8.25H6.75C5.09062 8.25 3.75 9.59531 3.75 11.25V13.5C3.75 15.1594 5.09531 16.5 6.75 16.5H7.5C8.32969 16.5 9 15.8297 9 15V9.75ZM17.25 16.5C18.9094 16.5 20.25 15.1547 20.25 13.5V11.25C20.25 9.59062 18.9047 8.25 17.25 8.25H16.5C15.6703 8.25 15 8.92031 15 9.75V15C15 15.8297 15.6703 16.5 16.5 16.5H17.25ZM12 0C5.30625 0 0.215625 5.56875 0 12V12.75C0 13.1625 0.3375 13.5 0.75 13.5H1.5C1.9125 13.5 2.25 13.1625 2.25 12.75V12C2.25 6.62344 6.62344 2.25 12 2.25C17.3766 2.25 21.75 6.62344 21.75 12H21.7453C21.75 12.1125 21.75 19.7672 21.75 19.7672C21.75 20.8641 20.8641 21.75 19.7672 21.75H15C15 20.5078 13.9922 19.5 12.75 19.5H11.25C10.0078 19.5 9 20.5078 9 21.75C9 22.9922 10.0078 24 11.25 24H19.7672C22.1063 24 24 22.1063 24 19.7672V12C23.7844 5.56875 18.6938 0 12 0Z"
//                       fill="#333333"
//                     />
//                   </svg>
//                   <span className="text-sm font-medium">Audio Call</span>
//                 </div>
//                 <hr className="border-gray-300" />
//               </div>

//               {/* Chat */}
//               <div className="flex flex-col">
//                 <div className="flex items-center space-x-3 cursor-pointer hover:text-purple-700 pb-2">
//                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
//                     <path
//                       fillRule="evenodd"
//                       clipRule="evenodd"
//                       d="M2.95445 13.775L3.35261 12.8777L2.68962 12.1536C1.90468 11.2965 1.5 10.3291 1.5 9.33327C1.5 6.82045 4.31796 4.1665 8.66679 4.1665C13.0156 4.1665 15.8336 6.82045 15.8336 9.33327C15.8336 11.8461 13.0156 14.5 8.66679 14.5C7.18386 14.5 5.82141 14.1634 4.68661 13.6101L3.96645 13.2589L3.27416 13.6623C3.16085 13.7283 3.04203 13.7933 2.9179 13.8562C2.93021 13.8292 2.94239 13.8022 2.95445 13.775Z"
//                       fill="#333333"
//                     />
//                   </svg>
//                   <span className="text-sm font-medium">Live Chat</span>
//                 </div>
//                 <hr className="border-gray-300" />
//               </div>
//             </div>

//             {/* Help icon */}
//             <div className="mt-6 flex flex-col items-center">
//               <img
//                 src="/help.svg"
//                 alt="Help"
//                 className="w-20 h-20 mb-2 cursor-pointer"
//               />
//               <p className="text-sm font-medium text-center text-gray-700">
//                 Free, unlimited help & training
//               </p>
//             </div>
//           </aside>

//           {/* Right section */}
//           <section className="flex-1 p-6 flex flex-col bg-gradient-to-r from-[#D2D2D2] to-[#B6B5B5]">
//             <h3 className="text-purple-700 font-semibold">
//               We can help now on video, audio or chat.
//             </h3>
//             <p className="text-sm text-gray-700 mt-2">
//               Our Guru team is available 24/5 with free, unlimited help and training.
//             </p>

//             <div className="mt-4 mb-4">
//               <img
//                 src="/guru_nav.svg"
//                 alt="Support Team"
//                 className="rounded-lg shadow-md w-full h-[220px] object-cover"
//               />
//             </div>

//             <p className="text-sm text-gray-700 mt-auto mb-4">
//               Also available via email:{" "}
//               <a href="mailto:support@company.com" className="text-purple-600 underline">
//                 support@company.com
//               </a>{" "}
//               or phone: <span className="font-medium">(855) 898-8111</span>
//             </p>
//           </section>
//         </div>
//       </div>
//     </div>
//   );
// }
