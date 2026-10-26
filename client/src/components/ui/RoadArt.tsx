import { m } from './motion';
import { LogoMark } from './Logo';

const PATH = 'M-10 168 C 70 168, 80 70, 170 84 S 280 168, 322 70';

/** A winding road that draws itself once on load, ending at a kilometre stone. */
export function RoadArt({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`} aria-hidden="true">
      <svg viewBox="0 0 400 200" className="size-full overflow-visible" preserveAspectRatio="xMidYMid meet">
        <path d={PATH} fill="none" stroke="var(--line-strong)" strokeWidth="30" strokeLinecap="butt" />
        <m.path
          d={PATH}
          fill="none"
          stroke="var(--raised)"
          strokeWidth="26"
          strokeLinecap="butt"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.3, ease: [0.25, 1, 0.5, 1] }}
        />
        <m.path
          d={PATH}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeDasharray="9 9"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        />
      </svg>
      <m.div
        className="absolute"
        style={{ left: '80.5%', top: '35%', translate: '-50% -100%' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.35 }}
      >
        <LogoMark className="size-11" />
      </m.div>
    </div>
  );
}
