/* -----------------------------------------------------------------
   app/components/series-page.tsx
   صفحة المسلسلات — بحث، تمرير ∞، Hero دوّار، وزرّ انتقال للتفاصيل
------------------------------------------------------------------ */
"use client"

import {
  useState, useEffect, useRef, useCallback,
} from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Play, Plus, Star, Share, Filter, Search,
  Calendar, Tv, ChevronDown,
} from "lucide-react"

import { Button }   from "@/components/ui/button"
import { Badge }    from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input }    from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

import { fetchSeries } from "../lib/api"

/* ===== جداول ثابتة (اختصر ما لا يلزم) ===== */
const CATEGORY_MAP: Record<number, string> = {
  456: "مسلسلات طبيعة",
}
const GENRE_OPTIONS = ["الكل", ...Array.from(new Set(Object.values(CATEGORY_MAP))).sort()]

/* ===== ثوابت ===== */
const PAGE_SIZE      = 24
const HERO_ROTATE_MS = 6_000
const SEARCH_DELAY   = 500

/* ===== أدوات مساعدة ===== */
const getQuality = (ext?: string) => {
  if (!ext) return "HD"
  const v = ext.toLowerCase()
  if (v.includes("4k") || v.includes("uhd")) return "4K"
  if (v.includes("hdr") || v === "mkv")      return "HDR"
  if (v.includes("cam") || v.includes("sd")) return "SD"
  return "HD"
}
const formatSeasons  = (n?: string | number) => n ? `${n} موسم`   : "—"
const formatEpisodes = (n?: string | number) => n ? `${n} حلقة`  : "—"

/* ===== سكيلتونات ===== */
const PosterSkeleton = () => (
  <div className="animate-pulse bg-gradient-to-b from-gray-900 to-gray-800 border-gray-700 rounded-2xl overflow-hidden">
    <div className="w-full aspect-[2/3] bg-gray-700/60"/>
    <div className="p-4 space-y-2">
      <Skeleton className="h-4 w-3/4 rounded"/>
      <Skeleton className="h-3 w-full rounded"/>
      <div className="flex justify-between">
        <Skeleton className="h-3 w-1/4 rounded"/>
        <Skeleton className="h-3 w-1/4 rounded"/>
      </div>
    </div>
  </div>
)

const TrendingCardSkeleton = () => (
  <div className="animate-pulse w-72 bg-gradient-to-b from-gray-900 to-gray-800 border-gray-700 rounded-3xl overflow-hidden">
    <div className="w-full h-48 bg-gray-700/60"/>
    <div className="p-6 space-y-3">
      <Skeleton className="h-4 w-2/3 rounded"/>
      <Skeleton className="h-3 w-1/3 rounded"/>
      <Skeleton className="h-3 w-1/4 rounded"/>
    </div>
  </div>
)

const HeroSkeleton = () => (
  <section className="relative h-screen overflow-hidden">
    <Skeleton className="absolute inset-0 rounded-none"/>
  </section>
)

