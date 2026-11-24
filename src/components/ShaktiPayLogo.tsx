interface ShaktiPayLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export function ShaktiPayLogo({ size = 'md', showSubtitle = false }: ShaktiPayLogoProps) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className={`relative ${iconSizes[size]} flex items-center justify-center`}>
        {/* Glow & Outer Ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 p-[3px] shadow-lg shadow-orange-500/20">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center p-1">
            {/* Inner Crest with Stylized S */}
            <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="46" stroke="#0f172a" strokeWidth="4" strokeDasharray="3 2" opacity="0.4" />
              <path
                d="M32 28C32 28 42 22 55 24C68 26 72 38 65 50C58 62 40 56 38 68C36 80 50 82 62 78"
                stroke="url(#shaktiGrad)"
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M48 22L36 34L44 42"
                stroke="#1e3a8a"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M52 78L64 66L56 58"
                stroke="#1e3a8a"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="shaktiGrad" x1="25" y1="20" x2="75" y2="80" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ff8a00" />
                  <stop offset="0.5" stopColor="#ff5500" />
                  <stop offset="1" stopColor="#ffb300" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-2 text-center">
        <h1 className={`font-black tracking-tight text-slate-800 flex items-center justify-center gap-0.5 ${textSizes[size]}`}>
          <span className="text-slate-900">Shakti</span>
          <span className="text-orange-500">Pay</span>
        </h1>
        {showSubtitle && (
          <p className="text-xs font-medium text-slate-500 tracking-wider uppercase mt-0.5">
            Fast & Secure Payment
          </p>
        )}
      </div>
    </div>
  );
}
