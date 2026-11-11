interface LogoProps {
  readonly size?: 'sm' | 'md' | 'lg';
  readonly showText?: boolean;
  readonly className?: string;
  readonly lightText?: boolean;
}

export default function KushalLogo({
  size = 'md',
  showText = true,
  className = '',
  lightText = false,
}: Readonly<LogoProps>) {
  const sizeMap = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-12 w-12',
  };

  const iconSizeMap = {
    sm: 16,
    md: 20,
    lg: 26,
  };

  const textSizeMap = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Medical Cross Emblem */}
      <div
        className={`${sizeMap[size]} relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 text-white shadow-md shadow-teal-500/25 flex-shrink-0 transition-transform hover:scale-105`}
      >
        <svg
          width={iconSizeMap[size]}
          height={iconSizeMap[size]}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Medical Cross in Heart */}
          <path d="M12 6v12M6 12h12" />
        </svg>
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
        </span>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-display font-extrabold tracking-tight ${
                lightText ? 'text-white' : 'text-slate-900'
              } ${textSizeMap[size]}`}
            >
              Kushal Hospitals
            </span>
          </div>
          <span
            className={`text-[10px] font-bold uppercase tracking-widest ${
              lightText ? 'text-teal-300' : 'text-teal-700'
            }`}
          >
            Clinical Excellence
          </span>
        </div>
      )}
    </div>
  );
}
