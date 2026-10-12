const $ = id => document.getElementById(id);
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const pageSize = 48;
let items = [], page = 1;
export function filterItems(rows, search, category, brand, sort) {
  const q = search.trim().toLowerCase();
  return rows.filter(x => (!q || `${x.name} ${x.brand}`.toLowerCase().includes(q)) && (!category || x.category === category) && (!brand || x.brand === brand)).sort((a,b) => (sort === 'low' ? a.price-b.price : sort === 'high' ? b.price-a.price : 0) || a.name.localeCompare(b.name));
}
function text(tag, value) { const e = document.createElement(tag); e.textContent = value; return e; }
function render() {
  const rows = filterItems(items, $('search').value, $('category').value, $('brand').value, $('sort').value);
  const pages = Math.max(1, Math.ceil(rows.length/pageSize)); page = Math.min(page,pages);
  const frag = document.createDocumentFragment();
  for (const x of rows.slice((page-1)*pageSize,page*pageSize)) {
    const card = document.createElement('article');
    card.append(text('small', `${x.category} · ${x.brand}`), text('h2', x.name));
    const price = text('p', money.format(x.price)); price.className='price'; card.append(price, text('small', 'Catalog price · availability unverified')); frag.append(card);
  }
  $('products').replaceChildren(frag); $('status').textContent=rows.length ? `${rows.length} matching products` : 'No matching products. Try another search or filter.';
  $('page').textContent=`Page ${page} of ${pages}`; $('prev').disabled=page<=1; $('next').disabled=page>=pages;
}
for (const id of ['search','category','brand','sort']) $(id).addEventListener(id==='search' ? 'input' : 'change', () => {page=1;render();});
$('prev').addEventListener('click',()=>{page--;render();}); $('next').addEventListener('click',()=>{page++;render();});
async function load() {
  try {
    const response = await fetch('./catalog.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Catalog HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.items)) throw new Error('Invalid catalog');
    items = data.items.filter(x => typeof x.name==='string' && typeof x.brand==='string' && ['Beer','RTD','Beverages'].includes(x.category) && typeof x.price==='number' && Number.isFinite(x.price) && x.price>0);
    if (!items.length) throw new Error('Empty catalog');
    for (const brand of [...new Set(items.map(x=>x.brand))].sort()) { const o = text('option',brand); o.value=brand; $('brand').append(o); }
    $('notice').textContent=`Catalog snapshot: ${data.sourceDate || 'date unverified'}. Prices, stock and cooler placement are not verified live. Call (808) 744-9568 to confirm. Alcohol purchases are for adults 21+.`;
    render();
  } catch (error) {
    console.error(error); $('status').textContent='The catalog is not available yet. Please call (808) 744-9568 for current products and prices.';
  }
}
load();
