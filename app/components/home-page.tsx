/* -----------------------------------------------------------------
   app/components/home-page.tsx
   ▸ الرئيسية:
       – Hero ديناميكي
       – شبكة “استكشف حسب النوع”
       – صفوف متعددة (20 بطاقة في كل صف) لأفلام ومسلسلات منفصلة
------------------------------------------------------------------ */
"use client"

import { useMemo } from "react"
import Image from "next/image"
import {
  Play, Plus, Star, Share, Heart,
  Download, Eye, Film,
} from "lucide-react"

import { Button }            from "@/components/ui/button"
import { Badge }             from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

/* ===================== Props ===================== */
interface HomePageProps {
  movies          : any[]
  series          : any[]
  currentShow     : any
  featuredShows   : any[]
  featuredIndex   : number
  setFeaturedIndex: (i: number) => void
}

/* ---------------- مفاتيح التصنيفات ---------------- */
const MOVIE_SECTIONS = [
  { title: "أفلام أكشن",      kws: ["أكشن", "Action"]       },
  { title: "أفلام كوميدية",   kws: ["كوميدي", "Comedy"]     },
  { title: "أفلام دراما",     kws: ["دراما", "Drama"]       },
  { title: "أفلام رعب",       kws: ["رعب", "Horror"]        },
  { title: "أفلام خيال علمي", kws: ["خيال علمي", "Sci‑Fi"] },
  { title: "أفلام حرب",       kws: ["حرب", "War"]           },
];

const SERIES_SECTIONS = [
  { title: "مسلسلات أكشن",      kws: ["أكشن", "Action"]    },
  { title: "مسلسلات كوميدية",   kws: ["كوميدي", "Comedy"]  },
  { title: "مسلسلات درامية",    kws: ["دراما", "Drama"]    },
  { title: "مسلسلات وثائقية",   kws: ["وثائقي", "Doc"]     },
  { title: "مسلسلات خيال علمي", kws: ["خيال علمي", "Sci"] },
];

/* ===================== Component ===================== */
export default function HomePage({
  movies, series,
  currentShow,
  featuredShows,
  featuredIndex,
  setFeaturedIndex,
}: HomePageProps) {

  /* ------------- بناء صفوف حسب الكلمات المفتاحيّة ------------- */
  const movieRows  = useRows(movies, MOVIE_SECTIONS);
  const seriesRows = useRows(series, SERIES_SECTIONS);

  /* ------------------------------ ثابت: شبكة التصنيفات ------------------------------ */
  const categories = [
    { name: "أكشن",        count: 245, color: "bg-red-500"    },
    { name: "دراما",       count: 189, color: "bg-blue-500"   },
    { name: "كوميدي",      count: 156, color: "bg-yellow-500" },
    { name: "رعب",         count: 98,  color: "bg-purple-500" },
    { name: "خيال علمي",   count: 134, color: "bg-green-500"  },
    { name: "رومانسي",     count: 87,  color: "bg-pink-500"   },
    { name: "وثائقي",      count: 76,  color: "bg-orange-500" },
    { name: "إثارة",       count: 112, color: "bg-indigo-500" },
  ]

  /* ------------------------------------------------------------------ Hero data */
  const {
    title       = "—",
    image       = "/placeholder.svg?height=900&width=1600",
    subtitle    = "",
    description = "",
    color       = "from-blue-600 to-purple-700",
    textColor   = "text-white",
    rating      = 0,
    year        = "",
    duration    = "",
    genre       = "",
  } = currentShow ?? {}

  /* ============================ JSX ============================ */
  return (
    <>
      {/* ================================================= Hero */}
      <section className="relative h-screen overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-90`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
        <Image fill priority src={image} alt={title} className="object-cover mix-blend-overlay" />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 h-full flex items-center">
          <div className="max-w-4xl space-y-6">
            {subtitle && (
              <Badge className={`${textColor} bg-white/20 backdrop-blur-sm rounded-full px-3 py-1`}>{subtitle}</Badge>
            )}

            <h2 className="text-5xl sm:text-7xl font-black leading-tight">{title}</h2>

            {description && (
              <p className="text-white/90 text-lg max-w-2xl line-clamp-3">{description}</p>
            )}

            <MetaBar {...{ rating, year, duration, genre }} />

            <div className="flex flex-wrap gap-3">
              <Button className="bg-white text-black rounded-full px-8 py-3 shadow hover:scale-105 transition"><Play className="w-4 h-4 ml-2" />مشاهدة الآن</Button>
              <Button variant="outline" className="border-2 border-white/50 text-white rounded-full px-6 py-3 backdrop-blur-sm hover:bg-white/10 hover:scale-105 transition"><Plus className="w-4 h-4 ml-2" />إضافة</Button>
              <Button variant="outline" className="border-2 border-white/50 text-white rounded-full px-4 py-3 backdrop-blur-sm hover:bg-white/10 hover:scale-105 transition"><Share className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>

        <SlideDots count={featuredShows.length} active={featuredIndex} setActive={setFeaturedIndex} />
      </section>

      {/* ================================================= شبكة التصنيفات */}
      <CategoryGrid categories={categories} />

      {/* ================================================= صفوف الأفلام */}
      {movieRows.map(r => <ContentRow key={r.title} title={r.title} items={r.items} />)}

      {/* ================================================= صفوف المسلسلات */}
      {seriesRows.map(r => <ContentRow key={r.title} title={r.title} items={r.items} />)}
    </>
  )
}