/* ===================================================================== */
export default function SeriesPage() {
  const router = useRouter()

  /* ---------- حالة البيانات ---------- */
  const [staticSeries, setStaticSeries] = useState<any[]>([])
  const [heroIdx,      setHeroIdx]      = useState(0)

  const [gridSeries,   setGridSeries]   = useState<any[]>([])
  const [page,         setPage]         = useState(1)
  const [hasMore,      setHasMore]      = useState(true)
  const [loading,      setLoading]      = useState(true)
  const [loadingMore,  setLoadingMore]  = useState(false)

  const [genre,     setGenre]     = useState("الكل")
  const [genreOpen, setGenreOpen] = useState(false)
  const [search,    setSearch]    = useState("")
  const [query,     setQuery]     = useState("")

  const sentinel = useRef<HTMLDivElement | null>(null)

  /* ---------- جلب الصفحة الأولى ---------- */
  useEffect(() => {
    fetchSeries(1, PAGE_SIZE, "").then(d => {
      setStaticSeries(d)
      setGridSeries(d)
      setHasMore(d.length === PAGE_SIZE)
    }).finally(() => setLoading(false))
  }, [])

  /* ---------- بحث فورى (Debounce) ---------- */
  useEffect(() => {
    const id = setTimeout(() => {
      const term = search.trim()
      if (term === "") {
        if (query !== "") {
          setQuery("")
          setGridSeries(staticSeries)
          setPage(1)
          setHasMore(staticSeries.length === PAGE_SIZE)
        }
        return
      }
      if (term === query) return
      setQuery(term)
      setLoading(true)
      fetchSeries(1, PAGE_SIZE, term).then(d => {
        setGridSeries(d)
        setPage(1)
        setHasMore(d.length === PAGE_SIZE)
      }).finally(() => setLoading(false))
    }, SEARCH_DELAY)
    return () => clearTimeout(id)
  }, [search, query, staticSeries])

  /* ---------- تمرير لانهائى ---------- */
  const loadNext = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const d = await fetchSeries(page + 1, PAGE_SIZE, query)
    setGridSeries(p => [...p, ...d])
    setPage(p => p + 1)
    setHasMore(d.length === PAGE_SIZE)
    setLoadingMore(false)
  }, [loadingMore, hasMore, page, query])

  useEffect(() => {
    if (!sentinel.current) return
    const io = new IntersectionObserver(e => {
      if (e[0].isIntersecting) loadNext()
    }, { rootMargin: "600px" })
    io.observe(sentinel.current)
    return () => io.disconnect()
  }, [loadNext])

  /* ---------- تدوير الهيرو ---------- */
  useInterval(() => {
    if (staticSeries.length >= 2)
      setHeroIdx(i => (i + 1) % Math.min(3, staticSeries.length))
  }, loading ? null : HERO_ROTATE_MS)

  /* ---------- اشتقاقات ---------- */
  const heroSeries = staticSeries.slice(0, 3)
  const hero       = heroSeries[heroIdx]
  const trending   = staticSeries.slice(0, 10)
  const displayed  = genre === "الكل"
    ? gridSeries
    : gridSeries.filter(s => (CATEGORY_MAP[s.category_id] || "").includes(genre))

  /* ---------------- JSX ---------------- */
  return (
    <div className="min-h-screen">
      {loading ? <HeroSkeleton /> : hero &&
        <HeroSection {...{ hero, heroSeries, heroIdx, setHeroIdx, router }} />}

      {/* شريط البحث والفلاتر */}
      <section className="container mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60"/>
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن مسلسل..."
              className="pl-4 pr-10 py-3 w-72 bg-white/10 text-white placeholder:text-white/50 border-white/20 rounded-full"
            />
          </div>
          <GenreDropdown {...{ genre, setGenre, genreOpen, setGenreOpen }} />
          <Button className="bg-white/10 border border-white/20 rounded-full px-6 py-3 text-white">
            فلترة متقدمة
            <Filter className="w-4 h-4 ml-2"/>
          </Button>
        </div>
      </section>

      <TrendingSection {...{ loading, trending }} />

      <section className="container mx-auto px-4 sm:px-6 pb-16">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-white">جميع المسلسلات</h2>
        <SeriesGrid series={displayed} showSkeleton={loadingMore}/>
        {hasMore && <div ref={sentinel} className="h-8"/>}
      </section>
    </div>
  )
}

