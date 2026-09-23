/**
 * Hero backdrop: drifting colour fields over deep navy, a faint blueprint
 * grid, and an architectural outline that draws itself in.
 *
 * Deliberately photo-free — the company's own photos are mostly interiors, and
 * a gradient carries the "we draw it, then we build it" idea better than a
 * kitchen does. Pure CSS and SVG: no JavaScript, nothing to download, and it
 * holds up at any screen size.
 */
export function HeroBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-ink">
      {/* Drifting colour fields */}
      <div
        className="hero-blob absolute -left-[12%] -top-[18%] h-[72vw] w-[72vw] rounded-full opacity-90 blur-[90px]"
        style={{
          background: 'radial-gradient(circle, rgba(242,181,68,.55) 0%, rgba(217,119,6,.18) 45%, rgba(242,181,68,0) 72%)',
          animationName: 'drift-a',
        }}
      />
      <div
        className="hero-blob absolute -right-[8%] top-[2%] h-[64vw] w-[64vw] rounded-full opacity-90 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, rgba(70,130,220,.55) 0%, rgba(40,80,160,.18) 45%, rgba(56,110,190,0) 72%)',
          animationName: 'drift-b',
          animationDuration: '32s',
        }}
      />
      <div
        className="hero-blob absolute bottom-[-22%] left-[22%] h-[58vw] w-[58vw] rounded-full opacity-75 blur-[110px]"
        style={{
          background: 'radial-gradient(circle, rgba(201,138,28,.5) 0%, rgba(201,138,28,0) 70%)',
          animationName: 'drift-c',
          animationDuration: '38s',
        }}
      />

      {/* Blueprint grid */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, #000 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, #000 30%, transparent 75%)',
        }}
      />

      {/* Architectural outline, drawn on load */}
      <svg
        viewBox="0 0 520 420"
        className="absolute bottom-0 right-[-6%] h-[82%] w-auto max-w-[62%] opacity-80 md:right-[3%]"
        fill="none"
        stroke="#f2b544"
        strokeWidth="1.35"
        strokeLinejoin="round"
      >
        {/* ground line */}
        <line x1="10" y1="400" x2="510" y2="400" className="hero-draw" style={{ ['--dash' as string]: 500, animationDelay: '.2s' }} strokeOpacity=".55" />

        {/* tower */}
        <rect x="150" y="90" width="150" height="310" className="hero-draw" style={{ ['--dash' as string]: 920, animationDelay: '.45s' }} />
        {[140, 190, 240, 290, 340].map((y, i) => (
          <line key={y} x1="150" y1={y} x2="300" y2={y} className="hero-draw" strokeOpacity=".45"
            style={{ ['--dash' as string]: 150, animationDelay: `${0.8 + i * 0.12}s` }} />
        ))}
        <line x1="225" y1="90" x2="225" y2="400" className="hero-draw" strokeOpacity=".3" style={{ ['--dash' as string]: 310, animationDelay: '1.3s' }} />

        {/* roof + mast */}
        <polyline points="150,90 225,45 300,90" className="hero-draw" style={{ ['--dash' as string]: 180, animationDelay: '1.5s' }} />
        <line x1="225" y1="45" x2="225" y2="18" className="hero-draw" style={{ ['--dash' as string]: 30, animationDelay: '1.8s' }} />

        {/* lower wing */}
        <rect x="300" y="240" width="130" height="160" className="hero-draw" strokeOpacity=".6" style={{ ['--dash' as string]: 580, animationDelay: '1.0s' }} />
        {[285, 330].map((y, i) => (
          <line key={y} x1="300" y1={y} x2="430" y2={y} className="hero-draw" strokeOpacity=".35"
            style={{ ['--dash' as string]: 130, animationDelay: `${1.45 + i * 0.12}s` }} />
        ))}

        {/* left annex */}
        <rect x="58" y="300" width="92" height="100" className="hero-draw" strokeOpacity=".5" style={{ ['--dash' as string]: 384, animationDelay: '1.2s' }} />

        {/* dimension marks, the blueprint tell */}
        <line x1="58" y1="418" x2="430" y2="418" className="hero-draw" strokeOpacity=".3" style={{ ['--dash' as string]: 372, animationDelay: '2s' }} />
        <line x1="58" y1="412" x2="58" y2="424" className="hero-draw" strokeOpacity=".3" style={{ ['--dash' as string]: 12, animationDelay: '2.1s' }} />
        <line x1="430" y1="412" x2="430" y2="424" className="hero-draw" strokeOpacity=".3" style={{ ['--dash' as string]: 12, animationDelay: '2.1s' }} />
      </svg>

      {/* Light rising off the skyline */}
      <div
        className="hero-sweep pointer-events-none absolute inset-x-0 bottom-0 h-[40%]"
        style={{
          background: 'linear-gradient(to top, rgba(242,181,68,.18), transparent)',
          animation: 'sweep 9s ease-in-out infinite',
        }}
      />

      {/* Keeps the copy readable over everything above */}
      <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(11,18,32,.88)_0%,rgba(11,18,32,.55)_42%,rgba(11,18,32,.2)_70%,rgba(11,18,32,.75)_100%)]" />
    </div>
  );
}
