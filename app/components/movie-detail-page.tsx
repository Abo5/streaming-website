/* ----------------------------------------------------------------
   app/components/movies-page.tsx – نسخة خفيفة مع بحث كامل الكاتلوج
   وفلترة متقدّمة (الفئة، الجودة، الحدّ الأدنى للتقييم)
----------------------------------------------------------------- */
"use client"

import { useState, useEffect, useRef } from "react"
import Image   from "next/image"
import {
  Play, Plus, Star, Share, Filter, X,
  Calendar, Clock, ChevronDown, Loader2,
} from "lucide-react"

import { Button }   from "@/components/ui/button"
import { Badge }    from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input }    from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider }   from "@/components/ui/slider"     // يفترض وجوده بواجهتك

import { fetchMovies } from "../lib/api"

/* ============ جدول الأقسام (id ➜ تصنيف مقروء) ============ */
const CATEGORY_MAP: Record<number, string> = {
  516:"يعرض الآن عربي",439:"يعرض الآن أجنبي",622:"يعرض الآن آسيوي",623:"يعرض الآن هندي",
  624:"أفلام أجنبية",12:"أفلام عربية",160:"أفلام نتفليكس",324:"أفلام أمازون",
  600:"أفلام شاهد",634:"أفلام أبل",635:"أفلام ديزني",13:"أفلام هندية",
  218:"أفلام آسيوية",151:"أفلام تركية",216:"أفلام مميزة",139:"أفلام بدقة عالية",
  310:"عربي مميز",355:"أفلام المغرب",219:"عربي قديم",58:"أفلام أكشن",
  63:"أفلام إثارة",59:"أفلام رعب",56:"أفلام كوميدية",241:"أفلام ثلاثية أبعاد",
  62:"دراما رومانسية",243:"كارتون مدبلج",244:"أفلام أنمي",14:"أفلام كارتون",
  433:"أفلام كردية",434:"كارتون كردي",169:"مسرحيات",15:"وثائقي",
  328:"هندي مدبلج",325:"متعددة اللغات",322:"مترجمة متعدّدة",302:"فرنسي أكشن",
  313:"فرنسي دراما",321:"ألماني",312:"كارتون غير مترجم",
  300:"عادل إمام",307:"محمد هنيدي",316:"محمد رمضان",311:"أكشن إنجليزي",
  304:"أحمد السقا",306:"أحمد حلمي",299:"محمد سعد",315:"أحمد عز/مكي",
  275:"مصارعة",510:"UFC 2023",410:"بروس ويليس",471:"جاكي شان",
  411:"جيسون ستاثام",412:"فان دام",413:"جِت لي",414:"ليام نيسون",
  415:"ستيفن سيجال",416:"ستالون",455:"أفلام طبيعة",
}

/* ------------ تحويل الامتداد إلى جودة ------------ */
function getQuality(ext?: string) {
  if (!ext) return "HD"
  const v = ext.toLowerCase()
  if (v.includes("4k") || v.includes("uhd")) return "4K"
  if (v.includes("hdr") || v === "mkv")      return "HDR"
  if (v.includes("cam") || v.includes("sd")) return "SD"
  return "HD"
}

/* --------- تنسيق المدّة (ثوانٍ ➜ h:mmس) --------- */
function formatDuration(sec?: string | number) {
  const s = Number(sec || 0)
  if (!s) return "—"
  const h = Math.floor(s / 3600)
  const m = Math.round((s % 3600) / 60)
  return `${h}:${m.toString().padStart(2, "0")}‏س`
}

/* --------- هوك interval آمن مع React --------- */
function useInterval(cb: () => void, delay: number | null) {
  const saved = useRef(cb)
  useEffect(() => { saved.current = cb }, [cb])
  useEffect(() => {
    if (delay == null) return
    const id = setInterval(() => saved.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

/* ======== عناصر هيكلية (Skeleton) ======== */
const HeroSkeleton = () => (
  <section className="relative h-screen overflow-hidden">
    <Skeleton className="absolute inset-0 rounded-none" />
  </section>
)

const GridSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: rows * 4 }).map((_, i) =>
      <Skeleton key={i} className="h-[430px] rounded-2xl" />
    )}
  </div>
)

