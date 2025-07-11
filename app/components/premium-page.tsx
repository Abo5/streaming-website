/* -----------------------------------------------------------------
   app/components/premium-page.tsx
   ▸ يجلب «Trending Movies» من TMDB ويعرضها كبوسترات طولية 2 : 3
     Hero – محتوى – باقات – مميزات – فئات
------------------------------------------------------------------ */
"use client"

import { useState, useEffect } from "react"
import Image   from "next/image"
import {
  Play, Star, Heart, Download, Eye,
  Crown, Zap, Award, Sparkles, Check,
} from "lucide-react"

import { Button }   from "@/components/ui/button"
import { Badge }    from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useTheme } from "../contexts/theme-context"

/* ================ TMDB Endpoint ================ */
const TMDB_URL =
  "https://api.themoviedb.org/3/trending/movie/day?language=en-US&api_key=753012cd1b6d7ae52c92c79ff2c748e6"

/* ================ Skeleton ================ */
const PosterSkeleton = () => (
  <div className="w-full aspect-[2/3] bg-gray-800/60 border border-gray-700 rounded-2xl animate-pulse" />
)

/* ================ Types ================ */
type TMDBMovie = {
  id:           number
  title:        string
  poster_path:  string | null
  release_date: string
  vote_average: number
  popularity:   number
}

type PremiumItem = {
  id:      number
  title:   string
  image:   string
  rating:  number
  year:    string
  views:   string
  quality: string
}

/* =====================================================================
                                Component
===================================================================== */
export default function PremiumPage() {
  const { theme }         = useTheme()
  const [items, setItems] = useState<PremiumItem[]>([])
  const [loading, setLoading] = useState(true)

  /* ---- Fetch TMDB once ---- */
  useEffect(()=>{
    fetch(TMDB_URL)
      .then(r=>r.json())
      .then(({results}:{results:TMDBMovie[]})=>{
        const mapped:PremiumItem[] = results.slice(0,40).map(m=>({
          id     : m.id,
          title  : m.title,
          image  : m.poster_path
            ? `https://image.tmdb.org/t/p/w600_and_h900_bestv2${m.poster_path}`
            : "/placeholder.svg?height=900&width=600",
          rating : +m.vote_average.toFixed(1),
          year   : m.release_date?.slice(0,4) || "—",
          views  : Intl.NumberFormat("en").format(Math.round(m.popularity*10)),
          quality: "4K HDR",
        }))
        setItems(mapped)
      })
      .catch(console.error)
      .finally(()=>setLoading(false))
  },[])

  /* ---- ثابتات الأقسام الأخرى ---- */
  const premiumFeatures = [
    { icon:<Crown className="w-6 h-6"/>,    title:"محتوى حصري",  description:"أفلام ومسلسلات لا تجدها إلا هنا" },
    { icon:<Zap className="w-6 h-6"/>,      title:"جودة 4K HDR", description:"صورة أوضح وصوت محيطي" },
    { icon:<Award className="w-6 h-6"/>,    title:"بدون إعلانات",description:"مشاهدة بلا انقطاع" },
    { icon:<Sparkles className="w-6 h-6"/>, title:"وصول مبكر",   description:"الحلقات والأفلام قبل الجميع" },
  ]

  const categories = [
    { name:"أفلام حصرية", count:145, color:"bg-yellow-500" },
    { name:"مسلسلات مميزة", count:89,  color:"bg-orange-500" },
    { name:"وثائقيات",      count:56,  color:"bg-purple-500" },
    { name:"محتوى أصلي",    count:78,  color:"bg-blue-500"   },
    { name:"أفلام كلاسيكية", count:134, color:"bg-green-500" },
    { name:"محتوى عائلي",   count:67,  color:"bg-pink-500"   },
    { name:"رياضة",         count:43,  color:"bg-red-500"    },
    { name:"موسيقى",        count:92,  color:"bg-indigo-500" },
  ]

  return (
    <div className="min-h-screen">
      {/* ===== HERO ===== */}
      <HeroSection/>

      {/* ===== PREMIUM CONTENT ===== */}
      <PremiumContentSection theme={theme} items={items} loading={loading}/>

      {/* ===== PRICING ===== */}
      <PricingPlans theme={theme}/>

      {/* ===== FEATURES ===== */}
      <FeaturesGrid theme={theme} features={premiumFeatures}/>

      {/* ===== CATEGORIES ===== */}
      <CategoriesGrid theme={theme} categories={categories}/>
    </div>
  )
}

