import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { KegRequestForm } from '../components/KegRequestForm'
import '../home-refresh.css'

export const Route = createFileRoute('/')({ component: Home })

const trends = [
  ['Ready to enjoy', 'Cocktails, without the prep', 'Explore ready-to-drink options for your next get-together. Ask us about current flavors and availability.'],
  ['Beer & spirits', 'The familiar and the local', 'Browse familiar brands and Hawaii favorites. We are happy to help you find an option that fits the occasion.'],
  ['Something different', 'Your next favorite', 'Curious about a different bottle or drink? Come take a look and ask what is currently on the shelves.'],
]

const kegBrands = [
  { name: 'Bud Light', day: 'Wednesday' },
  { name: 'Budweiser', day: 'Wednesday' },
  { name: 'Michelob ULTRA', day: 'Wednesday' },
  { name: 'Busch', day: 'Wednesday' },
  { name: 'Busch Light', day: 'Wednesday' },
  { name: 'Natural Light', day: 'Wednesday' },
  { name: 'Rolling Rock', day: 'Wednesday' },
  { name: 'Stella Artois', day: 'Wednesday' },
  { name: 'Kona Big Wave', day: 'Wednesday' },
  { name: 'Kona Longboard', day: 'Wednesday' },
  { name: 'Kona Hanalei Island IPA', day: 'Wednesday' },
  { name: 'Kona Castaway IPA', day: 'Wednesday' },
  { name: 'Aloha Beer Co.', day: 'Wednesday' },
  { name: 'Coors Light', day: 'Friday' },
  { name: 'Coors Banquet', day: 'Friday' },
  { name: 'Miller Lite', day: 'Friday' },
  { name: 'Modelo Especial', day: 'Friday' },
  { name: 'Corona Extra', day: 'Friday' },
  { name: 'Pacifico', day: 'Friday' },
  { name: 'Dos Equis Lager', day: 'Friday' },
  { name: 'Heineken', day: 'Friday' },
  { name: 'Guinness', day: 'Friday' },
  { name: 'Sapporo', day: 'Friday' },
  { name: 'Asahi Super Dry', day: 'Friday' },
  { name: 'KIRIN ICHIBAN', day: 'Friday' },
  { name: 'Pabst Blue Ribbon', day: 'Friday' },
  { name: 'Sierra Nevada Pale Ale', day: 'Friday' },
  { name: 'Other import/domestic brands — ask in store', day: '' },
]

const popularBrands = [{name:'Heineken',category:'Import beer'},{name:'Corona Extra',category:'Import beer'},{name:'Modelo Especial',category:'Import beer'},{name:'Coors Light',category:'Domestic beer'},{name:'Coors Banquet',category:'Domestic beer'},{name:'Bud Light',category:'Domestic beer'},{name:'Budweiser',category:'Domestic beer'},{name:'Michelob ULTRA',category:'Domestic beer'},{name:'Miller Lite',category:'Domestic beer'},{name:'Stella Artois',category:'Import beer'},{name:'Guinness',category:'Import beer'},{name:'Sapporo',category:'Import beer'},{name:'Kona Brewing',category:'Hawaii beer'},{name:'Maui Brewing',category:'Hawaii beer'},{name:'White Claw',category:'Hard seltzer'},{name:'Truly',category:'Hard seltzer'},{name:'High Noon',category:'Ready-to-drink'},{name:'Twisted Tea',category:'Ready-to-drink'},{name:'Crown Royal',category:'Whisky'},{name:"Tito's Handmade Vodka",category:'Vodka'},{name:'Don Julio',category:'Tequila'},{name:'Casamigos',category:'Tequila'},{name:'Patrón',category:'Tequila'},{name:'Jameson',category:'Irish whiskey'},{name:'Fireball',category:'Whisky'},{name:'Smirnoff Ice',category:'Ready-to-drink'},{name:'Suntory -196',category:'Ready-to-drink'},{name:'Surfside',category:'Ready-to-drink'},{name:'Monaco Cocktails',category:'Ready-to-drink'}]

