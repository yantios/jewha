import React, { useEffect, useMemo, useState } from 'react'
import { Routes, Route, Link, NavLink, useNavigate, useParams, useLocation } from 'react-router-dom'
import { Search, Home, Compass, Bookmark, History, BookOpen, ChevronRight, Star, Clock3, ArrowLeft, ArrowUpDown, Heart, Menu, X, AlertCircle, RefreshCw } from 'lucide-react'
import { getLatest, getTop, getManga, getChapter, searchManga, normalizeManga } from './api'

const readStore = (key) => { try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] } }
const writeStore = (key, value) => localStorage.setItem(key, JSON.stringify(value))
function useSaved(key) {
  const [items, setItems] = useState(() => readStore(key))
  const save = (next) => { setItems(next); writeStore(key, next) }
  return [items, save]
}
function Cover({ manga, className = '' }) {
  return <div className={`cover ${className}`}>
    {manga.cover ? <img src={manga.cover} alt={`Cover ${manga.title}`} loading="lazy" onError={e => { e.currentTarget.style.display = 'none' }} /> : <div className="cover-fallback"><BookOpen size={28}/><span>{manga.title}</span></div>}
  </div>
}
function Skeletons({ count = 8 }) { return <div className="manga-grid">{Array.from({length:count}, (_,i)=><div className="skeleton-card" key={i}><div className="skeleton-cover shimmer"/><div className="skeleton-line shimmer"/><div className="skeleton-line short shimmer"/></div>)}</div> }
function Empty({ title, detail }) { return <div className="empty"><BookOpen size={28}/><strong>{title}</strong><span>{detail}</span></div> }
function ErrorNotice({ error, retry }) { return <div className="error-notice"><AlertCircle size={18}/><div><strong>Data belum bisa dimuat</strong><p>{error || 'Periksa koneksi atau API.'}</p><button className="text-button" onClick={retry}><RefreshCw size={14}/> Coba lagi</button></div></div> }
function MangaCard({ item, onBookmark, bookmarked }) {
  const m = normalizeManga(item)
  return <article className="manga-card">
    <Link to={`/manga/${m.id}`} className="cover-link"><Cover manga={m}/><span className="cover-rating"><Star size={12} fill="currentColor"/> {m.rating ? m.rating.toFixed(1) : '—'}</span></Link>
    <div className="card-copy"><Link to={`/manga/${m.id}`} className="card-title">{m.title}</Link><div className="card-meta">{m.latest ? `Chapter ${m.latest}` : 'Lihat detail'}</div></div>
    <button className={`bookmark-mini ${bookmarked ? 'active' : ''}`} aria-label="Bookmark" onClick={() => onBookmark(m)}><Heart size={16} fill={bookmarked ? 'currentColor' : 'none'}/></button>
  </article>
}
function App() {
  const [bookmarks, setBookmarks] = useSaved('jelanwha-bookmarks')
  const [history, setHistory] = useSaved('jelanwha-history')
  const [mobileMenu, setMobileMenu] = useState(false)
  const location = useLocation()
  const isSaved = id => bookmarks.some(x => (x.manga_id || x.id) === id)
  const toggleBookmark = m => {
    const id = m.manga_id || m.id
    if (isSaved(id)) setBookmarks(bookmarks.filter(x => (x.manga_id || x.id) !== id))
    else setBookmarks([{ manga_id: id, title: m.title, cover_portrait_url: m.cover || m.cover_portrait_url || m.cover_image_url, user_rate: m.rating || m.user_rate, latest_chapter_number: m.latest || m.latest_chapter_number }, ...bookmarks])
  }
  useEffect(() => { setMobileMenu(false); window.scrollTo({top:0, behavior:'smooth'}) }, [location.pathname])
  const nav = [
    {to:'/', label:'Home', icon:Home, end:true},
    {to:'/explore', label:'Explore', icon:Compass},
    {to:'/bookmarks', label:'Bookmark', icon:Bookmark},
    {to:'/history', label:'Riwayat', icon:History}
  ]
  return <div className="app-shell">
    <header className="topbar">
      <Link to="/" className="brand"><span className="brand-mark">J</span><span>Jelan<span className="brand-accent">Wha</span></span></Link>
      <nav className="desktop-nav">{nav.map(n=><NavLink key={n.to} to={n.to} end={n.end} className={({isActive})=>`nav-link ${isActive?'selected':''}`}><n.icon size={17}/>{n.label}</NavLink>)}</nav>
      <Link to="/explore" className="header-search"><Search size={17}/><span>Cari manhwa...</span><kbd>/</kbd></Link>
      <button className="menu-toggle" onClick={()=>setMobileMenu(!mobileMenu)} aria-label="Buka menu">{mobileMenu?<X/>:<Menu/>}</button>
    </header>
    {mobileMenu && <div className="mobile-menu">{nav.map(n=><NavLink key={n.to} to={n.to} end={n.end} className="mobile-menu-link"><n.icon size={18}/>{n.label}</NavLink>)}</div>}
    <main className="main-content"><Routes>
      <Route path="/" element={<HomePage onBookmark={toggleBookmark} isSaved={isSaved}/>} />
      <Route path="/explore" element={<ExplorePage onBookmark={toggleBookmark} isSaved={isSaved}/>} />
      <Route path="/manga/:id" element={<DetailPage onBookmark={toggleBookmark} isSaved={isSaved} onRead={m=>{const next=[m,...history.filter(x=>x.id!==m.id)].slice(0,30);setHistory(next)}}/>} />
      <Route path="/read/:id" element={<ReaderPage onRead={m=>{const next=[m,...history.filter(x=>x.id!==m.id)].slice(0,30);setHistory(next)}}/>} />
      <Route path="/bookmarks" element={<SavedPage title="Bookmark" subtitle="Manhwa yang kamu simpan" items={bookmarks} onBookmark={toggleBookmark} isSaved={isSaved} empty="Belum ada bookmark" detail="Tekan ikon hati pada manhwa untuk menyimpannya."/>} />
      <Route path="/history" element={<SavedPage title="Riwayat baca" subtitle="Lanjutkan bacaan terakhirmu" items={history} onBookmark={toggleBookmark} isSaved={isSaved} empty="Belum ada riwayat" detail="Manhwa yang kamu buka akan muncul di sini."/>} />
      <Route path="*" element={<Empty title="Halaman tidak ditemukan" detail="Coba kembali ke halaman utama."/>}/>
    </Routes></main>
    <footer className="footer"><span className="brand small"><span className="brand-mark">J</span>Jelan<span className="brand-accent">Wha</span></span><span>Temukan cerita, satu chapter setiap kali.</span></footer>
    <nav className="bottom-nav">{nav.map(n=><NavLink key={n.to} to={n.to} end={n.end} className={({isActive})=>`bottom-link ${isActive?'selected':''}`}><n.icon size={20}/><span>{n.label}</span></NavLink>)}</nav>
  </div>
}
function SectionHeading({title, subtitle, to, link='Lihat semua'}) {
  return <div className="section-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{to && <Link to={to} className="section-link">{link}<ChevronRight size={16}/></Link>}</div>
}
function HomePage({onBookmark,isSaved}) {
  const [popular,setPopular]=useState([]), [latest,setLatest]=useState([]), [loading,setLoading]=useState(true), [error,setError]=useState('')
  const load=async()=>{setLoading(true);setError('');try{const [a,b]=await Promise.all([getTop(),getLatest()]);setPopular(a);setLatest(b)}catch(e){setError(e.message)}finally{setLoading(false)}}
  useEffect(()=>{load()},[])
  const featured=popular[0] ? normalizeManga(popular[0]) : null
  return <div className="page-stack">
    <section className="hero">
      <div className="hero-content"><span className="eyebrow"><span className="pulse-dot"/> RUANG BACA KAMU</span><h1>Cerita bagus,<br/><em>mood bagus.</em></h1><p>Temukan dunia baru lewat cerita yang kamu suka. Santai saja, baca sesuai ritmemu.</p><Link to="/explore" className="primary-button">Jelajahi manhwa <ChevronRight size={17}/></Link></div>
      <div className="hero-art"><div className="orb orb-one"/><div className="orb orb-two"/><div className="hero-book"><BookOpen size={54} strokeWidth={1.2}/><span>YOUR NEXT<br/>FAVORITE</span></div><span className="spark spark-a">✦</span><span className="spark spark-b">✧</span></div>
    </section>
    {error && <ErrorNotice error={error} retry={load}/>}
    <section><SectionHeading title="Lagi populer" subtitle="Cerita yang sedang ramai dibaca" to="/explore"/>{loading?<Skeletons count={6}/>:<div className="manga-grid">{popular.slice(0,6).map((m,i)=><MangaCard key={m.manga_id||i} item={m} onBookmark={onBookmark} bookmarked={isSaved(m.manga_id)}/>)}</div>}{!loading&&!popular.length&&!error&&<Empty title="Belum ada katalog" detail="API belum mengembalikan daftar manhwa."/ >}</section>
    <section><SectionHeading title="Update terbaru" subtitle="Lihat chapter yang baru ditambahkan" to="/explore"/>{loading?<Skeletons count={6}/>:<div className="manga-grid">{latest.slice(0,12).map((m,i)=><MangaCard key={m.manga_id||i} item={m} onBookmark={onBookmark} bookmarked={isSaved(m.manga_id)}/>)}</div>}{!loading&&!latest.length&&!error&&<Empty title="Belum ada update" detail="Coba lagi nanti."/ >}</section>
  </div>
}
function ExplorePage({onBookmark,isSaved}) {
  const [query,setQuery]=useState(''), [items,setItems]=useState([]), [loading,setLoading]=useState(true), [error,setError]=useState(''), [sort,setSort]=useState('popular'), [genre,setGenre]=useState('Semua genre')
  const load=async(q='')=>{setLoading(true);setError('');try{const data=q.trim()?await searchManga(q):await getLatest();setItems(data)}catch(e){setError(e.message);setItems([])}finally{setLoading(false)}}
  useEffect(()=>{const t=setTimeout(()=>load(query),280);return()=>clearTimeout(t)},[query])
  const genres=useMemo(()=>['Semua genre',...new Set(items.flatMap(x=>normalizeManga(x).genres))],[items])
  const filtered=useMemo(()=>items.filter(x=>genre==='Semua genre'||normalizeManga(x).genres.includes(genre)).sort((a,b)=>sort==='rating'?Number(b.user_rate||0)-Number(a.user_rate||0):sort==='title'?String(a.title).localeCompare(String(b.title)):Number(b.view_count||0)-Number(a.view_count||0)),[items,genre,sort])
  return <div className="page-stack"><div className="page-intro"><span className="eyebrow">KATALOG</span><h1>Jelajahi cerita</h1><p>Cari judul, temukan genre, lalu mulai petualangan baru.</p></div>
    <div className="explore-search"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari judul manhwa..." aria-label="Cari judul manhwa"/>{query&&<button onClick={()=>setQuery('')} aria-label="Hapus pencarian"><X size={17}/></button>}</div>
    <div className="filters"><div className="filter-group"><label>Genre</label><select value={genre} onChange={e=>setGenre(e.target.value)}><option>Semua genre</option>{genres.filter(g=>g!=='Semua genre').map(g=><option key={g}>{g}</option>)}</select></div><div className="filter-group"><label><ArrowUpDown size={13}/> Urutkan</label><select value={sort} onChange={e=>setSort(e.target.value)}><option value="popular">Popularitas</option><option value="rating">Rating tertinggi</option><option value="title">Judul A–Z</option></select></div><span className="results-count">{filtered.length} judul</span></div>
    {error&&<ErrorNotice error={error} retry={()=>load(query)}/>}
    {loading?<Skeletons count={12}/>:filtered.length?<div className="manga-grid">{filtered.map((m,i)=><MangaCard key={m.manga_id||i} item={m} onBookmark={onBookmark} bookmarked={isSaved(m.manga_id)}/>)}</div>:!error&&<Empty title="Tidak ada hasil" detail="Coba kata kunci atau filter genre lain."/>}
  </div>
}
function DetailPage({onBookmark,isSaved,onRead}) {
  const {id}=useParams(), [data,setData]=useState(null), [loading,setLoading]=useState(true), [error,setError]=useState('')
  const load=()=>{setLoading(true);setError('');getManga(id).then(setData).catch(e=>setError(e.message)).finally(()=>setLoading(false))}
  useEffect(()=>{load()},[id])
  if(loading)return <div className="detail-loading"><div className="skeleton-cover shimmer"/><div><div className="skeleton-line shimmer"/><div className="skeleton-line shimmer"/><div className="skeleton-line short shimmer"/></div>
  if(error)return <ErrorNotice error={error} retry={load}/>
  const raw=data?.data || data, m=normalizeManga(raw||{}), chapters=raw?.chapters||[]
  const mark={...raw, id:m.id, cover:m.cover, rating:m.rating, latest:m.latest}
  return <div className="page-stack">
    <Link to="/explore" className="back-link"><ArrowLeft size={16}/> Kembali ke explore</Link>
    <section className="detail-panel"><Cover manga={m} className="detail-cover"/><div className="detail-info"><span className="eyebrow">DETAIL MANHWA</span><h1>{m.title}</h1><div className="detail-stats"><span><Star size={15} fill="currentColor"/> {m.rating?m.rating.toFixed(1):'Belum ada rating'}</span><span><BookOpen size={15}/> {raw?.total_chapters || chapters.length || '—'} chapter</span><span><span className="status-dot"/>{m.status}</span></div><div className="genre-list">{m.genres.map(g=><span key={g} className="genre-chip">{g}</span>)}</div><p className="synopsis">{m.description||'Sinopsis belum tersedia dari sumber data.'}</p><div className="detail-actions"><button className="primary-button" disabled={!chapters.length} onClick={()=>{onRead(m);if(chapters[0]?.chapter_id)window.location.href=`/read/${chapters[chapters.length-1].chapter_id}`}}>Mulai membaca <BookOpen size={16}/></button><button className={`outline-button ${isSaved(m.id)?'saved':''}`} onClick={()=>onBookmark(mark)}><Heart size={16} fill={isSaved(m.id)?'currentColor':'none'}/>{isSaved(m.id)?'Tersimpan':'Bookmark'}</button></div></div></section>
    <section><SectionHeading title="Daftar chapter" subtitle={`${chapters.length} chapter tersedia`}/>{chapters.length?<div className="chapter-list">{chapters.map((c,i)=><Link to={`/read/${c.chapter_id}`} key={c.chapter_id||i} className="chapter-row"><div className="chapter-icon"><BookOpen size={17}/></div><div className="chapter-name"><strong>{c.chapter_title||`Chapter ${c.chapter_number}`}</strong><span>{c.release_date||'Tanggal rilis tidak tersedia'}</span></div><span className="chapter-number">Ch. {c.chapter_number}</span><ChevronRight size={16}/></Link>)}</div>:<Empty title="Chapter belum tersedia" detail="Sumber API tidak mengembalikan daftar chapter untuk judul ini."/>}</section>
  </div>
}
function ReaderPage({onRead}) {
  const {id}=useParams(), [data,setData]=useState(null), [loading,setLoading]=useState(true), [error,setError]=useState('')
  useEffect(()=>{setLoading(true);setError('');getChapter(id).then(p=>{const d=p?.data||p;setData(d);onRead({id:d.manga_id,title:d.manga_title||'Manhwa',cover:d.cover_image_url||''})}).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[id])
  const images=data?.images || (data?.chapter?.data||[]).map(x=>`${data.base_url||'https://assets.shngm.id'}${data.chapter?.path||''}${x}`)
  return <div className="reader-page"><div className="reader-top"><Link to={data?.manga_id?`/manga/${data.manga_id}`:'/explore'} className="back-link"><ArrowLeft size={16}/> Detail</Link><div><strong>{data?.chapter_title||`Chapter ${data?.chapter_number||''}`}</strong><span>{images.length} halaman</span></div></div>
    {loading?<div className="reader-skeleton">{Array.from({length:3},(_,i)=><div className="shimmer" key={i}/>)}</div>:error?<ErrorNotice error={error} retry={()=>getChapter(id).then(p=>setData(p?.data||p)).catch(e=>setError(e.message))}/>:images.length?<div className="reader-images">{images.map((src,i)=><img key={`${src}-${i}`} src={src} alt={`Halaman ${i+1}`} loading={i<2?'eager':'lazy'}/>)}</div>:<Empty title="Gambar chapter tidak tersedia" detail="Sumber tidak mengembalikan gambar untuk chapter ini."/>}
    {!loading&&data&&<div className="reader-bottom">{data.prev_chapter_id?<Link className="outline-button" to={`/read/${data.prev_chapter_id}`}>← Sebelumnya</Link>:<span/>}{data.next_chapter_id?<Link className="primary-button" to={`/read/${data.next_chapter_id}`}>Berikutnya →</Link>:<Link className="outline-button" to={`/manga/${data.manga_id}`}>Daftar chapter</Link>}</div>}
  </div>
}
function SavedPage({title,subtitle,items,onBookmark,isSaved,empty,detail}) {
  const [sort,setSort]=useState('recent')
  const ordered=useMemo(()=>sort==='title'?[...items].sort((a,b)=>a.title.localeCompare(b.title)):items,[items,sort])
  return <div className="page-stack"><div className="page-intro"><span className="eyebrow">KOLEKSI KAMU</span><h1>{title}</h1><p>{subtitle}</p></div>{items.length>0&&<div className="saved-toolbar"><span>{items.length} judul</span><select value={sort} onChange={e=>setSort(e.target.value)}><option value="recent">Terbaru disimpan</option><option value="title">Judul A–Z</option></select></div>}{ordered.length?<div className="manga-grid">{ordered.map((m,i)=><MangaCard key={m.manga_id||m.id||i} item={m} onBookmark={onBookmark} bookmarked={isSaved(m.manga_id||m.id)}/>)}</div>:<Empty title={empty} detail={detail}/>}</div>
}
export default App
