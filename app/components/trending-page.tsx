/* -----------------------------------------------------------------
   app/components/trending-page.tsx
   ▸ الأكثر مشاهدة – تحميل دفعة واحدة بلا تمرير ∞
------------------------------------------------------------------ */
"use client"

import { useState, useEffect } from "react"
import Image   from "next/image"
import {
  Play, Star, Heart, Download, Eye, Award,
  Film, Flame as Fire,
} from "lucide-react"

import { Button }   from "@/components/ui/button"
import { Badge }    from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { fetchMovies, fetchSeries } from "../lib/api"
import { useTheme } from "../contexts/theme-context"

/* ثابت واحد لأننا لن نجلب صفحات إضافية */
const PAGE_SIZE = 24

/* ======= سكيلتون بطاقة ======= */
const CardSkeleton = () => (
  <div className="w-64 sm:w-72 lg:w-80 overflow-hidden rounded-2xl bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 animate-pulse">
    <div className="h-40 bg-gray-700/50" />
    <div className="p-6 space-y-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  </div>
)

/* =====================================================================
                         المكوّن الرئيسى
===================================================================== */
export default function TrendingPage() {
  const { theme } = useTheme()

  const [movies, setMovies]   = useState<any[]>([])
  const [series, setSeries]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  /* جلب دفعة واحدة فقط */
  useEffect(() => {
    Promise.all([
      fetchMovies(1, PAGE_SIZE),
      fetchSeries(1, PAGE_SIZE),
    ]).then(([mv, sr]) => {
      setMovies(mv)
      setSeries(sr)
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen">
      <HeroSection theme={theme}/>
      <CategoriesGrid theme={theme}/>

      <ListSection
        title="أفلام الأكثر مشاهدة"
        items={movies}
        loading={loading}
        theme={theme}
      />

      <ListSection
        title="مسلسلات الأكثر مشاهدة"
        items={series}
        loading={loading}
        theme={theme}
      />
    </div>
  )
}

/* ------------------------------------------------------------------
   العناصر الفرعيّة (دون تغيير يذكر عن النسخة السابقة)
------------------------------------------------------------------ */
function HeroSection({ theme }: { theme: string }) {
  return (
    <section className="relative h-96 overflow-hidden bg-gradient-to-r from-red-900 via-orange-900 to-yellow-900">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 container mx-auto px-4 sm:px-6 h-full flex items-center">
        <div className="max-w-2xl space-y-6">
          <div className="flex items-center space-x-3 space-x-reverse">
            <h1 className="text-4xl sm:text-6xl font-black text-white">الأكثر مشاهدة</h1>
            <Fire className="w-8 h-8 text-orange-400" />
          </div>
          <p className="text-lg text-white/80">اكتشف المحتوى الأكثر شعبية هذا الأسبوع</p>
          <div className="flex items-center gap-4">
            <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 px-4 py-2 flex items-center">
              تحديث مباشر <Fire className="w-4 h-4 ml-2" />
            </Badge>
            <Badge className="bg-red-500/20 text-red-300 border-red-500/30 px-4 py-2 flex items-center">
              الأعلى تقييماً <Award className="w-4 h-4 ml-2" />
            </Badge>
          </div>
        </div>
      </div>
    </section>
  )
}

function CategoriesGrid({ theme }: { theme: string }) {
  const cats   = ["دراما","أكشن","خيال علمي","كوميدي","رعب","رومانسي","وثائقي","إثارة"]
  const colors = ["bg-blue-500","bg-red-500","bg-green-500","bg-yellow-500",
                  "bg-purple-500","bg-pink-500","bg-orange-500","bg-indigo-500"]
  return (
    <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <h3 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-8 sm:mb-12 text-center ${theme==="dark"?"text-white":"text-black"}`}>
        استكشف حسب النوع
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {cats.map((c,i)=>(
          <Card key={c} className={`group rounded-2xl sm:rounded-3xl overflow-hidden hover:scale-105 cursor-pointer transition-all
            ${theme==="dark"
              ? "bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 hover:border-gray-600"
              : "bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 hover:border-gray-400"}`}>
            <CardContent className="p-4 sm:p-6 lg:p-8 text-center space-y-4">
              <div className={`w-12 h-12 sm:w-16 sm:h-16 ${colors[i]} rounded-xl sm:rounded-2xl mx-auto flex items-center justify-center`}>
                <Film className="w-6 h-6 sm:w-8 sm:h-8 text-white"/>
              </div>
              <h4 className={`text-lg sm:text-xl font-bold transition-colors ${theme==="dark"?"text-white group-hover:text-gray-300":"text-black group-hover:text-gray-700"}`}>
                {c}
              </h4>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function ListSection({
  title, items, loading, theme,
}: {
  title: string; items: any[]; loading: boolean; theme: string;
}) {
  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 mb-6 sm:mb-8">
        <h3 className={`text-xl sm:text-2xl lg:text-4xl font-bold ${theme==="dark"?"text-white":"text-black"}`}>{title}</h3>
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-6 sm:gap-8 px-4 sm:px-6 pb-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={`sk-${i}`} />)
            : items.map((it, idx) => <TrendingCard key={it.stream_id ?? it.series_id} idx={idx} item={it} theme={theme}/>)}
        </div>
      </div>
    </section>
  )
}

/* ----- بطاقة الترند ----- */
function TrendingCard({ idx, item, theme }:{ idx:number; item:any; theme:string }) {
  const title = item.name  ?? item.title
  const year  = item.year  ?? item.releaseDate?.slice(0,4) ?? "—"
  const img   = item.stream_icon || item.cover || "/placeholder.svg?height=400&width=300"
  const isMovie = 'stream_id' in item

  return (
    <Card className={`group relative flex-shrink-0 w-64 sm:w-72 lg:w-80 rounded-2xl sm:rounded-3xl overflow-hidden hover:scale-105 cursor-pointer transition-all
      ${theme==="dark"
        ? "bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 hover:border-gray-600"
        : "bg-gradient-to-b from-gray-100 to-gray-200 border border-gray-300 hover:border-gray-400"}`}>
      <div className={`absolute top-4 sm:top-6 left-4 sm:left-6 font-black text-6xl sm:text-7xl lg:text-8xl select-none z-20 bg-gradient-to-r ${theme==="dark"?"from-gray-400":"from-gray-600"} to-transparent bg-clip-text text-transparent`}>
        {idx+1}
      </div>

      <CardContent className="p-0">
        <div className="relative">
          <Image src={img} alt={title} width={320} height={180} className="w-full h-40 sm:h-44 lg:h-48 object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
            <Badge className="bg-black/50 text-white backdrop-blur-sm rounded-full px-2 sm:px-3 py-1 text-xs sm:text-sm">
              {isMovie ? "فيلم" : "مسلسل"}
            </Badge>
          </div>
          <OverlayButtons/>
        </div>

        <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
          <h4 className={`truncate font-bold text-lg sm:text-xl transition-colors ${theme==="dark"?"text-white group-hover:text-gray-300":"text-black group-hover:text-gray-700"}`}>{title}</h4>

          <div className={`flex items-center justify-between text-xs sm:text-sm ${theme==="dark"?"text-gray-400":"text-gray-600"}`}>
            <span>{year}</span>
            <div className="flex items-center gap-1"><Eye className="w-3 h-3 sm:w-4 sm:h-4"/><span>{item.views ?? "—"}</span></div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400"/>
              <span className={`font-semibold text-sm sm:text-base ${theme==="dark"?"text-white":"text-black"}`}>
                {Number(item.rating ?? item.rating_5based ?? 0).toFixed(1)}
              </span>
            </div>
            <span className={`truncate max-w-[100px] text-xs sm:text-sm ${theme==="dark"?"text-gray-400":"text-gray-600"}`}>
              {item.duration ?? item.episodes ?? ""}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function OverlayButtons() {
  return (
    <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all">
      <div className="flex items-center justify-between">
        <Button size="icon" className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full w-8 h-8 sm:w-10 sm:h-10">
          <Play className="w-3 h-3 sm:w-4 sm:h-4"/>
        </Button>
        <div className="flex gap-2">
          <Button size="icon" className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full w-8 h-8 sm:w-10 sm:h-10">
            <Heart className="w-3 h-3 sm:w-4 sm:h-4"/>
          </Button>
          <Button size="icon" className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full w-8 h-8 sm:w-10 sm:h-10">
            <Download className="w-3 h-3 sm:w-4 sm:h-4"/>
          </Button>
        </div>
      </div>
    </div>
  )
}