/* ================================================================
   المكوّن الرئيسى
================================================================ */
export default function MoviesPage() {
  /* ---------- حالة رئيسية ---------- */
  const [movies,       setMovies]       = useState<any[]>([])
  const [page,         setPage]         = useState(1)
  const [loading,      setLoading]      = useState(true)
  const [loadingMore,  setLoadingMore]  = useState(false)
  const [noMore,       setNoMore]       = useState(false)

  /* ---------- بحث ---------- */
  const [search, setSearch]             = useState("")
  const searchDebounceRef               = useRef<NodeJS.Timeout>()
  const [inSearch, setInSearch]         = useState(false)

  /* ---------- فلاتر ---------- */
  const GENRES = ["الكل","أكشن","دراما","كوميدي","خيال علمي","رعب","رومانسي","إثارة","مغامرة","سيرة ذاتية"]
  const [genre,     setGenre]           = useState("الكل")
  const [genreOpen, setGenreOpen]       = useState(false)

  const CATEGORY_LIST = ["الكل", ...Object.values(CATEGORY_MAP)]
  const [category,   setCategory]       = useState("الكل")
  const [catOpen,    setCatOpen]        = useState(false)

  const [quality,    setQuality]        = useState<string|null>(null)
  const [minRating,  setMinRating]      = useState(0)
  const [filtersOpen,setFiltersOpen]    = useState(false)

  /* ---------- hero ---------- */
  const [heroIdx, setHeroIdx]           = useState(0)

  /* ========== جلب أول صفحة ========== */
  useEffect(() => {
    fetchMovies(1, 24).then(d => {
      setMovies(d)
      if (d.length < 24) setNoMore(true)
    }).finally(() => setLoading(false))
  }, [])

  /* ========== تدوير الـ Hero ========== */
  useInterval(() => {
    if (movies.length >= 2) setHeroIdx(p => (p + 1) % Math.min(3, movies.length))
  }, loading ? null : 6000)

  /* ========== البحث (debounce 400 ms) ========== */
  useEffect(() => {
    clearTimeout(searchDebounceRef.current as any)

    if (!search.trim()) {
      // الرجوع للوضع العادى
      if (inSearch) {
        setLoading(true)
        fetchMovies(1, 24).then(d => {
          setMovies(d); setPage(1); setNoMore(d.length < 24); setInSearch(false)
        }).finally(() => setLoading(false))
      }
      return
    }

    searchDebounceRef.current = setTimeout(async () => {
      setLoading(true); setInSearch(true)
      const result = await fetchMovies(1, 100, search) // أوّل 100 نتيجة مطابقة
      setMovies(result)
      setNoMore(true)           // لا زر تحميل المزيد أثناء البحث
      setLoading(false)
      setPage(1)
    }, 400)
  }, [search])

  /* ========== تحميل المزيد ========== */
  const loadMore = async () => {
    if (loadingMore || noMore || inSearch) return
    setLoadingMore(true)
    try {
      const next  = page + 1
      const data  = await fetchMovies(next, 24)
      setMovies(p => [...p, ...data])
      setPage(next)
      if (data.length < 24) setNoMore(true)
    } finally { setLoadingMore(false) }
  }

  /* ========== تطبيق الفلاتر ========== */
  let filtered = movies
  if (genre !== "الكل")     filtered = filtered.filter(m => (m.genre || "").includes(genre))
  if (category !== "الكل")  filtered = filtered.filter(m => (CATEGORY_MAP[m.category_id] || "") === category)
  if (quality)              filtered = filtered.filter(m => getQuality(m.container_extension) === quality)
  if (minRating > 0)        filtered = filtered.filter(m => Number(m.rating_5based || m.rating || 0) >= minRating)

  const heroMovies = filtered.slice(0, 3)
  const hero       = heroMovies[heroIdx] ?? filtered[0]
  const trending   = filtered.slice(0, 10)

  /* ============================ JSX ============================ */
  return (
    <div className="min-h-screen">

      {/* ---------- HERO ---------- */}
      {loading
        ? <HeroSkeleton />
        : hero && <HeroSection {...{ hero, heroMovies, heroIdx, setHeroIdx }} />}

      {/* ---------- شريط البحث والفلاتر ---------- */}
      <section className="container mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap gap-4 items-center">

          {/* حقل البحث */}
          <Input
            placeholder="ابحث عن فيلم..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-4 pr-10 py-3 w-64 bg-white/10 text-white placeholder:text-white/50 rounded-full backdrop-blur-sm border-white/20"
          />

          {/* اختيار النوع */}
          <Dropdown
            label={genre}
            open={genreOpen}
            setOpen={setGenreOpen}
            options={GENRES}
            onSelect={setGenre}
          />

          {/* اختيار التصنيف من الـ كاتلوج */}
          <Dropdown
            label={category}
            open={catOpen}
            setOpen={setCatOpen}
            options={CATEGORY_LIST}
            onSelect={setCategory}
            width="w-56"
          />

          {/* زر الفلاتر الإضافية */}
          <Button
            onClick={() => setFiltersOpen(o => !o)}
            className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white hover:bg-white/20 flex items-center gap-2"
          >
            {filtersOpen ? <X className="w-4 h-4"/> : <Filter className="w-4 h-4"/>}
            {filtersOpen ? "إغلاق الفلاتر" : "فلترة متقدمة"}
          </Button>
        </div>

        {/* لوحة الفلاتر الإضافية */}
        {filtersOpen && (
          <div className="mt-6 bg-black/40 border border-white/20 rounded-2xl p-6 backdrop-blur-xl space-y-6">

            {/* جودة الفيديو */}
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-sm text-white/80 min-w-[90px]">الجودة:</span>
              {["HD","HDR","4K","SD"].map(q => (
                <Button
                  key={q}
                  variant={quality === q ? "default" : "outline"}
                  className="rounded-full px-4 py-1 h-auto text-sm"
                  onClick={() => setQuality(quality === q ? null : q)}
                >
                  {q}
                </Button>
              ))}
            </div>

            {/* الحد الأدنى للتقييم */}
            <div className="flex flex-wrap gap-4 items-center">
              <span className="text-sm text-white/80 min-w-[90px]">التقييم ≥ {minRating}</span>
              <div className="grow max-w-xs">
                <Slider
                  min={0} max={10} step={0.5}
                  value={[minRating]}
                  onValueChange={([v]) => setMinRating(v)}
                />
              </div>
              {minRating > 0 && (
                <Button size="icon" variant="ghost" onClick={() => setMinRating(0)}>
                  <X className="w-4 h-4"/>
                </Button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ---------- الأكثر مشاهدة ---------- */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 mb-8">
          <h3 className="text-2xl sm:text-3xl font-bold">الأكثر مشاهدة</h3>
        </div>
        {loading
          ? <div className="overflow-x-auto"><div className="flex gap-8 px-4 sm:px-6 pb-4">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="w-72 h-96 rounded-3xl" />)}</div></div>
          : <TrendingRow trending={trending} />}
      </section>

      {/* ---------- شبكة جميع الأفلام ---------- */}
      <section className="container mx-auto px-4 sm:px-6 pb-16">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-white">جميع الأفلام</h2>

        {loading && <GridSkeleton rows={3} />}

        {!loading && <>
          <MovieGrid movies={filtered} />

          {!noMore && (
            <div className="mt-10 flex justify-center">
              <Button
                disabled={loadingMore || inSearch}
                onClick={loadMore}
                className="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm px-8 py-4 rounded-full text-white flex items-center gap-2"
              >
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                تحميل المزيد
              </Button>
            </div>
          )}
        </>}
      </section>
    </div>
  )
}

/* ================================================================
   المكوّنات الفرعيّة
================================================================ */

/* ---------- الـ Hero ---------- */
function HeroSection({ hero, heroMovies, heroIdx, setHeroIdx }: {
  hero: any; heroMovies: any[]; heroIdx: number; setHeroIdx: (i: number) => void
}) {
  const { name, stream_icon, category_id, genre, rating_5based, year, releaseDate, description, plot } = hero
  const cat = CATEGORY_MAP[category_id]
  return (
    <section className="relative h-screen overflow-hidden">
      {/* خلفية متدرجة مع تخفيف الظل */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900/60 to-gray-800 opacity-70" />
      <Image fill priority src={stream_icon || "/placeholder.svg?height=900&width=1600"} alt={name} className="object-cover" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 h-full flex items-center">
        <div className="max-w-4xl space-y-6">
          <Badge className="bg-black/40 text-white rounded-full px-4 py-2 backdrop-blur-sm">
            {cat || genre || "غير مصنف"}
          </Badge>

          <h2 className="text-5xl sm:text-7xl font-black leading-tight">{name}</h2>

          {(description || plot) && (
            <p className="text-lg text-white/90 max-w-2xl line-clamp-3">{description || plot}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-white/80">
            <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              {Number(rating_5based || 0).toFixed(1)}
            </div>
            <div className="bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">
              {year || releaseDate?.slice(0, 4) || "—"}
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            <Button className="bg-white text-black rounded-full px-8 py-4 font-semibold shadow">
              مشاهدة الآن <Play className="w-5 h-5 ml-3" />
            </Button>
            <Button variant="outline" className="border-2 border-white/50 text-white rounded-full px-8 py-4 font-semibold backdrop-blur-sm">
              إضافة <Plus className="w-5 h-5 ml-3" />
            </Button>
            <Button variant="outline" className="border-2 border-white/50 text-white rounded-full px-6 py-4 backdrop-blur-sm">
              <Share className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* مؤشرات التبديل */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
        {heroMovies.map((_, i) => (
          <button
            key={i}
            onClick={() => setHeroIdx(i)}
            className={`w-10 h-1 rounded-full ${i === heroIdx ? "bg-white" : "bg-white/30 hover:bg-white/50"}`}
          />
        ))}
      </div>
    </section>
  )
}

/* ---------- Dropdown عام ---------- */
function Dropdown({ label, open, setOpen, options, onSelect, width = "w-48" }: {
  label: string; open: boolean; setOpen: (b: boolean) => void;
  options: string[]; onSelect: (val: string) => void; width?: string
}) {
  return (
    <div className="relative">
      <Button
        onClick={() => setOpen(!open)}
        className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white hover:bg-white/20 flex items-center gap-2"
      >
        {label} <ChevronDown className="w-4 h-4" />
      </Button>

      {open && (
        <div className={`absolute top-full left-0 mt-2 ${width} bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 backdrop-blur-xl`}>
          <div className="p-2 max-h-64 overflow-y-auto">
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => { onSelect(opt); setOpen(false) }}
                className={`w-full text-right px-4 py-2 rounded-lg transition-colors ${
                  label === opt
                    ? "bg-white/20 text-white"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- صفّ الأكثر مشاهدة ---------- */
function TrendingRow({ trending }: { trending: any[] }) {
  if (!trending.length) return null
  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-8 px-4 sm:px-6 pb-4">
        {trending.map((item, idx) => (
          <Card
            key={item.stream_id}
            className="group relative flex-shrink-0 w-72 bg-gradient-to-b from-gray-900 to-gray-800 border-gray-700 hover:border-gray-600 rounded-3xl overflow-hidden hover:scale-105 transition-all"
          >
            {/* رقم الترتيب مع ظل خفيف ليبرز */}
            <div className="absolute top-6 left-6 text-7xl font-black bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent select-none z-20 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
              {idx + 1}
            </div>

            <CardContent className="p-0">
              <Image
                src={item.stream_icon || "/placeholder.svg?height=400&width=300"}
                alt={item.name}
                width={320}
                height={180}
                className="w-full h-48 object-cover"
              />

              <div className="p-6 space-y-2">
                <h4 className="text-xl font-bold truncate text-white group-hover:text-gray-300 transition-colors">
                  {item.name}
                </h4>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{item.year || item.releaseDate?.slice(0, 4) || "—"}</span>
                  <span className="text-gray-300">{getQuality(item.container_extension)}</span>
                </div>

                <div className="flex items-center gap-1 text-sm text-white">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {Number(item.rating_5based || item.rating || 0).toFixed(1)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

/* ---------- شبكة الأفلام (بوسترات طولية) ---------- */
function MovieGrid({ movies }: { movies: any[] }) {
  if (!movies.length) return <p className="text-center text-gray-400">لا توجد أفلام متاحة</p>

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {movies.map(m => (
        <Card
          key={m.stream_id}
          className="group bg-gradient-to-b from-gray-900 to-gray-800 border-gray-700 hover:border-gray-600 rounded-2xl overflow-hidden hover:scale-105 transition-all"
        >
          <CardContent className="p-0">
            {/* البوستر الطولى */}
            <div className="relative w-full aspect-[2/3]">
              <Image
                fill
                loading="lazy"
                src={m.stream_icon || "/placeholder.svg?height=900&width=600"}
                alt={m.name}
                className="object-cover"
              />

              {/* شارات التصنيف والجودة */}
              <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                <Badge className="bg-black/50 text-white rounded-full px-3 py-0.5 text-xs backdrop-blur-sm">
                  {CATEGORY_MAP[m.category_id] || m.genre || "غير مصنف"}
                </Badge>
                <Badge className="bg-black/40 text-white rounded-full px-2 py-0.5 text-[10px] backdrop-blur-sm">
                  {getQuality(m.container_extension)}
                </Badge>
              </div>
            </div>

            {/* معلومات مختصرة */}
            <div className="p-4 space-y-2">
              <h4 className="text-base font-bold text-white truncate group-hover:text-gray-300 transition-colors">
                {m.name}
              </h4>

              {(m.description || m.plot) && (
                <p className="text-gray-400 text-xs line-clamp-2">
                  {m.description || m.plot}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />{m.year || m.releaseDate?.slice(0, 4) || "—"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />{formatDuration(m.duration_secs) || m.duration}
                </span>
              </div>

              <div className="flex items-center gap-1 text-sm text-white">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {Number(m.rating_5based || m.rating || 0).toFixed(1)}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
