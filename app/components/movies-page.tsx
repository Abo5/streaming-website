/* -----------------------------------------------------------------
   app/components/movies-page.tsx
   ▸ تمرير ∞، بحث فورى، وسكيلتون بوسترات متناسق
------------------------------------------------------------------ */
"use client"

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Play,
  Plus,
  Star,
  Share,
  Filter,
  Search,
  Calendar,
  Clock,
  ChevronDown,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

import { fetchMovies } from "../lib/api"

/* ================= جداول ثابتة ================= */
const CATEGORY_MAP: Record<number, string> = {
  12: "أفلام عربية",
  13: "أفلام هندية",
  14: "أفلام كارتون",
  15: "وثائقي",
  56: "أفلام كوميدية",
  58: "أفلام أكشن",
  59: "أفلام رعب",
  62: "دراما رومانسية",
  63: "أفلام إثارة",
  139: "عالية الدقة",
  151: "أفلام تركية",
  160: "أفلام نتفليكس",
  169: "مسرحيات",
  216: "أفلام مميزة",
  218: "أفلام آسيوية",
  219: "عربي قديم",
  241: "أفلام ثلاثية أبعاد",
  243: "كارتون مدبلج",
  244: "أفلام أنمي",
  275: "مصارعة",
  299: "محمد سعد",
  300: "عادل إمام",
  302: "فرنسي أكشن",
  304: "أحمد السقا",
  306: "أحمد حلمي",
  307: "محمد هنيدي",
  311: "أكشن إنجليزى",
  312: "كارتون غير مترجم",
  313: "فرنسي دراما",
  315: "أحمد عز + مكى",
  316: "محمد رمضان",
  321: "ألمانى",
  322: "مترجمة متعدّدة",
  324: "أفلام أمازون",
  325: "متعدّدة اللغات",
  328: "هندى مدبلج",
  355: "أفلام المغرب العربى",
  410: "بروس ويليس",
  411: "جيسون ستاثام",
  412: "فان دام",
  413: "جِت لى",
  414: "ليام نيسون",
  415: "ستيفن سيجال",
  416: "سيلفستر ستالون",
  433: "أفلام كرديّة",
  434: "كارتون كردى",
  439: "يعرض الآن أجنبى",
  455: "أفلام طبيعة",
  471: "جاكى شان",
  510: "UFC 2023",
  516: "يعرض الآن عربى",
  600: "أفلام شاهد",
  622: "يعرض الآن آسيوى",
  623: "يعرض الآن هندى",
  624: "أفلام أجنبية",
  634: "أفلام أبل",
  635: "أفلام ديزنى",
}
const GENRE_OPTIONS = ["الكل", ...Array.from(new Set(Object.values(CATEGORY_MAP))).sort()]

/* ================= ثوابت ================= */
const PAGE_SIZE = 24
const HERO_ROTATE_MS = 6_000
const SEARCH_DELAY = 500 /* ms */

/* ------------ تحويل الامتداد إلى جودة ------------ */
const getQuality = (ext?: string) => {
  if (!ext) return "HD"
  const v = ext.toLowerCase()
  if (v.includes("4k") || v.includes("uhd")) return "4K"
  if (v.includes("hdr") || v === "mkv") return "HDR"
  if (v.includes("cam") || v.includes("sd")) return "SD"
  return "HD"
}
/* ------------ تنسيق المدّة ------------ */
const formatDuration = (sec?: string | number) => {
  const s = Number(sec || 0)
  if (!s) return "—"
  const h = Math.floor(s / 3600)
  const m = Math.round((s % 3600) / 60)
  return `${h}:${m.toString().padStart(2, "0")}‏س`
}

/* ================= سكيلتونات ================= */
const PosterSkeleton = () => (
  <div className="bg-gray-800/70 animate-pulse rounded-2xl w-full aspect-[2/3]" />
)
const HeroSkeleton = () => (
  <section className="relative h-screen overflow-hidden">
    <Skeleton className="absolute inset-0" />
  </section>
)

