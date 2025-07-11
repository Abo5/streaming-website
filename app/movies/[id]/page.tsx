/* -----------------------------------------------------------------
   app/movies/[id]/page.tsx
   صفحة تفاصيل فيلم – مع زر «العودة للـ أفلام» وحراسة كاملة
------------------------------------------------------------------ */
"use client"

import {
  useEffect,
  useState,
} from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import {
  Play,
  Star,
  Video,
  Music,
  User,
  ArrowLeft,           // ← أيقونة الرجوع
} from "lucide-react"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"

import {
  fetchMovieDetail,
  fetchStreamUrl,
} from "@/app/lib/api"

/* ===== ثابت TMDB ===== */
const API_KEY = "753012cd1b6d7ae52c92c79ff2c748e6"
const IMG = (p: string | null, w = 185) =>
  p ? `https://image.tmdb.org/t/p/w${w}${p}` : null

/* ===== مكوّن كارت الشخص ===== */
type PersonItem = {
  credit_id: string
  name: string
  profile_path: string | null
  role: "ممثل" | "مخرج"
}

const PersonCard: React.FC<{
  person: PersonItem
  onClick: (id: string) => void
}> = ({ person, onClick }) => (
  <button
    onClick={() => onClick(person.credit_id)}
    className="flex flex-col items-center gap-1 w-24 shrink-0 focus:outline-none"
  >
    <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
      {person.profile_path ? (
        <Image
          src={IMG(person.profile_path, 200)!}
          alt={person.name}
          width={80}
          height={80}
          className="object-cover"
        />
      ) : (
        <User className="w-8 h-8 text-white/60" />
      )}
    </div>
    <span className="text-xs text-white text-center leading-tight">
      {person.name}
    </span>
    <span className="text-[10px] text-white/50">{person.role}</span>
  </button>
)