function Home() {
  const [showKeg, setShowKeg] = useState(false)
  const [motionPaused, setMotionPaused] = useState(false)
  const [brandIndex, setBrandIndex] = useState(0)
  const [carouselPaused, setCarouselPaused] = useState(false)

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let timer: ReturnType<typeof setInterval> | undefined
    const stop = () => { if (timer !== undefined) clearInterval(timer); timer = undefined }
    const start = () => {
      stop()
      if (!motionPaused && !carouselPaused && !preference.matches && !document.hidden) {
        timer = setInterval(() => setBrandIndex(index => (index + 1) % popularBrands.length), 8000)
      }
    }
    start()
    preference.addEventListener('change', start)
    document.addEventListener('visibilitychange', start)
    return () => { stop(); preference.removeEventListener('change', start); document.removeEventListener('visibilitychange', start) }
  }, [motionPaused, carouselPaused])

  useEffect(() => {
    if (!showKeg) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setShowKeg(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showKeg])

  return <main className={'store-refresh' + (motionPaused ? ' motion-paused' : '')}>
    <a className="skip-link" href="#top">Skip to content</a>
    <header className="nav"><a className="logo" href="#top">777<span>LIQUOR</span></a><nav aria-label="Main navigation"><a href="#trending">Selection</a><a href="#beer">Brands</a><a href="#kegs">Kegs</a><a href="#visit">Visit</a></nav><a className="nav-cta" href="#kegs">Keg inquiries</a></header>

    <section id="top" tabIndex={-1} className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Honolulu · University area · 21+</p>
        <h1>Your neighborhood<br/><em>stop for good drinks.</em></h1>
        <p className="lead">From a familiar favorite to something new, explore beer, spirits and ready-to-drink cocktails at 777 Liquor in Honolulu. Planning a gathering? Ask us about a keg.</p>
        <div className="actions"><a className="button" href="#trending">Explore the selection <b>↓</b></a><a className="text-link" href="#kegs">Ask about a keg →</a></div>
      </div>
      <div className="hero-card beverage-scene">
        <svg viewBox="0 0 420 330" width="420" height="330" aria-hidden="true" focusable="false">
          <ellipse cx="210" cy="295" rx="165" ry="15" fill="#12494a" opacity=".10"/>
          <g className="drink-float bottle"><rect x="180" y="30" width="32" height="24" rx="5" fill="#12494a"/><path d="M184 54h24v48l25 30v129q0 14-14 14h-48q-14 0-14-14V132l27-30z" fill="#2a8f8f"/><rect x="157" y="153" width="76" height="77" rx="7" fill="#fffaf0"/><text x="195" y="197" textAnchor="middle" fill="#12494a" fontSize="11" fontWeight="700">SPIRITS</text></g>
          <g className="drink-float beer"><rect x="56" y="124" width="83" height="151" rx="17" fill="#e0a458"/><ellipse cx="97" cy="128" rx="39" ry="8" fill="#f6e2bd"/><path d="M66 177h63v63H66z" fill="#fffaf0"/><text x="97" y="213" textAnchor="middle" fill="#12494a" fontSize="15" fontWeight="700">BEER</text></g>
          <g className="drink-float rtd"><rect x="265" y="138" width="78" height="137" rx="16" fill="#d9795b"/><ellipse cx="304" cy="142" rx="36" ry="8" fill="#f5c7af"/><circle cx="304" cy="210" r="27" fill="#fffaf0"/><text x="304" y="215" textAnchor="middle" fill="#12494a" fontSize="15" fontWeight="700">RTD</text></g>
        </svg>
        <p className="scene-note">Beer. Spirits. Ready-to-drink.</p>
        <button type="button" className="motion-control" aria-pressed={motionPaused} onClick={() => setMotionPaused(value => !value)}>{motionPaused ? 'Resume animations' : 'Pause animations'}</button>
      </div>
    </section>

    <section id="trending" className="section trends"><div className="section-head"><p className="eyebrow">Something for every occasion</p><h2>Find a favorite.<br/><span>Try something new.</span></h2><p>Keeping it simple: beer for the cooler, a bottle to share, or a ready-to-drink cocktail. Stop by or get in touch to check what is available.</p></div><div className="trend-grid">{trends.map(([label,title,desc],i)=><article className="trend" key={title}><div className="num">0{i+1}</div><p className="eyebrow">{label}</p><h3>{title}</h3><p>{desc}</p><div className="scan">Explore in store <span>↗</span></div></article>)}</div></section>

    <section id="beer" className="popular section"><div className="section-head"><div><p className="eyebrow">Beer, spirits & ready-to-drink</p><h2>Familiar names.<br/><span>Fresh possibilities.</span></h2></div><p>Explore some brands to ask about. Selection and availability vary, so please check with us before making a special trip.</p></div><div className="brand-slider" role="region" aria-label="Explore brands" aria-roledescription="carousel" onMouseEnter={() => setCarouselPaused(true)} onMouseLeave={e => { if (!e.currentTarget.contains(document.activeElement)) setCarouselPaused(false) }} onFocusCapture={() => setCarouselPaused(true)}>{popularBrands.map((brand,i)=><article className={'brand-slide' + (i===brandIndex ? ' active' : '')} key={brand.name} aria-hidden={i!==brandIndex}><div className="brand-meta"><span>{brand.category}</span><span>{String(i+1).padStart(2,'0')} / {String(popularBrands.length).padStart(2,'0')}</span></div><div className="brand-logo-wrap"><h3 className="brand-wordmark">{brand.name}</h3></div><p>Ask us about current availability.</p></article>)}<button type="button" className="slider-arrow prev" aria-label="Previous brand" onClick={() => { setCarouselPaused(true); setBrandIndex(index => (index - 1 + popularBrands.length) % popularBrands.length) }}>←</button><button type="button" className="slider-arrow next" aria-label="Next brand" onClick={() => { setCarouselPaused(true); setBrandIndex(index => (index + 1) % popularBrands.length) }}>→</button><button type="button" className="carousel-control" aria-pressed={carouselPaused} onClick={() => setCarouselPaused(value => !value)}>{carouselPaused ? 'Resume brand rotation' : 'Pause brand rotation'}</button></div></section>

    <div className="store-note">Honolulu, Hawaii · Beer, spirits & ready-to-drink cocktails · Keg inquiries welcome</div>

    <section id="kegs" className="section keg-section"><div className="keg-copy"><p className="eyebrow">Keg inquiries</p><h2>Good company.<br/><span>We can help with the keg.</span></h2><p>Tell us which brand you have in mind and we will follow up to confirm availability, pricing and pickup.</p><button type="button" className="button" onClick={() => setShowKeg(true)}>Send a keg inquiry <b>→</b></button></div><div className="rules"><div><b>01</b><strong>Paid in advance</strong><p>The full keg cost must be paid in advance to secure your order.</p></div><div><b>02</b><strong>Need a pump?</strong><p>A pump is not included with the keg. Ask about renting one for an additional charge.</p></div><div><b>03</b><strong>Return after use</strong><p>Please return your rented pump after your gathering.</p></div><div><b>04</b><strong>Your pickup day</strong><p>The brand schedule determines Wednesday or Friday morning pickup. We will confirm it with you.</p></div></div></section>

    <section className="pickup"><div><p className="eyebrow">Plan your pickup</p><h2>A simple schedule.<br/><span>A little planning.</span></h2><p>Choose a brand in the inquiry form to see its scheduled pickup day. Pickup depends on availability and confirmation from our team.</p></div><div className="day-grid"><div><span>WED</span><strong>Wednesday</strong><small>Morning pickup</small></div><div><span>FRI</span><strong>Friday</strong><small>Morning pickup</small></div></div></section>

    <section id="visit" className="visit"><p className="eyebrow">777 Liquor · Honolulu, Hawaiʻi</p><h2>Come on by.<br/><span>Find something you like.</span></h2><p>Shopping for the weekend, bringing something to a gathering, or curious about a brand? We would love to help. Email us with questions or visit us in Honolulu.</p><a className="button light" href="mailto:777liquorstorehi@gmail.com">Get in touch →</a></section>

    {showKeg && <div className="modal-backdrop" onClick={() => setShowKeg(false)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="keg-title" onClick={e => e.stopPropagation()}><button type="button" autoFocus aria-label="Close keg inquiry" className="close" onClick={() => setShowKeg(false)}>×</button><p className="eyebrow">Keg inquiry</p><h2 id="keg-title">Let’s plan your keg.</h2><KegRequestForm brands={kegBrands} siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || ''} onClose={() => setShowKeg(false)} /></div></div>}
    <footer><span>© 777 LIQUOR</span><span>HONOLULU · HAWAIʻI</span><span>21+ · DRINK RESPONSIBLY</span></footer>
  </main>
}