/* =======================================================================
   المكوّن الرئيسى
======================================================================= */
export default function MoviesPage() {
  /* ---------- حالة ثابتة للـ Hero + الأكثر مشاهدة ---------- */
  const [staticMovies, setStaticMovies] = useState<any[]>([])
  const [heroIdx, setHeroIdx] = useState(0)

  /* ---------- حالة شبكة جميع الأفلام ---------- */
  const [gridMovies, setGridMovies] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const [genre, setGenre] = useState("الكل")
  const [genreOpen, setGenreOpen] = useState(false)

  const [search, setSearch] = useState("") /* النص فى الحقل */
  const [query, setQuery] = useState("") /* آخر استعلام مُرسل */

  const sentinel = useRef<HTMLDivElement | null>(null)

  /* ---------- تحميل الصفحة الأولى ---------- */
  useEffect(() => {
    fetchMovies(1, PAGE_SIZE, "").then((data) => {
      setStaticMovies(data)
      setGridMovies(data)
      setHasMore(data.length === PAGE_SIZE)
    }).finally(() => setLoading(false))
  }, [])

  /* ---------- بحث فورى (debounced) ---------- */
  useEffect(() => {
    const id = setTimeout(() => {
      const term = search.trim()

      /* لو فُرّغ الحقل بعد بحث سابق */
      if (term === "") {
        if (query !== "") {
          setQuery("")
          setGridMovies(staticMovies)          /* رجوع فورى بلا وميض */
          setPage(1)
          setHasMore(staticMovies.length === PAGE_SIZE)
        }
        return
      }

      if (term === query) return /* لا تغيير */

      setQuery(term)
      setLoading(true)
      fetchMovies(1, PAGE_SIZE, term).then((data) => {
        setGridMovies(data)
        setPage(1)
        setHasMore(data.length === PAGE_SIZE)
      }).finally(() => setLoading(false))
    }, SEARCH_DELAY)
    return () => clearTimeout(id)
  }, [search, query, staticMovies])

  /* ---------- تمرير لانهائى ---------- */
  const loadNext = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const next = page + 1
    const data = await fetchMovies(next, PAGE_SIZE, query)
    setGridMovies((p) => [...p, ...data])
    setPage(next)
    setHasMore(data.length === PAGE_SIZE)
    setLoadingMore(false)
  }, [loadingMore, hasMore, page, query])

  useEffect(() => {
    if (!sentinel.current) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadNext()
      },
      { threshold: 0.1, rootMargin: "600px" }
    )
    io.observe(sentinel.current)
    return () => io.disconnect()
  }, [loadNext])

  /* ---------- تدوير الهيرو ---------- */
  useInterval(() => {
    if (staticMovies.length >= 2) setHeroIdx((i) => (i + 1) % Math.min(3, staticMovies.length))
  }, loading ? null : HERO_ROTATE_MS)

  /* ---------- بيانات العرض ---------- */
  const heroMovies = staticMovies.slice(0, 3)
  const hero = heroMovies[heroIdx]
  const trending = staticMovies.slice(0, 10)

  const displayed =
    genre === "الكل"
      ? gridMovies
      : gridMovies.filter((m) => (CATEGORY_MAP[m.category_id] || "").includes(genre))

  /* ============================= JSX ============================= */
  return (
    <div className="min-h-screen">
      {/* ===== Hero ===== */}
      {loading ? <HeroSkeleton /> : hero && (
        <HeroSection hero={hero} heroMovies={heroMovies} heroIdx={heroIdx} setHeroIdx={setHeroIdx} />
      )}

      {/* ===== شريط البحث والفلاتر ===== */}
      <section className="container mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap gap-4 items-center">
          {/* إدخال البحث */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
            <Input
              placeholder="ابحث عن فيلم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-4 pr-10 py-3 w-72 bg-white/10 text-white placeholder:text-white/50 border-white/20 rounded-full backdrop-blur-sm"
            />
          </div>

          {/* الفئة */}
          <GenreDropdown genre={genre} setGenre={setGenre} genreOpen={genreOpen} setGenreOpen={setGenreOpen} />

          {/* فلترة متقدمة - مستقبلاً */}
          <Button className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white hover:bg-white/20">
            فلترة متقدمة
            <Filter className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* ===== الأكثر مشاهدة ===== */}
      <TrendingSection loading={loading} trending={trending} />

      {/* ===== جميع الأفلام ===== */}
      <section className="container mx-auto px-4 sm:px-6 pb-16">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-white">جميع الأفلام</h2>

        <MovieGrid movies={displayed} showSkeleton={loadingMore} skeletonCount={5} />
        {hasMore && <div ref={sentinel} className="h-8" />}
      </section>
    </div>
  )
}

