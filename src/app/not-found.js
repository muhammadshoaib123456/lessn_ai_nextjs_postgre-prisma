import React from "react";
import Link  from "next/link";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-700 via-indigo-800 to-black text-white text-center px-6">
      {/* Big 404 */}
      <h1 className="text-[8rem] font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600 animate-pulse">
        404
      </h1>

      {/* Message */}
      <p className="text-2xl mt-4 font-semibold">Oops! Page Not Found</p>
      <p className="text-gray-300 mt-2 max-w-lg">
        The page you’re looking for doesn’t exist or has been moved.  
        But don’t worry, you can always return home 🚀
      </p>

      {/* Button */}
      <Link
        href="/"
        className="mt-8 inline-block px-8 py-3 text-lg font-medium rounded-xl shadow-lg 
        bg-gradient-to-r from-pink-500 to-purple-600 hover:from-purple-600 hover:to-pink-500 
        transition-all duration-300 ease-in-out transform hover:scale-105"
      >
        Go Back Home
      </Link>

      {/* Background Animation */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute w-96 h-96 bg-purple-500 opacity-30 rounded-full blur-3xl top-10 left-10 animate-pulse"></div>
        <div className="absolute w-80 h-80 bg-pink-500 opacity-30 rounded-full blur-3xl bottom-10 right-10 animate-pulse delay-200"></div>
      </div>
    </div>
  );
};

export default NotFound;
