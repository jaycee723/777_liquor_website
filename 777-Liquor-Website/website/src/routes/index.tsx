import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/')({ component: Home })

const trends = [
  ['TRENDING NOW', 'RTDs + ready-to-pour cocktails', 'Rotating drops that keep up with what is getting posted, shared, and talked about.'],
  ['LOCAL FAVORITES', 'Beer, spirits & Hawaii picks', 'A mix of familiar staples and new bottles worth checking the cooler for.'],
  ['NEW DROPS', 'Fresh arrivals every week', 'Our lineup changes constantly. What is here today may be gone tomorrow.'],
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

const popularBrands = [{name:'Heineken',category:'IMPORT BEER',logo:'/logos/777-brand-mark.svg'},{name:'Corona Extra',category:'IMPORT BEER',logo:'/logos/777-brand-mark.svg'},{name:'Modelo Especial',category:'IMPORT BEER',logo:'/logos/777-brand-mark.svg'},{name:'Coors Light',category:'DOMESTIC BEER',logo:'/logos/777-brand-mark.svg'},{name:'Coors Banquet',category:'DOMESTIC BEER',logo:'/logos/777-brand-mark.svg'},{name:'Bud Light',category:'DOMESTIC BEER',logo:'/logos/777-brand-mark.svg'},{name:'Budweiser',category:'DOMESTIC BEER',logo:'/logos/777-brand-mark.svg'},{name:'Michelob ULTRA',category:'DOMESTIC BEER',logo:'/logos/777-brand-mark.svg'},{name:'Miller Lite',category:'DOMESTIC BEER',logo:'/logos/777-brand-mark.svg'},{name:'Stella Artois',category:'IMPORT BEER',logo:'/logos/777-brand-mark.svg'},{name:'Guinness',category:'IMPORT BEER',logo:'/logos/777-brand-mark.svg'},{name:'Sapporo',category:'IMPORT BEER',logo:'/logos/777-brand-mark.svg'},{name:'Kona Brewing',category:'HAWAII BEER',logo:'/logos/777-brand-mark.svg'},{name:'Maui Brewing',category:'HAWAII BEER',logo:'/logos/777-brand-mark.svg'},{name:'White Claw',category:'HARD SELTZER',logo:'/logos/777-brand-mark.svg'},{name:'Truly',category:'HARD SELTZER',logo:'/logos/777-brand-mark.svg'},{name:'High Noon',category:'RTD',logo:'/logos/777-brand-mark.svg'},{name:'Twisted Tea',category:'RTD',logo:'/logos/777-brand-mark.svg'},{name:'Crown Royal',category:'WHISKY',logo:'/logos/777-brand-mark.svg'},{name:"Tito's Handmade Vodka",category:'VODKA',logo:'/logos/777-brand-mark.svg'},{name:'Don Julio',category:'TEQUILA',logo:'/logos/777-brand-mark.svg'},{name:'Casamigos',category:'TEQUILA',logo:'/logos/777-brand-mark.svg'},{name:'Patrón',category:'TEQUILA',logo:'/logos/777-brand-mark.svg'},{name:'Jameson',category:'IRISH WHISKEY',logo:'/logos/777-brand-mark.svg'},{name:'Fireball',category:'WHISKY',logo:'/logos/777-brand-mark.svg'},{name:'Smirnoff Ice',category:'RTD',logo:'/logos/777-brand-mark.svg'},{name:'Suntory -196',category:'RTD',logo:'/logos/777-brand-mark.svg'},{name:'Surfside',category:'RTD',logo:'/logos/777-brand-mark.svg'},{name:'Monaco Cocktails',category:'RTD',logo:'/logos/777-brand-mark.svg'}]

function Home() {
  const [showKeg, setShowKeg] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [selectedKegBrand, setSelectedKegBrand] = useState('')
  useEffect(() => { const root=document.querySelector('.brand-slider'); if(!root)return; const slides=Array.from(root.querySelectorAll('.brand-slide')); let current=0; const show=(i:number)=>{current=(i+slides.length)%slides.length; slides.forEach((x,n)=>x.classList.toggle('active',n===current))}; const timer=setInterval(()=>show(current+1),4200); root.querySelector('.next')?.addEventListener('click',()=>show(current+1)); root.querySelector('.prev')?.addEventListener('click',()=>show(current-1)); return()=>clearInterval(timer) }, [])

  return <main>
    <header className="nav"><a className="logo" href="#top">777<span>LIQUOR</span></a><nav><a href="#trending">Trending</a><a href="#beer">Beer</a><a href="#kegs">Kegs</a><a href="#visit">Visit</a></nav><a className="nav-cta" href="#kegs">Pre-order a keg</a></header>

    <section id="top" className="hero">
      <div className="hero-copy">
        <p className="eyebrow">HONOLULU • UNIVERSITY AREA • 21+</p>
        <h1>WHAT'S NEW<br/><em>IS THE</em> NEW THING.</h1>
        <p className="lead">777 Liquor keeps the shelves moving. Trendy RTDs, cocktails, beer and spirits that have been making noise online — plus the local favorites you already know.</p>
        <div className="actions"><a className="button" href="#trending">See what's trending <b>↓</b></a><a className="text-link" href="#kegs">Need a keg? →</a></div>
      </div>
      <div className="hero-card"><div className="orb">777</div><div><small>THE LINEUP</small><strong>ALWAYS<br/>CHANGING</strong><p>Come see what just landed.</p></div></div>
    </section>

    <section id="trending" className="section trends"><div className="section-head"><p className="eyebrow">THE 777 ROTATION</p><h2>Social-first. <span>Always moving.</span></h2><p>We watch what is trending, bring in products people are asking for, and rotate the lineup so there is always a reason to stop by.</p></div><div className="trend-grid">{trends.map(([label,title,desc],i)=><article className="trend" key={title}><div className="num">0{i+1}</div><p className="eyebrow">{label}</p><h3>{title}</h3><p>{desc}</p><div className="scan">CHECK THE COOLER <span>↗</span></div></article>)}</div></section>


    <section id="beer" className="popular section"><div className="section-head"><div><p className="eyebrow">POPULAR NOW • HAWAII</p><h2>What’s moving<br/><span>right now.</span></h2></div><p>Popular beer, RTDs, cocktails and spirits from the Hawaii distributor network. Brands and availability change with current inventory, allocations and market demand.</p></div><div className="brand-slider">{popularBrands.map((brand,i)=><article className={'brand-slide '+(i===0?'active':'')} key={brand.name}><div className="brand-meta"><span>{brand.category}</span><span>{String(i+1).padStart(2,'0')} / {String(popularBrands.length).padStart(2,'0')}</span></div><div className="brand-logo-wrap"><img src={brand.logo} alt={brand.name+' logo'}/></div><h3>{brand.name}</h3><p>Check in-store for current availability.</p></article>)}<button className="slider-arrow prev">←</button><button className="slider-arrow next">→</button></div></section>

    <section className="marquee"><div>NEW DROPS&nbsp; • &nbsp;RTDs&nbsp; • &nbsp;COCKTAILS&nbsp; • &nbsp;LOCAL FAVORITES&nbsp; • &nbsp;NEW DROPS&nbsp; • &nbsp;RTDs&nbsp; • &nbsp;COCKTAILS&nbsp; • &nbsp;LOCAL FAVORITES&nbsp; • &nbsp;</div></section>

    <section id="kegs" className="section keg-section"><div className="keg-copy"><p className="eyebrow">KEG PRE-ORDERS</p><h2>Planning a party?<br/><span>Lock in a keg.</span></h2><p>Order your keg in advance and pick it up on the scheduled morning. Keg inventory and pickup days vary by brand.</p><button className="button" onClick={() => setShowKeg(true)}>Start a keg pre-order <b>→</b></button></div><div className="rules"><div><b>01</b><strong>PAID IN ADVANCE</strong><p>The full keg cost must be paid in advance to secure your order.</p></div><div><b>02</b><strong>NO PUMP INCLUDED</strong><p>Kegs do not come with a pump. Pumps are available to rent for an additional charge.</p></div><div><b>03</b><strong>RETURN THE PUMP</strong><p>Rented pumps must be returned after use.</p></div><div><b>04</b><strong>WED + FRI PICKUP</strong><p>The selected brand automatically determines whether pickup is Wednesday morning or Friday morning.</p></div></div></section>

    <section className="pickup"><div><p className="eyebrow">KEG PICKUP CHART</p><h2>Know your<br/><span>pickup day.</span></h2><p>Your selected brand determines the pickup day. Wednesday morning and Friday morning orders follow the current brand schedule and inventory availability.</p></div><div className="day-grid"><div><span>WED</span><strong>WEDNESDAY</strong><small>Morning pickup</small></div><div><span>FRI</span><strong>FRIDAY</strong><small>Morning pickup</small></div></div></section>

    <section id="visit" className="visit"><p className="eyebrow">777 LIQUOR • HONOLULU, HAWAIʻI</p><h2>Come see what's<br/><span>new.</span></h2><p>We keep the lineup relevant, rotating, and worth checking in person. Stop by and see what just hit the shelves.</p><a className="button light" href="#top">Back to top ↑</a></section>

    {showKeg && <div className="modal-backdrop" onClick={() => setShowKeg(false)}><div className="modal" onClick={e => e.stopPropagation()}><button className="close" onClick={() => setShowKeg(false)}>×</button><p className="eyebrow">KEG PRE-ORDER</p><h2>Tell us what you need.</h2>{submitted ? <div className="success"><strong>Request received.</strong><p>We’ll use your request to confirm brand availability, pickup day, and pricing. Keg cost must be paid in advance to secure the order.</p><button className="button" onClick={() => setShowKeg(false)}>Close</button></div> : <form onSubmit={e => {e.preventDefault();setSubmitted(true)}}><label>Name<input required placeholder="Your name"/></label><label>Phone<input required type="tel" placeholder="(808) 555-0123"/></label><label>Brand<select required value={selectedKegBrand} onChange={e => setSelectedKegBrand(e.target.value)}><option value="">Select a brand</option>{kegBrands.map(x=><option key={x.name} value={x.name}>{x.name}</option>)}</select></label><label>Pickup day<select required value={kegBrands.find(x => x.name === selectedKegBrand)?.day || ''} disabled={!selectedKegBrand} aria-label="Pickup day determined by brand"><option value="">Select a brand first</option><option value="Wednesday">Wednesday morning</option><option value="Friday">Friday morning</option></select><small className="field-note">Pickup day is automatically determined by the brand selected. Wednesday = Wednesday-scheduled brands; Friday = Friday-scheduled brands.</small></label><label>Notes<textarea placeholder="Size, quantity, event date, or questions"/></label><p className="fine">Kegs are pickup only. Keg cost is due in advance. Pump rental is optional and charged separately; rented pumps must be returned. Pickup availability is subject to brand schedule.</p><button className="button" type="submit">Submit pre-order request →</button></form>}</div></div>}
    <footer><span>© 777 LIQUOR</span><span>HONOLULU • HAWAIʻI</span><span>21+ • DRINK RESPONSIBLY</span></footer>
  </main>
}
