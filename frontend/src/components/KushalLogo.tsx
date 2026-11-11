interface LogoProps {
  readonly size?: 'sm' | 'md' | 'lg' | 'xl';
  readonly showText?: boolean;
  readonly className?: string;
  readonly lightText?: boolean;
  readonly variant?: 'emblem' | 'full';
}

export default function KushalLogo({
  size = 'md',
  showText = true,
  className = '',
  lightText = false,
  variant = 'emblem',
}: Readonly<LogoProps>) {
  const sizeMap = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
    xl: 'h-20 w-20',
  };

  const textSizeMap = {
    sm: 'text-sm',
    md: 'text-base font-black',
    lg: 'text-xl font-black',
    xl: 'text-3xl font-black',
  };

  const subtitleSizeMap = {
    sm: 'text-[8px] tracking-wider',
    md: 'text-[9px] tracking-widest',
    lg: 'text-[11px] tracking-widest',
    xl: 'text-xs tracking-widest',
  };

  if (variant === 'full') {
    const fullLogoSrc = lightText ? '/kushal-logo-darkbg.png' : '/kushal-logo.png';
    const fullHeightMap = {
      sm: 'h-9',
      md: 'h-12',
      lg: 'h-16',
      xl: 'h-24',
    };

    return (
      <div className={`inline-flex items-center ${className}`}>
        <img
          src={fullLogoSrc}
          alt="Kushal Hospitals"
          className={`${fullHeightMap[size]} w-auto object-contain transition-transform hover:scale-105`}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Official Emblem Icon */}
      <div
        className={`${sizeMap[size]} relative flex items-center justify-center rounded-2xl bg-white p-1 shadow-md shadow-slate-900/10 border border-slate-100 flex-shrink-0 transition-transform hover:scale-105 overflow-hidden`}
      >
        <img
          src="/kushal-emblem.png"
          alt="Kushal Hospitals Emblem"
          className="h-full w-full object-contain"
        />
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      </div>

      {showText && (
        <div className="flex flex-col select-none leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-display font-extrabold uppercase tracking-tight ${
                lightText ? 'text-white' : 'text-[#0f4c81]'
              } ${textSizeMap[size]}`}
            >
              Kushal Hospitals
            </span>
          </div>
          <span
            className={`font-bold uppercase mt-0.5 ${
              lightText ? 'text-teal-300' : 'text-slate-500'
            } ${subtitleSizeMap[size]}`}
          >
            Hospital Management System
          </span>
        </div>
      )}
    </div>
  );
}
