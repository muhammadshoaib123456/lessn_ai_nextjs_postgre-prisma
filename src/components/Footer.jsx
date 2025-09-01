





import React from "react";
import Link from "next/link";
const Footer = () => {
  return (  
  
  

    
  
  <>
  <footer className=" bg-gradient-to-b from-[#500078] to-[#9500DE] py-0 text-white">
  <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-6">
    
    {/* Left section (Logo + Text + Links) */}
    <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8 pl-6">
      
      {/* Logo + text below */}
      <div className="flex flex-col items-center mt-10 text-center">

                <p className="mb-4">Brought to you by</p>

        <div className=" flex mb-8 items-center justify-center overflow-hidden">
           
          <img
            src="/OneScreen.svg"
            alt="OneScreen logo"
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      {/* Links */}
      <div className="flex mt-18 space-x-4 text-sm">
        <Link href="/privacy" className="hover:text-gray-300">
          Privacy policy
        </Link>
        <span>|</span>
        <Link href="/terms" className="hover:text-gray-300">
          Terms of service
        </Link>
      </div>
    </div>

    {/* Right section (Socials) */}
    <div className="flex space-x-4 pr-20 mt-6 md:mt-0">
      <a href="#" aria-label="Instagram">
        <img
          src="/I.svg"
          alt="Instagram"
          className="h-7 w-7 object-contain hover:opacity-80"
        />
      </a>
      <a href="#" aria-label="Facebook">
        <img
          src="/F.svg"
          alt="Facebook"
          className="h-7 w-7 object-contain hover:opacity-80"
        />
      </a>
      <a href="#" aria-label="x">
        <img
          src="/X.svg"
          alt="x"
          className="h-7 w-7 object-contain hover:opacity-80"
        />
      </a>
    </div>
  </div>
</footer>


</>

  );
};
export default Footer;