/* =====================================================================
   Hook : يبنى الصفوف (يقتطع 20 عنصرًا)
===================================================================== */
function useRows(arr: any[], defs: { title: string; kws: string[] }[]) {
  return useMemo(() => {
    const has = (item: any, kws: string[]) => kws.some(k => (item.genre ?? item.name ?? "").includes(k))
    const byRating = (a: any, b: any) => (+b.rating_5based || 0) - (+a.rating_5based || 0)

    return defs.map(def => ({
      title: def.title,
      items: arr.filter(i => has(i, def.kws)).sort(byRating).slice(0, 20),
    })).filter(r => r.items.length) // تجاهَل الأقسام الفارغة
  }, [arr, defs])
}

/* =====================================================================
   مكونات فرعية صغيرة
===================================================================== */
const MetaBar = ({ rating, year, duration, genre }: any) => (
  <div className="flex flex-wrap items-center gap-3 text-white/80">
    {!!rating && (
      <span className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />{rating.toFixed(1)}
      </span>
    )}
    {year     && <span className="bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">{year}</span>}
    {duration && <span className="bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">{duration}</span>}
    {genre    && <span className="hidden sm:inline bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">{genre}</span>}
  </div>
)

const SlideDots = ({ count, active, setActive }: { count: number; active: number; setActive: (i: number) => void }) => (
  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <button key={i} aria-label={`الشريحة ${i + 1}`} onClick={() => setActive(i)}
        className={`w-10 h-1 rounded-full ${i === active ? "bg-white" : "bg-white/30 hover:bg-white/50"}`} />
    ))}
  </div>
)

const CategoryGrid = ({ categories }: { categories: any[] }) => (
  <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
    <h3 className="text-3xl font-bold mb-10 text-center">استكشف حسب النوع</h3>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
      {categories.map((cat) => (
        <Card key={cat.name} className="group bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-gray-600 rounded-2xl overflow-hidden hover:scale-105 transition cursor-pointer">
          <CardContent className="p-6 text-center space-y-3">
            <div className={`w-14 h-14 ${cat.color} rounded-xl mx-auto flex items-center justify-center`}><Film className="w-7 h-7 text-white" /></div>
            <h4 className="font-bold text-lg text-white group-hover:text-gray-300 transition">{cat.name}</h4>
            <p className="text-gray-400 text-sm">{cat.count} عنصر</p>
          </CardContent>
        </Card>
      ))}
    </div>
  </section>
)

/* =====================================================================
   صف أفقى لعرض max 20 بطاقة
===================================================================== */
function ContentRow({ title, items }: { title: string; items: any[] }) {
  if (!items.length) return null
  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 mb-6"><h3 className="text-2xl sm:text-3xl font-bold">{title}</h3></div>
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-6 sm:gap-8 px-4 sm:px-6 pb-4">
          {items.map((it, idx) =>
            <ShowCard key={it.stream_id ?? it.series_id ?? idx} item={it} />
          )}
        </div>
      </div>
    </section>
  )
}

/* =====================================================================
   بطاقة فردية (بوستر طولى ٢ : ٣)
===================================================================== */
function ShowCard({ item }: { item: any }) {
  const isMovie  = !!item.stream_id
  const title    = item.name
  const imageSrc = item.stream_icon ?? item.cover ?? "/placeholder.svg?height=900&width=600"
  const year     = (item.releaseDate ?? "").slice(0, 4) || "—"
  const rating   = +item.rating_5based || 0
  const extra    = isMovie ? (item.duration ?? "—") : `${item.episodes ?? "—"} حلقة`

  return (
    <Card className="group relative w-40 sm:w-44 lg:w-48 flex-shrink-0 bg-gradient-to-b from-gray-900 to-gray-800 border-gray-700 hover:border-gray-600 rounded-2xl overflow-hidden hover:scale-105 transition">
      <CardContent className="p-0">
        <div className="relative w-full aspect-[2/3]">
          <Image fill src={imageSrc} alt={title} className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all">
            <div className="flex items-center justify-between">
              <Button size="icon" className="bg-white/80 text-black rounded-full w-7 h-7 hover:scale-110"><Play className="w-3 h-3" /></Button>
              <div className="flex gap-1">
                <Button size="icon" className="bg-white/20 backdrop-blur-sm rounded-full w-7 h-7 hover:bg-white/30"><Heart className="w-3 h-3" /></Button>
                <Button size="icon" className="bg-white/20 backdrop-blur-sm rounded-full w-7 h-7 hover:bg-white/30"><Download className="w-3 h-3" /></Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 space-y-1">
          <h4 className="truncate font-bold text-sm text-white group-hover:text-gray-300">{title}</h4>
          <div className="flex items-center justify-between text-[11px] text-gray-400"><span>{year}</span><span>{extra}</span></div>
          <div className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /><span className="text-[12px]">{rating.toFixed(1)}</span></div>
        </div>
      </CardContent>
    </Card>
  )
}