/* =====================================================================
   ▸ المكوّنات الفرعية
===================================================================== */
function HeroSection({
  hero,
  heroMovies,
  heroIdx,
  setHeroIdx,
}: {
  hero: any
  heroMovies: any[]
  heroIdx: number
  setHeroIdx: (i: number) => void
}) {
  const router = useRouter()

  const {
    name,
    stream_icon,
    category_id,
    genre,
    rating_5based,
    year,
    releaseDate,
    description,
    plot,
  } = hero
  const categoryLabel = CATEGORY_MAP[category_id] || genre || "غير مصنف"

  return (
    <section className="relative h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900/60 to-gray-800 opacity-70" />
      <Image
        fill
        priority
        src={stream_icon || "/placeholder.svg?height=900&width=1600"}
        alt={name}
        className="object-cover"
      />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 h-full flex items-center">
        <div className="max-w-4xl space-y-6">
          <Badge className="bg-black/40 text-white rounded-full px-4 py-2 backdrop-blur-sm">
            {categoryLabel}
          </Badge>

          <h2 className="text-5xl sm:text-7xl font-black">{name}</h2>

          {(description || plot) && (
            <p className="text-lg text-white/90 max-w-2xl line-clamp-3">
              {description || plot}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-white/80">
            <span className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              {Number(rating_5based || 0).toFixed(1)}
            </span>
            <span className="bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">
              {year || releaseDate?.slice(0, 4) || "—"}
            </span>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={() => router.push(`/movies/${hero.stream_id}`)}
              className="bg-white text-black rounded-full px-8 py-4 font-semibold shadow"
            >
              مشاهدة الآن
              <Play className="w-5 h-5 ml-3" />
            </Button>
            <Button
              variant="outline"
              className="border-2 border-white/50 text-white rounded-full px-8 py-4 font-semibold backdrop-blur-sm"
            >
              إضافة
              <Plus className="w-5 h-5 ml-3" />
            </Button>
            <Button
              variant="outline"
              className="border-2 border-white/50 text-white rounded-full px-6 py-4 backdrop-blur-sm"
            >
              <Share className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
        {heroMovies.map((_, i) => (
          <button
            key={i}
            aria-label={`الشريحة ${i + 1}`}
            onClick={() => setHeroIdx(i)}
            className={`w-10 h-1 rounded-full ${
              i === heroIdx ? "bg-white" : "bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  )
}

function GenreDropdown({
  genre,
  setGenre,
  genreOpen,
  setGenreOpen,
}: {
  genre: string
  setGenre: (g: string) => void
  genreOpen: boolean
  setGenreOpen: (b: boolean) => void
}) {
  return (
    <div className="relative">
      <Button
        onClick={() => setGenreOpen(!genreOpen)}
        className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white hover:bg-white/20"
      >
        {genre}
        <ChevronDown className="w-4 h-4 ml-2" />
      </Button>

      {genreOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 backdrop-blur-xl">
          <div className="p-2 max-h-72 overflow-y-auto">
            {GENRE_OPTIONS.map((g) => (
              <button
                key={g}
                onClick={() => {
                  setGenre(g)
                  setGenreOpen(false)
                }}
                className={`w-full text-right px-4 py-2 rounded-lg transition-colors ${
                  genre === g
                    ? "bg-white/20 text-white"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
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

/* =================== قسم الأكثر مشاهدة =================== */
function TrendingSection({
  loading,
  trending,
}: {
  loading: boolean
  trending: any[]
}) {
  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 mb-8">
        <h3 className="text-2xl sm:text-3xl font-bold">الأكثر مشاهدة</h3>
      </div>

      {loading ? (
        <div className="overflow-x-auto">
          <div className="flex gap-8 px-4 sm:px-6 pb-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="w-72 h-96 rounded-3xl" />
            ))}
          </div>
        </div>
      ) : (
        <TrendingRow trending={trending} />
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
            key={item.stream_id}
            className="group relative flex-shrink-0 w-72 bg-gradient-to-b from-gray-900 to-gray-800 border-gray-700 hover:border-gray-600 rounded-3xl overflow-hidden hover:scale-105 transition-all"
          >
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
                  <span>{getQuality(item.container_extension)}</span>
                </div>

                <div className="flex items-center gap-1 text-sm text-white">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
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

/* =================== شبكة الأفلام =================== */
function MovieGrid({
  movies,
  showSkeleton = false,
  skeletonCount = 5,
}: {
  movies: any[]
  showSkeleton?: boolean
  skeletonCount?: number
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {movies.map((m) => (
        <MovieCard key={m.stream_id} movie={m} />
      ))}

      {showSkeleton &&
        Array.from({ length: skeletonCount }).map((_, i) => <PosterSkeleton key={`sk-${i}`} />)}
    </div>
  )
}

function MovieCard({ movie: m }: { movie: any }) {
  const router = useRouter()

  return (
    <Card
      onClick={() => router.push(`/movies/${m.stream_id}`)}
      className="group cursor-pointer bg-gradient-to-b from-gray-900 to-gray-800 border-gray-700 hover:border-gray-600 rounded-2xl overflow-hidden hover:scale-105 transition-all"
    >
      <CardContent className="p-0">
        <div className="relative w-full aspect-[2/3]">
          <Image
            fill
            loading="lazy"
            src={m.stream_icon || "/placeholder.svg?height=900&width=600"}
            alt={m.name}
            className="object-cover"
          />

          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            <Badge className="bg-black/50 text-white rounded-full px-3 py-0.5 text-xs backdrop-blur-sm">
              {CATEGORY_MAP[m.category_id] || m.genre || "غير مصنف"}
            </Badge>
            <Badge className="bg-black/40 text-white rounded-full px-2 py-0.5 text-[10px] backdrop-blur-sm">
              {getQuality(m.container_extension)}
            </Badge>
          </div>
        </div>

        <div className="p-4 space-y-2">
          <h4 className="text-base font-bold text-white truncate group-hover:text-gray-300">
            {m.name}
          </h4>

          {(m.description || m.plot) && (
            <p className="text-gray-400 text-xs line-clamp-2">{m.description || m.plot}</p>
          )}

          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {m.year || m.releaseDate?.slice(0, 4) || "—"}
            </span>

            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(m.duration_secs) || m.duration}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[13px] text-white">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            {Number(m.rating_5based || m.rating || 0).toFixed(1)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* =================== useInterval =================== */
function useInterval(cb: () => void, delay: number | null) {
  const saved = useRef(cb)
  useEffect(() => {
    saved.current = cb
  }, [cb])

  useEffect(() => {
    if (delay === null) return
    const id = setInterval(() => saved.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}