/* ===== الصفحة الرئيسية ===== */
export default function MovieDetailPage() {
  const router = useRouter()

  /* ---------- المعرّف من المسار ---------- */
  const { id } = useParams<{ id: string }>()
  const vodId = Number(id)

  /* ---------- حالة البيانات ---------- */
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [people, setPeople] = useState<PersonItem[]>([])

  /* ---------- حالة تشغيل الفيديو ---------- */
  const [playerUrl, setPlayerUrl] = useState<string | null>(null)
  const [playerOpen, setPlayerOpen] = useState(false)

  /* ---------- جلب بيانات الفيلم ---------- */
  useEffect(() => {
    if (!vodId) return
    fetchMovieDetail(vodId)
      .then((res) => {
        if (res?.error) {
          console.error("[MovieDetail]", res.error)
          setData(null)
        } else {
          setData(res)
        }
      })
      .catch((err) => {
        console.error(err)
        setData(null)
      })
      .finally(() => setLoading(false))
  }, [vodId])

  /* ---------- جلب طاقم العمل من TMDB ---------- */
  useEffect(() => {
    const tmdbId = data?.info?.tmdb_id
    if (!tmdbId) return
    const fetchCredits = async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/${tmdbId}/credits?api_key=${API_KEY}&language=ar`,
        )
        const credits = await res.json()
        const directors = credits.crew
          .filter((c: any) => c.job === "Director")
          .map(
            (d: any): PersonItem => ({
              credit_id: d.credit_id,
              name: d.name,
              profile_path: d.profile_path,
              role: "مخرج",
            }),
          )
        const cast = credits.cast.map(
          (c: any): PersonItem => ({
            credit_id: c.credit_id,
            name: c.name,
            profile_path: c.profile_path,
            role: "ممثل",
          }),
        )
        setPeople([...directors, ...cast])
      } catch (err) {
        console.error(err)
      }
    }
    fetchCredits()
  }, [data?.info?.tmdb_id])

  /* ---------- تشغيل الفيلم ---------- */
  const handlePlay = async () => {
    if (!data?.movie_data) return
    const res = await fetchStreamUrl(
      data.movie_data.stream_id,
      data.movie_data.container_extension,
    )
    setPlayerUrl(res.url)
    setPlayerOpen(true)
  }

  /* ---------- حماية أثناء التحميل ---------- */
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-black text-white">…تحميل</div>
  }
  if (!data || !data.movie_data || !data.info) {
    return <div className="min-h-screen flex items-center justify-center bg-black text-white">لا توجد بيانات لهذا الفيلم</div>
  }

  const { info, movie_data } = data

  const renderStars = (r: number) =>
    Array.from({ length: 10 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.round(r) ? "fill-yellow-400 text-yellow-400" : "text-white/30"
        }`}
      />
    ))

  return (
    <main dir="rtl" className="text-white">

      {/* ===== زر العودة أعلى الصفحة ===== */}
      <div className="fixed top-6 left-6 z-50">
        <Button
          variant="secondary"
          onClick={() => router.back()}
          className="flex items-center gap-1 rounded-full px-4 py-2 backdrop-blur-lg"
        >
          <ArrowLeft className="h-4 w-4" />
          العودة
        </Button>
      </div>

      {/* ===== الهيرو ===== */}
      <section className="relative h-[65vh] w-full">
        <Image
          src={
            info?.backdrop_path?.[0]
            ?? info?.movie_image
            ?? "/placeholder.svg?height=720&width=1280"
          }
          alt={movie_data?.name ?? "Movie"}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/60 to-black/95" />
        <div className="relative z-10 h-full flex items-end">
          <div className="container mx-auto px-4 sm:px-6 flex gap-6 pb-8">
            <div className="hidden md:block w-[170px] lg:w-[200px] shrink-0">
              <AspectRatio ratio={2 / 3} className="shadow-2xl rounded-lg">
                <Image
                  src={info?.movie_image ?? "/placeholder.svg?height=600&width=400"}
                  alt={movie_data?.name ?? "Poster"}
                  fill
                  className="object-cover rounded-lg"
                />
              </AspectRatio>
            </div>
            <div className="flex-1 space-y-4 text-right">
              <h1 className="text-3xl sm:text-5xl font-extrabold">
                {movie_data?.name ?? "—"}
              </h1>
              <div className="flex flex-wrap justify-end items-center gap-2 text-sm">
                {info?.genre && <Badge>{info.genre}</Badge>}
                {info?.year && <Badge variant="secondary">{info.year}</Badge>}
                {info?.duration && <Badge variant="secondary">{info.duration}</Badge>}
                {info?.mpaa && <Badge variant="secondary">{info.mpaa}</Badge>}
              </div>
              {info?.plot && (
                <p className="text-white/80 max-w-2xl">{info.plot}</p>
              )}
              <div className="flex justify-end gap-3">
                <Button
                  onClick={handlePlay}
                  className="bg-primary rounded-full px-6 py-3"
                >
                  <Play className="h-4 w-4 ml-1" />
                  مشاهدة
                </Button>
                {info?.youtube_trailer && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="rounded-full px-5 py-3"
                      >
                        مشاهدة التريلر
                      </Button>
                    </DialogTrigger>
                    <DialogContent
                      dir="rtl"
                      className="max-w-3xl"
                    >
                      <DialogHeader>
                        <DialogTitle className="text-xl">
                          التريلر
                        </DialogTitle>
                      </DialogHeader>
                      <AspectRatio
                        ratio={16 / 9}
                        className="rounded-lg overflow-hidden"
                      >
                        <iframe
                          src={`https://www.youtube.com/embed/${info.youtube_trailer}`}
                          title="Trailer"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      </AspectRatio>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== بيانات الفيلم ===== */}
      <section className="container mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-2">بيانات الفيلم</h2>
            <ul className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <li className="font-semibold">الاسم:</li>
              <li>{movie_data?.name ?? "—"}</li>

              <li className="font-semibold">المعرّف (TMDB):</li>
              <li>{info?.tmdb_id ?? "—"}</li>

              {info?.rating && (
                <>
                  <li className="font-semibold">التصنيف:</li>
                  <li className="flex items-center gap-1">
                    {renderStars(parseFloat(info.rating))}
                    {info.rating}
                  </li>
                </>
              )}

              {info?.year && (
                <>
                  <li className="font-semibold">سنة الإصدار:</li>
                  <li>{info.year}</li>
                </>
              )}

              {info?.duration && (
                <>
                  <li className="font-semibold">المدة:</li>
                  <li>{info.duration}</li>
                </>
              )}

              {info?.releasedate && (
                <>
                  <li className="font-semibold">تاريخ الإصدار:</li>
                  <li>{info.releasedate}</li>
                </>
              )}

              {info?.mpaa && (
                <>
                  <li className="font-semibold">مستوى MPAA:</li>
                  <li>{info.mpaa}</li>
                </>
              )}

              {info?.bitrate && (
                <>
                  <li className="font-semibold">البِت ريت:</li>
                  <li>{info.bitrate} kbps</li>
                </>
              )}
            </ul>
          </div>

          {/* ===== بيانات تقنية ===== */}
          <div className="space-y-6 text-right">
            <h2 className="text-2xl font-bold">تفاصيل تقنية</h2>
            <div className="flex flex-wrap gap-4 justify-start lg:justify-end">
              {info?.video && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="secondary"
                      className="flex items-center gap-1 px-4 py-2"
                    >
                      <Video className="h-5 w-5" />
                      مواصفات الفيديو
                    </Button>
                  </DialogTrigger>
                  <DialogContent dir="rtl" className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-1 text-xl">
                        <Video className="h-5 w-5" />
                        مواصفات الفيديو
                      </DialogTitle>
                    </DialogHeader>
                    <Table>
                      <TableBody>
                        {Object.entries(info.video).map(([k, v]) => (
                          <TableRow key={k}>
                            <TableHead className="font-semibold">{k}</TableHead>
                            <TableCell>{String(v)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </DialogContent>
                </Dialog>
              )}

              {info?.audio && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="secondary"
                      className="flex items-center gap-1 px-4 py-2"
                    >
                      <Music className="h-5 w-5" />
                      مواصفات الصوت
                    </Button>
                  </DialogTrigger>
                  <DialogContent dir="rtl" className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-1 text-xl">
                        <Music className="h-5 w-5" />
                        مواصفات الصوت
                      </DialogTitle>
                    </DialogHeader>
                    <Table>
                      <TableBody>
                        {Object.entries(info.audio).map(([k, v]) => (
                          <TableRow key={k}>
                            <TableHead className="font-semibold">{k}</TableHead>
                            <TableCell>{String(v)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== طاقم العمل ===== */}
      {people.length > 0 && (
        <section className="container mx-auto px-4 sm:px-6 py-10 text-right">
          <h2 className="text-2xl font-bold mb-4">طاقم العمل</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {people.map((p) => (
              <PersonCard
                key={p.credit_id}
                person={p}
                onClick={() => {}}
              />
            ))}
          </div>
        </section>
      )}

      {/* ===== مشغل الفيديو ===== */}
      <Dialog open={playerOpen} onOpenChange={setPlayerOpen}>
        <DialogContent dir="rtl" className="p-0 max-w-4xl overflow-hidden">
          {playerUrl ? (
            <video
              src={playerUrl}
              controls
              autoPlay
              className="w-full h-full bg-black"
              style={{ aspectRatio: "16/9" }}
            />
          ) : (
            <div className="w-full h-[50vh] flex items-center justify-center bg-black">
              لا يمكن تحميل الفيديو
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== مقترحات مبدئية ===== */}
      <section className="pb-20 text-right">
        <div className="container mx-auto px-4 sm:px-6 mb-6">
          <h2 className="text-2xl font-bold">قد يُعجبك أيضًا</h2>
        </div>
        <Carousel>
          <CarouselContent className="px-4 sm:px-6">
            <CarouselItem className="basis-1/2 sm:basis-1/4 lg:basis-1/6">
              <div className="group cursor-pointer">
                <AspectRatio
                  ratio={2 / 3}
                  className="rounded-lg overflow-hidden"
                >
                  <Image
                    src={info?.movie_image ?? "/placeholder.svg?height=600&width=400"}
                    alt={movie_data?.name ?? "Movie"}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                </AspectRatio>
                <div className="mt-2 text-sm truncate">
                  {movie_data?.name ?? "—"}
                </div>
              </div>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </section>
    </main>
  )
}
