import React from 'react';

const BusLogo = ({ className = "h-8 w-8" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bus body */}
      <rect x="20" y="30" width="60" height="45" rx="8" fill="#2563eb" stroke="#0ea5e9" strokeWidth="2"/>
      
      {/* Windshield */}
      <rect x="25" y="35" width="22" height="15" rx="2" fill="#38bdf8" opacity="0.7"/>
      <rect x="53" y="35" width="22" height="15" rx="2" fill="#38bdf8" opacity="0.7"/>
      
      {/* Front lights */}
      <circle cx="30" cy="28" r="2" fill="#fbbf24"/>
      <circle cx="70" cy="28" r="2" fill="#fbbf24"/>
      
      {/* Door */}
      <rect x="30" y="55" width="12" height="18" rx="1" fill="#1e40af" stroke="#0ea5e9" strokeWidth="1"/>
      <line x1="36" y1="55" x2="36" y2="73" stroke="#0ea5e9" strokeWidth="1"/>
      
      {/* Windows */}
      <rect x="45" y="55" width="10" height="10" rx="1" fill="#38bdf8" opacity="0.6"/>
      <rect x="58" y="55" width="10" height="10" rx="1" fill="#38bdf8" opacity="0.6"/>
      
      {/* Wheels */}
      <circle cx="32" cy="78" r="7" fill="#1f2937" stroke="#0ea5e9" strokeWidth="2"/>
      <circle cx="32" cy="78" r="3" fill="#4b5563"/>
      <circle cx="68" cy="78" r="7" fill="#1f2937" stroke="#0ea5e9" strokeWidth="2"/>
      <circle cx="68" cy="78" r="3" fill="#4b5563"/>
      
      {/* Bumper */}
      <rect x="22" y="25" width="56" height="3" rx="1.5" fill="#0ea5e9"/>
      
      {/* Side detail */}
      <line x1="25" y1="52" x2="75" y2="52" stroke="#0ea5e9" strokeWidth="1" opacity="0.5"/>
      
      {/* Roof detail */}
      <rect x="45" y="32" width="10" height="2" rx="1" fill="#0ea5e9"/>
    </svg>
  );
};

export default BusLogo;