/* =====================================================================
   المكوّنات الفرعية
===================================================================== */
function HeroSection({
  hero, heroSeries, heroIdx, setHeroIdx, router,
}: {
  hero: any; heroSeries: any[]; heroIdx: number; setHeroIdx: (i: number) => void; router: any;
}) {
  const {
    name, cover, backdrop_path, category_id, genre,
    rating_5based, year, releaseDate, description, plot,
    seasons, episodes, series_id,
  } = hero

  const img = backdrop_path?.[0] || cover || "/placeholder.svg?height=900&width=1600"
  const cat = CATEGORY_MAP[category_id] || genre || "غير مصنف"

  return (
    <section className="relative h-screen overflow-hidden">
      <Image fill priority src={img} alt={name} className="object-cover"/>
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900/60 to-gray-800 opacity-70"/>

      <div className="relative z-10 container mx-auto h-full flex items-center px-4 sm:px-6">
        <div className="max-w-4xl space-y-6">
          <Badge className="bg-black/40 px-4 py-2">{cat}</Badge>
          <h2 className="text-5xl sm:text-7xl font-black">{name}</h2>
          {(description || plot) && (
            <p className="max-w-2xl text-white/90 line-clamp-3">{description || plot}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-white/80">
            <span className="flex items-center gap-1 bg-black/30 rounded-full px-3 py-1">
              <Star className="w-4 h-4 fill-yellow-400"/>
              {Number(rating_5based || 0).toFixed(1)}
            </span>
            <span className="bg-black/30 rounded-full px-3 py-1">
              {year || releaseDate?.slice(0, 4) || "—"}
            </span>
            <span className="bg-black/30 rounded-full px-3 py-1">
              {formatSeasons(seasons)}
            </span>
            <span className="hidden sm:inline bg-black/30 rounded-full px-3 py-1">
              {formatEpisodes(episodes)}
            </span>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => router.push(`/series/${series_id}`)}
              className="bg-white text-black rounded-full px-8 py-4 shadow"
            >
              مشاهدة الآن
              <Play className="w-5 h-5 ml-3"/>
            </Button>
            <Button variant="outline" className="border-white/50 rounded-full px-8 py-4 text-white">
              إضافة
              <Plus className="w-5 h-5 ml-3"/>
            </Button>
            <Button variant="outline" className="border-white/50 rounded-full px-6 py-4">
              <Share className="w-5 h-5"/>
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
        {heroSeries.map((_, i) => (
          <button
            key={i}
            aria-label={`الشريحة ${i + 1}`}
            onClick={() => setHeroIdx(i)}
            className={`w-10 h-1 rounded-full ${i === heroIdx ? "bg-white" : "bg-white/30 hover:bg-white/50"}`}
          />
        ))}
      </div>
    </section>
  )
}

function GenreDropdown({
  genre, setGenre, genreOpen, setGenreOpen,
}: {
  genre: string; setGenre: (g: string) => void; genreOpen: boolean; setGenreOpen: (b: boolean) => void;
}) {
  return (
    <div className="relative">
      <Button
        onClick={() => setGenreOpen(!genreOpen)}
        className="bg-white/10 border border-white/20 rounded-full px-6 py-3 text-white"
      >
        {genre}
        <ChevronDown className="w-4 h-4 ml-2"/>
      </Button>
      {genreOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50">
          <div className="p-2 max-h-72 overflow-y-auto">
            {GENRE_OPTIONS.map(g => (
              <button
                key={g}
                onClick={() => { setGenre(g); setGenreOpen(false) }}
                className={`w-full text-right px-4 py-2 rounded-lg transition-colors ${
                  genre === g ? "bg-white/20 text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TrendingSection({ loading, trending }: { loading: boolean; trending: any[] }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 mb-8">
        <h3 className="text-2xl sm:text-3xl font-bold">الأكثر مشاهدة</h3>
      </div>
      {loading ? (
        <div className="overflow-x-auto">
          <div className="flex gap-8 px-4 sm:px-6 pb-4">
            {Array.from({ length: 10 }).map((_, i) => <TrendingCardSkeleton key={i}/>)}
          </div>
        </div>
      ) : (
        <TrendingRow trending={trending}/>
      )}
    </section>
  )
}

function TrendingRow({ trending }: { trending: any[] }) {
  if (!trending.length) return null
  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-8 px-4 sm:px-6 pb-4">
        {trending.map((item, idx) => (
          <Card
            key={item.series_id}
            className="group relative flex-shrink-0 w-72 bg-gradient-to-b from-gray-900 to-gray-800 border-gray-700 hover:border-gray-600 rounded-3xl overflow-hidden hover:scale-105 transition-all"
          >
            <div className="absolute top-6 left-6 text-7xl font-black bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent z-20 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
              {idx + 1}
            </div>
            <CardContent className="p-0">
              <Image
                src={item.cover || "/placeholder.svg?height=400&width=300"}
                alt={item.name}
                width={320}
                height={180}
                className="w-full h-48 object-cover"
              />
              <div className="p-6 space-y-2">
                <h4 className="text-xl font-bold truncate text-white group-hover:text-gray-300">
                  {item.name}
                </h4>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{item.year || item.releaseDate?.slice(0, 4) || "—"}</span>
                  <span>{getQuality(item.container_extension)}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-white">
                  <Star className="w-4 h-4 fill-yellow-400"/>
                  {Number(item.rating_5based || 0).toFixed(1)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function SeriesGrid({ series, showSkeleton }: { series: any[]; showSkeleton?: boolean }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {series.map(s => <SeriesCard key={s.series_id} series={s}/>)}
      {showSkeleton && Array.from({ length: 5 }).map((_, i) => <PosterSkeleton key={`sk-${i}`}/>)}
    </div>
  )
}

function SeriesCard({ series: s }: { series: any }) {
  const router = useRouter()
  return (
    <Card
      onClick={() => router.push(`/series/${s.series_id}`)}
      className="group cursor-pointer bg-gradient-to-b from-gray-900 to-gray-800 border-gray-700 hover:border-gray-600 rounded-2xl overflow-hidden hover:scale-105 transition-all"
    >
      <CardContent className="p-0">
        <div className="relative w-full aspect-[2/3]">
          <Image
            fill
            loading="lazy"
            src={s.cover || "/placeholder.svg?height=900&width=600"}
            alt={s.name}
            className="object-cover"
          />
          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            <Badge className="bg-black/50 rounded-full px-3 py-0.5 text-xs">
              {CATEGORY_MAP[s.category_id] || s.genre || "غير مصنف"}
            </Badge>
            <Badge className="bg-black/40 rounded-full px-2 py-0.5 text-[10px]">
              {getQuality(s.container_extension)}
            </Badge>
          </div>
        </div>
        <div className="p-4 space-y-2">
          <h4 className="text-base font-bold truncate group-hover:text-gray-300">
            {s.name}
          </h4>
          {(s.plot || s.description) && (
            <p className="text-gray-400 text-xs line-clamp-2">{s.plot || s.description}</p>
          )}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3"/>
              {s.year || s.releaseDate?.slice(0, 4) || "—"}
            </span>
            <span className="flex items-center gap-1">
              <Tv className="w-3 h-3"/>
              {formatSeasons(s.seasons)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{formatEpisodes(s.episodes)}</span>
            <span className="flex items-center gap-1 text-white text-[13px]">
              <Star className="w-3 h-3 fill-yellow-400"/>
              {Number(s.rating_5based || s.rating || 0).toFixed(1)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ----- useInterval (بسيط) ----- */
function useInterval(cb: () => void, delay: number | null) {
  const saved = useRef(cb)
  useEffect(() => { saved.current = cb }, [cb])
  useEffect(() => {
    if (delay === null) return
    const id = setInterval(() => saved.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}