/* =====================================================================
                           Sub‑components
===================================================================== */
function HeroSection(){
  return(
    <section className="relative h-96 overflow-hidden bg-gradient-to-r from-yellow-900 via-orange-900 to-red-900">
      <div className="absolute inset-0 bg-black/50"/>
      <div className="relative z-10 container mx-auto px-4 sm:px-6 h-full flex items-center">
        <div className="max-w-2xl space-y-6">
          <div className="flex items-center gap-3 gap-reverse">
            <h1 className="text-4xl sm:text-6xl font-black text-white">المحتوى المميز</h1>
            <Crown className="w-8 h-8 text-yellow-400"/>
          </div>
          <p className="text-lg text-white/80">استمتع بأفضل الأفلام والمسلسلات الحصرية بدقة 4K HDR</p>
          <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold px-8 py-3 rounded-full text-lg shadow-2xl hover:scale-105 transition-all flex items-center gap-2">
            اشترك الآن <Crown className="w-5 h-5"/>
          </Button>
        </div>
      </div>
    </section>
  )
}

/* ---------- المحتوى الحصري ---------- */
function PremiumContentSection({theme,items,loading}:{theme:string;items:PremiumItem[];loading:boolean}){
  return(
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 mb-8">
        <h3 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${theme==="dark"?"text-white":"text-black"}`}>
          المحتوى الحصري المميز
        </h3>
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({length:20}).map((_,i)=><PosterSkeleton key={i}/>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {items.map(item=> <PremiumCard key={item.id} item={item} theme={theme}/>)}
          </div>
        )}
      </div>
    </section>
  )
}

/* ---------- Pricing Plans | تصميم جديد ---------- */
function PricingPlans({theme}:{theme:string}){
  const PLAN_STYLE = (bg:string, shadow=false)=>`${bg} ${shadow?"shadow-xl":""} transition-all rounded-2xl overflow-hidden`
  const text      = theme==="dark"?"text-white":"text-black"
  const subtext   = theme==="dark"?"text-gray-400":"text-gray-600"

  return(
    <section className="container mx-auto px-4 sm:px-6 py-16">
      <h2 className={`text-2xl sm:text-3xl font-bold mb-12 text-center ${text}`}>اختر الباقة المناسبة لك</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">

        {/* Basic */}
        <Card className={PLAN_STYLE(
          theme==="dark"
            ? "bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 hover:border-gray-600"
            : "bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-300 hover:border-gray-400"
        )}>
          <CardContent className="p-8 flex flex-col h-full text-center space-y-6">
            <Header title="الباقة الأساسية" subtitle="للمشاهدة العادية" text={text} subtext={subtext}/>
            <Price price="29 ر.س" period="شهرياً" text={text} subtext={subtext}/>
            <Features list={["جودة HD","جهاز واحد","مكتبة محدودة","إعلانات قليلة"]} bullet="bg-blue-500" subtext={subtext}/>
            <Button className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full py-3 font-semibold">اختر هذه الباقة</Button>
          </CardContent>
        </Card>

        {/* Premium */}
        <Card className={`relative scale-105 ${PLAN_STYLE(
          theme==="dark"
            ? "bg-gradient-to-b from-yellow-900/30 to-orange-900/30 border border-yellow-500/50 hover:border-yellow-400/70"
            : "bg-gradient-to-b from-yellow-50/80 to-orange-50/80 border border-yellow-400/60 hover:border-yellow-500/80"
        ,true)}`}>
          <div className="absolute top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-4 py-1 rounded-full font-bold">الأكثر شعبية</Badge>
          </div>
          <CardContent className="p-8 pt-12 flex flex-col h-full text-center space-y-6">
            <Header title="الباقة المميزة" subtitle="للتجربة المثلى" text={text} subtext={subtext}/>
            <Price price="59 ر.س" period="شهرياً" text={text} subtext={subtext}/>
            <Features list={["جودة 4K HDR","٤ أجهزة في آن واحد","مكتبة كاملة + حصري","بدون إعلانات","تحميل غير محدود"]} bulletIcon={<Crown className="w-4 h-4 text-yellow-400"/>} subtext={subtext}/>
            <Button className="mt-auto mb-8 w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black rounded-full py-3 font-bold">اختر هذه الباقة</Button>
          </CardContent>
        </Card>

        {/* Pro */}
        <Card className={PLAN_STYLE(
          theme==="dark"
            ? "bg-gradient-to-b from-purple-900/30 to-indigo-900/30 border border-purple-500/50 hover:border-purple-400/70"
            : "bg-gradient-to-b from-purple-50/80 to-indigo-50/80 border border-purple-400/60 hover:border-purple-500/80"
        )}>
          <CardContent className="p-8 flex flex-col h-full text-center space-y-6">
            <Header title="الباقة الاحترافية" subtitle="للعائلات الكبيرة" text={text} subtext={subtext}/>
            <Price price="99 ر.س" period="شهرياً" text={text} subtext={subtext}/>
            <Features list={["جودة 8K + Dolby Vision","أجهزة غير محدودة","كل المحتوى + وصول مبكر","بدون إعلانات","تحميل غير محدود","دعم فني أولوية"]} bulletIcon={<Sparkles className="w-4 h-4 text-purple-400"/>} subtext={subtext}/>
            <Button className="mt-auto w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full py-3 font-semibold">اختر هذه الباقة</Button>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

/* --- Pricing Helpers --- */
function Header({title,subtitle,text,subtext}:{title:string;subtitle:string;text:string;subtext:string}){
  return(
    <div className="space-y-2">
      <h3 className={`text-2xl font-bold ${text}`}>{title}</h3>
      <p className={subtext}>{subtitle}</p>
    </div>
  )
}
function Price({price,period,text,subtext}:{price:string;period:string;text:string;subtext:string}){
  return(
    <div className="space-y-1">
      <div className={`text-4xl font-black ${text}`}>{price}</div>
      <div className={subtext}>{period}</div>
    </div>
  )
}
function Features({list,bullet,bulletIcon,subtext}:{list:string[];bullet?:string;bulletIcon?:JSX.Element;subtext:string}){
  return(
    <div className="space-y-3 text-right flex-grow">
      {list.map(t=>(
        <div key={t} className="flex items-center gap-3 gap-reverse">
          {bulletIcon ?? <span className={`w-2 h-2 rounded-full ${bullet ?? "bg-blue-500"} shrink-0`}/>}
          <span className={subtext}>{t}</span>
        </div>
      ))}
    </div>
  )
}

/* ---------- مميزات الاشتراك ---------- */
function FeaturesGrid({theme,features}:{theme:string;features:any[]}){
  return(
    <section className="container mx-auto px-4 sm:px-6 py-12">
      <h2 className={`text-2xl sm:text-3xl font-bold mb-8 text-center ${theme==="dark"?"text-white":"text-black"}`}>مميزات الاشتراك المميز</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f:any,i:number)=>(
          <Card key={i} className={`${theme==="dark"
              ? "bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 hover:border-yellow-400/50"
              : "bg-gradient-to-br from-yellow-100/50 to-orange-100/50 border border-yellow-400/50 hover:border-yellow-500/70"} rounded-xl overflow-hidden hover:scale-105 transition-all`}>
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl mx-auto flex items-center justify-center text-black">
                {f.icon}
              </div>
              <h3 className={`text-lg font-bold ${theme==="dark"?"text-white":"text-black"}`}>{f.title}</h3>
              <p className={`${theme==="dark"?"text-gray-400":"text-gray-600"} text-sm`}>{f.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

/* ---------- الفئات ---------- */
function CategoriesGrid({theme,categories}:{theme:string;categories:any[]}){
  return(
    <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <h3 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-8 sm:mb-12 text-center ${theme==="dark"?"text-white":"text-black"}`}>
        استكشف المحتوى المميز
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {categories.map((cat)=>(
          <Card key={cat.name}
            className={`group rounded-2xl sm:rounded-3xl overflow-hidden hover:scale-105 transition-all cursor-pointer ${
              theme==="dark"
                ? "bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 hover:border-gray-600"
                : "bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 hover:border-gray-400"}`}>
            <CardContent className="p-4 sm:p-6 lg:p-8 text-center space-y-4">
              <div className={`w-12 h-12 sm:w-16 sm:h-16 ${cat.color} rounded-xl sm:rounded-2xl mx-auto flex items-center justify-center`}>
                <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-white"/>
              </div>
              <h4 className={`text-lg sm:text-xl font-bold transition-colors ${theme==="dark"?"text-white group-hover:text-gray-300":"text-black group-hover:text-gray-700"}`}>{cat.name}</h4>
              <p className={`${theme==="dark"?"text-gray-400":"text-gray-600"} text-sm sm:text-base`}>{cat.count} فيلم ومسلسل</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

/* ---------- بطاقة المحتوى ---------- */
function PremiumCard({item,theme}:{item:PremiumItem;theme:string}){
  return(
    <Card className={`group relative w-full rounded-2xl overflow-hidden hover:scale-105 cursor-pointer transition-all
      ${theme==="dark"
        ? "bg-gradient-to-b from-gray-900 to-gray-800 border border-yellow-500/40 hover:border-yellow-400/60"
        : "bg-gradient-to-b from-gray-50 to-gray-100 border border-yellow-400/60 hover:border-yellow-500/70"}`}>

      {/* Badges */}
      <div className="absolute top-2 left-2 z-20">
        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-full px-2 py-0.5 text-[11px] font-bold flex items-center gap-1">
          مميز <Crown className="w-3 h-3"/>
        </Badge>
      </div>
      <div className="absolute top-2 right-2 z-20">
        <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full px-1.5 py-0.5 text-[10px]">{item.quality}</Badge>
      </div>

      <CardContent className="p-0">
        {/* Poster */}
        <div className="relative w-full aspect-[2/3]">
          <Image fill src={item.image} alt={item.title} className="object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
          {/* Overlay buttons */}
          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all">
            <div className="flex items-center justify-between">
              <Button size="icon" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black rounded-full w-7 h-7">
                <Play className="w-3 h-3"/>
              </Button>
              <div className="flex gap-1">
                <Button size="icon" className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full w-7 h-7">
                  <Heart className="w-3 h-3"/>
                </Button>
                <Button size="icon" className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full w-7 h-7">
                  <Download className="w-3 h-3"/>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-3 space-y-1">
          <h4 className={`truncate font-bold text-sm transition-colors ${theme==="dark"?"text-white group-hover:text-gray-300":"text-black group-hover:text-gray-700"}`}>{item.title}</h4>
          <div className={`flex items-center justify-between text-[11px] ${theme==="dark"?"text-gray-400":"text-gray-600"}`}>
            <span>{item.year}</span>
            <span className="flex items-center gap-0.5"><Eye className="w-3 h-3"/>{item.views}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400"/>
            <span className={`text-[12px] font-semibold ${theme==="dark"?"text-white":"text-black"}`}>{item.rating}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
