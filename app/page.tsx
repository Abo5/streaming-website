/* ----------------------------- app/page.tsx ----------------------------- */
"use client"

/* ===================== imports ===================== */
import {
  useState, useEffect, useRef, type FormEvent,
} from "react"
import {
  Search, User, Bell, Film, Tv, Zap,
  Flame as Fire, Crown, Menu, X, Sun, Moon,
} from "lucide-react"

import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { useTheme } from "./contexts/theme-context"

/* الصفحات الفرعية */
import HomePage     from "./components/home-page"
import MoviesPage   from "./components/movies-page"
import SeriesPage   from "./components/series-page"
import TrendingPage from "./components/trending-page"
import PremiumPage  from "./components/premium-page"

/* استدعاءات API */
import { fetchMovies, fetchSeries } from "./lib/api"

/* ===================== Skeleton UI ===================== */
function SkeletonHero() {
  return (
    <div className="relative h-[450px] sm:h-[550px] w-full overflow-hidden rounded-3xl bg-gray-800 animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-gray-800/50" />
      <div className="absolute bottom-8 left-8 right-8 space-y-3 text-gray-300">
        <div className="h-8  w-2/5 rounded bg-gray-700" />
        <div className="h-4  w-1/3 rounded bg-gray-700" />
        <div className="h-14 w-full max-w-xl rounded bg-gray-700" />
        <div className="flex gap-4">
          <div className="h-10 w-28 rounded-full bg-gray-700" />
          <div className="h-10 w-28 rounded-full bg-gray-700" />
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="aspect-[2/3] w-full rounded-xl bg-gray-800" />
      <div className="h-4 w-3/4 rounded bg-gray-700" />
      <div className="h-3 w-1/2 rounded bg-gray-700" />
    </div>
  )
}

function SkeletonPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 pt-6 space-y-12">
      <SkeletonHero />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  )
}

/* ===================== constants ===================== */
const HERO_FETCH = 20                    // أول دفعة لجلب العروض
const NAV_CLOSED = 400                   // إزاحة الـ Nav العائم
const NAV_OPEN   = 350

/* ===================== component ===================== */
export default function ModernStreamingPlatform() {
  /* --- السمّة (مظلم/فاتح) --- */
  const { theme, setTheme } = useTheme()

  /* --- تبويبات التطبيق --- */
  type Tab = "home" | "movies" | "series" | "trending" | "premium"
  const [activeTab,   setActiveTab]   = useState<Tab>("home")

  /* --- حالة الـ Hero --- */
  const [movies, setMovies]           = useState<any[]>([])
  const [series, setSeries]           = useState<any[]>([])
  const [featuredIdx, setFeaturedIdx] = useState(0)
  const [loadingM, setLoadingM]       = useState(true)
  const [loadingS, setLoadingS]       = useState(true)

  /* --- شريط التنقّل / بحث / تمرير --- */
  const [isScrolled,  setIsScrolled]  = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  /* ============ fetch first batch ============ */
  useEffect(() => {
    /* جلب دفعة واحدة فقط للترويسة */
    fetchMovies(1, HERO_FETCH, "")
      .then(setMovies)
      .catch(console.error)
      .finally(() => setLoadingM(false))

    fetchSeries(1, HERO_FETCH, "")
      .then(setSeries)
      .catch(console.error)
      .finally(() => setLoadingS(false))
  }, [])

  /* ============ featured data ============ */
  const featuredShows = [...movies, ...series].slice(0, 3).map((item) => ({
    id:          item.stream_id ?? item.series_id,
    title:       item.name,
    subtitle:    item.genre ?? "",
    description: item.plot ?? "",
    rating:      Number(item.rating_5based || 0),
    year:        (item.releaseDate ?? "").slice(0, 4),
    genre:       item.genre ?? "",
    image:       item.stream_icon ?? item.cover ?? "/placeholder.svg?height=900&width=1600",
    color:       "from-blue-600 to-purple-700",
    textColor:   "text-white",
  }))
  const currentShow = featuredShows[featuredIdx]

  /* تدوير الشرائح كل 6 ثوانٍ */
  useEffect(() => {
    if (featuredShows.length < 2) return
    const id = setInterval(() => setFeaturedIdx((i) => (i + 1) % featuredShows.length), 6_000)
    return () => clearInterval(id)
  }, [featuredShows.length])

  /* ظل الـ App‑Bar عند التمرير */
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  /* ============ بحث سريع ============ */
  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // هنا يمكنك توجيه المستخدم لصفحة نتائج البحث
      console.log("بحث:", searchQuery)
    }
  }

  /* ============ navigation offset ============ */
  const navOffsetX = searchOpen ? NAV_OPEN : NAV_CLOSED
  const homeLoading = loadingM || loadingS || !currentShow

  /* ============ المحتوى حسب التبويب ============ */
  const renderContent = () => {
    switch (activeTab) {
      case "movies":   return <MoviesPage />
      case "series":   return <SeriesPage />
      case "trending": return <TrendingPage />
      case "premium":  return <PremiumPage />
      /* home */
      default: return homeLoading
        ? <SkeletonPage />
        : (
          <HomePage
            movies={movies}
            series={series}
            currentShow={currentShow}
            featuredShows={featuredShows}
            featuredIndex={featuredIdx}
            setFeaturedIndex={setFeaturedIdx}
          />
        )
    }
  }

  /* ============ NAV tabs ============ */
  const NAV_TABS = [
    { id: "home",     label: "الرئيسية",      icon: <Zap   className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: "movies",   label: "أفلام",         icon: <Film  className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: "series",   label: "مسلسلات",       icon: <Tv    className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: "trending", label: "الأكثر مشاهدة", icon: <Fire  className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: "premium",  label: "المميز",        icon: <Crown className="w-4 h-4 sm:w-5 sm:h-5" /> },
  ] as const

  /* ===================== JSX ===================== */
  return (
    <div className={`min-h-screen overflow-x-hidden ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}>

      {/* Nav عائم (شاشة كبيرة) */}
      <nav
        className={`hidden lg:block fixed z-50 transition-all duration-500 ${isScrolled ? "scale-95 opacity-95" : "scale-100 opacity-100"}`}
        style={{ top: 8, right: navOffsetX }}
      >
        <div className={`${theme === "dark" ? "bg-white/10 border-white/20" : "bg-black/10 border-black/20"} backdrop-blur-2xl rounded-full border px-2 py-2 shadow-2xl`}>
          <div className="flex items-center gap-1">
            {NAV_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as Tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                  activeTab === t.id
                    ? theme === "dark" ? "bg-white text-black shadow-lg" : "bg-black text-white shadow-lg"
                    : theme === "dark" ? "text-white/70 hover:text-white hover:bg-white/10"
                                       : "text-black/70 hover:text-black hover:bg-black/10"
                }`}
              >
                <span className="font-medium text-sm xl:text-base">{t.label}</span>
                {t.icon}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Nav سفلي (جوال) */}
      <nav className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
        <div className={`${theme === "dark" ? "bg-white/10 border-white/20" : "bg-black/10 border-black/20"} backdrop-blur-2xl rounded-2xl border px-4 py-3 shadow-2xl`}>
          <div className="flex items-center justify-around">
            {NAV_TABS.slice(0, 4).map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as Tab)}
                className={`flex flex-col items-center space-y-1 px-2 py-1 rounded-xl transition-all duration-300 ${
                  activeTab === t.id
                    ? theme === "dark" ? "bg-white/20 text-white" : "bg-black/20 text-black"
                    : theme === "dark" ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black"
                }`}
              >
                {t.icon}
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            ))}

            {/* زر المزيد */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`${theme === "dark" ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black"} flex flex-col items-center space-y-1 px-2 py-1 rounded-xl transition-all duration-300`}
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              <span className="text-xs font-medium">المزيد</span>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)}>
            <div className={`${theme === "dark" ? "bg-white/10 border-white/20" : "bg-black/10 border-black/20"} absolute bottom-20 left-4 right-4 backdrop-blur-2xl rounded-2xl border p-4`}>
              <button
                onClick={() => { setActiveTab("premium"); setMobileOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === "premium"
                    ? theme === "dark" ? "bg-white/20 text-white" : "bg-black/20 text-black"
                    : theme === "dark" ? "text-white/70 hover:text-white hover:bg-white/10"
                                       : "text-black/70 hover:text-black hover:bg-black/10"
                }`}
              >
                {NAV_TABS[4].icon}
                <span className="font-medium">{NAV_TABS[4].label}</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* شريط أعلى */}
      <header className={`fixed top-0 left-0 right-0 z-40 ${theme === "dark" ? "bg-black/50 border-white/10" : "bg-white/50 border-black/10"} backdrop-blur-xl border-b`}>
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <h1 className={`text-xl sm:text-2xl font-bold bg-gradient-to-r ${theme === "dark" ? "from-white to-gray-300" : "from-black to-gray-700"} bg-clip-text text-transparent`}>
            StreamVibe
          </h1>

          {/* أدوات يمين */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* بحث سريع */}
            <div className="relative">
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                  <Input
                    placeholder="ابحث عن أي شيء..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-48 lg:w-64 rounded-full backdrop-blur-sm text-sm transition-all"
                    autoFocus
                  />
                  <Button type="button" size="icon" variant="ghost" className="rounded-full p-2 mr-2" onClick={() => setSearchOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </form>
              ) : (
                <Button size="icon" variant="ghost" className="rounded-full p-2" onClick={() => setSearchOpen(true)}>
                  <Search className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* تبديل السمّة */}
            <Button size="icon" variant="ghost" className="rounded-full p-2" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {/* إشعارات / حساب */}
            <Button size="icon" variant="ghost" className="rounded-full p-2"><Bell className="w-4 h-4" /></Button>
            <Button size="icon" variant="ghost" className="rounded-full p-2"><User className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      {/* ************** main content ************** */}
      <main className="pt-16 sm:pt-20">{renderContent()}</main>

      {/* ************** footer (ثابت) ************** */}
      <footer className={`${theme === "dark" ? "bg-black border-gray-800" : "bg-gray-100 border-gray-300"} border-t py-12 sm:py-16 pb-20 lg:pb-16`}>
        <div className="container mx-auto px-4 sm:px-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className="font-bold text-lg mb-4">حول StreamVibe</h2>
            <p className="text-sm leading-relaxed opacity-80">
              منصة بث حديثة تتيح لك مشاهدة أحدث الأفلام والمسلسلات مباشرة من مصدرها.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-lg mb-4">روابط سريعة</h2>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => setActiveTab("home")}     className="hover:underline">الرئيسية</button></li>
              <li><button onClick={() => setActiveTab("movies")}   className="hover:underline">أفلام</button></li>
              <li><button onClick={() => setActiveTab("series")}   className="hover:underline">مسلسلات</button></li>
              <li><button onClick={() => setActiveTab("trending")} className="hover:underline">الأكثر مشاهدة</button></li>
              <li><button onClick={() => setActiveTab("premium")}  className="hover:underline">المميز</button></li>
            </ul>
          </div>

          <div>
            <h2 className="font-bold text-lg mb-4">تابعنا</h2>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:underline">تويتر</a></li>
              <li><a href="#" className="hover:underline">فيسبوك</a></li>
              <li><a href="#" className="hover:underline">إنستغرام</a></li>
            </ul>
          </div>

          <div>
            <h2 className="font-bold text-lg mb-4">الدعم</h2>
            <p className="text-sm leading-relaxed opacity-80">
              لأي استفسار أو مشكلة، راسلنا على:
              <br />
              <a href="mailto:support@streamvibe.com" className="underline">support@streamvibe.com</a>
            </p>
          </div>
        </div>

        <div className="mt-10 text-center text-xs opacity-70">
          © {new Date().getFullYear()} StreamVibe. جميع الحقوق محفوظة.
        </div>
      </footer>

      {/* ************** util styles ************** */}
      <style jsx global>{`
        .scrollbar-hide               { -ms-overflow-style:none; scrollbar-width:none; }
        .scrollbar-hide::-webkit-scrollbar { display:none; }
        .truncate                     { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      `}</style>
    </div>
  )
}
