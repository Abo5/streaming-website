/* -----------------------------------------------------------------
   app/series/[id]/page.tsx
------------------------------------------------------------------ */
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import {
  Play, Star, ArrowLeft, Video, Music,
  User, Film,
} from "lucide-react"

import { AspectRatio }   from "@/components/ui/aspect-ratio"
import { Button }        from "@/components/ui/button"
import { Badge }         from "@/components/ui/badge"
import {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableHead,
  TableRow, TableCell,
} from "@/components/ui/table"

import {
  fetchSeriesDetail,
  fetchEpisodeStream,
} from "@/app/lib/api"

/* ============== إعداد TMDB ============== */
const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY
             ?? "753012cd1b6d7ae52c92c79ff2c748e6"
const tmdb    = (p:string)=>`https://api.themoviedb.org/3${p}?api_key=${API_KEY}&language=ar`
const img     = (p:string|null|undefined,w=400)=>
  p ? `https://image.tmdb.org/t/p/w${w}${p}` : null

/* ============== الأنواع ============== */
type Episode = {
  id:string; episode_num:number; title:string;
  container_extension:string; info:{ duration?:string; bitrate?:number; still_path?:string|null; video?:any; audio?:any }
}
type Person = { id:number; name:string; role:string; profile_path:string|null }
type Rec    = { id:number; name:string; poster_path:string|null }

/* ============== مكوّنات مساعدة ============== */
const Stars = ({v}:{v:number})=>(
  <>
    {Array.from({length:10}).map((_,i)=>(
      <Star key={i} className={`h-4 w-4 ${i<Math.round(v)?"fill-yellow-400 text-yellow-400":"text-white/30"}`} />
    ))}
  </>
)

function SpecDialog({title,icon:Icon,spec}:{title:string;icon:any;spec:Record<string,unknown>}){
  return(
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="flex items-center gap-1 px-4 py-2">
          <Icon className="h-5 w-5"/>{title}
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="max-w-lg">
        <DialogHeader><DialogTitle className="flex items-center gap-1 text-xl">
          <Icon className="h-5 w-5"/>{title}
        </DialogTitle></DialogHeader>
        <Table><TableBody>
          {Object.entries(spec).map(([k,v])=>(
            <TableRow key={k}>
              <TableHead className="font-semibold">{k}</TableHead>
              <TableCell>{String(v)}</TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      </DialogContent>
    </Dialog>
  )
}

const EpCard = ({e,onClick}:{e:Episode;onClick:(x:Episode)=>void})=>(
  <button onClick={()=>onClick(e)} className="relative w-40 shrink-0">
    <AspectRatio ratio={16/9} className="rounded bg-white/10 overflow-hidden">
      {e.info.still_path
        ? <Image fill src={img(e.info.still_path,300)!} alt={e.title} className="object-cover"/>
        : <Film className="m-auto w-8 h-8 text-white/50"/>}
    </AspectRatio>
    <span className="absolute top-1 left-1 bg-black/70 text-xs px-1.5 rounded">
      {e.episode_num}
    </span>
    <p className="mt-1 text-[11px] truncate">{e.title}</p>
  </button>
)

const PCard = ({p}:{p:Person})=>(
  <div className="flex flex-col items-center gap-1 w-24 shrink-0">
    <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
      {p.profile_path ? <Image fill src={img(p.profile_path,200)!} alt={p.name} className="object-cover"/> :
        <User className="w-8 h-8 text-white/60"/>}
    </div>
    <span className="text-xs text-center">{p.name}</span>
    <span className="text-[10px] text-white/50">{p.role}</span>
  </div>
)

const RCard = ({r}:{r:Rec})=>(
  <div className="w-28 shrink-0">
    <AspectRatio ratio={2/3} className="rounded bg-white/10 overflow-hidden">
      {r.poster_path
        ? <Image fill src={img(r.poster_path,200)!} alt={r.name} className="object-cover"/>
        : <Film className="m-auto w-8 h-8 text-white/50"/>}
    </AspectRatio>
    <p className="mt-1 text-[11px] truncate">{r.name}</p>
  </div>
)

/* ================================================================= */
export default function SeriesDetail() {
  const router = useRouter()
  const { id } = useParams<{id:string}>()
  const seriesID = Number(id)

  /* ---- حالات ---- */
  const [info,setInfo]       = useState<any|null>(null)
  const [episodes,setEps]    = useState<Record<string,Episode[]>>({})
  const [season,setSeason]   = useState<number|null>(null)

  const [tmdbId,setTmdbId]   = useState<number|null>(null)
  const [people,setPeople]   = useState<Person[]>([])
  const [recs,setRecs]       = useState<Rec[]>([])

  const [video,setVideo]     = useState<string|null>(null)
  const [open,setOpen]       = useState(false)
  const [loading,setLoading] = useState(true)

  /* ---- جلب البيانات ---- */
  useEffect(()=>{
    if(!seriesID) return
    ;(async()=>{
      try{
        const data = await fetchSeriesDetail(seriesID)           /* Xtream */
        setInfo(data.info); setEps(data.episodes)
        setSeason(Number(Object.keys(data.episodes)[0]||1))

        /* TMDB ID أو بحث بالاسم */
        let idTmdb = data.info.tmdb_id
        if(!idTmdb && data.info.name){
          const q = encodeURIComponent(data.info.name)
          const sr = await fetch(tmdb(`/search/tv&query=${q}`.replace("/3?","/3/search/tv?"))).then(r=>r.json())
          idTmdb = sr.results?.[0]?.id
        }
        if(!idTmdb) return
        setTmdbId(idTmdb)

        /* credits + recommendations */
        const [credits,recommend] = await Promise.all([
          fetch(tmdb(`/tv/${idTmdb}/credits`)).then(r=>r.json()),
          fetch(tmdb(`/tv/${idTmdb}/recommendations`)).then(r=>r.json()),
        ])

        const crew = credits.crew.filter((c:any)=>["Creator","Director"].includes(c.job))
                       .map((c:any):Person=>({id:c.id,name:c.name,role:c.job,profile_path:c.profile_path}))
        const cast = credits.cast.slice(0,15)
                       .map((c:any):Person=>({id:c.id,name:c.name,role:c.character||"ممثل",profile_path:c.profile_path}))
        setPeople([...crew,...cast])

        setRecs(recommend.results.slice(0,10).map((r:any):Rec=>({
          id:r.id,name:r.name,poster_path:r.poster_path
        })))
      }finally{ setLoading(false) }
    })()
  },[seriesID])

  if(loading)  return <div className="min-h-screen flex items-center justify-center text-white">…تحميل</div>
  if(!info)    return <div className="min-h-screen flex items-center justify-center text-white">لا توجد بيانات</div>

  /* ---- بيانات لحساب الجداول ---- */
  const epsCurrent = season!=null ? episodes[season] : []
  const firstEp    = epsCurrent?.[0]

  const details = [
    ["الاسم:",              info.name || "—"],
    ["المعرّف (TMDB):",     tmdbId ?? "—"],
    ["التصنيف:",            (+info.rating_5based||"—").toString()],
    ["سنة الإصدار:",       (info.releaseDate||"").slice(0,4) || "—"],
    ["المدة:",              firstEp?.info.duration || "—"],
    ["تاريخ الإصدار:",     info.releaseDate || "—"],
    ["مستوى MPAA:",        info.mpaa ?? "—"],
    ["البِت ريت:",          firstEp?.info.bitrate ? `${firstEp.info.bitrate} kbps` : "—"],
  ]

  /* ---- تشغيل ---- */
  const play = async(ep:Episode)=>{
    const {url}=await fetchEpisodeStream(Number(ep.id),ep.container_extension)
    setVideo(url); setOpen(true)
  }

  const backdrop = info.backdrop_path?.[0] || info.cover
  const poster   = info.cover

  /* ---- واجهة ---- */
  return (
    <main dir="rtl" className="text-white">

      {/* زر عودة */}
      <div className="fixed top-6 left-6 z-50">
        <Button variant="secondary" onClick={()=>router.back()}
          className="rounded-full px-4 py-2 backdrop-blur-lg">
          <ArrowLeft className="h-4 w-4"/> العودة
        </Button>
      </div>

      {/* هيرو */}
      <section className="relative h-[55vh]">
        <Image fill priority src={backdrop} alt={info.name} className="object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/60 to-black/95"/>
        <div className="relative z-10 h-full flex items-end">
          <div className="container mx-auto px-4 sm:px-6 flex gap-6 pb-8">
            <div className="hidden md:block w-[170px] lg:w-[200px] shrink-0">
              <AspectRatio ratio={2/3} className="shadow-2xl rounded-lg">
                <Image fill src={poster} alt={info.name} className="object-cover rounded-lg"/>
              </AspectRatio>
            </div>
            <div className="flex-1 space-y-4">
              <h1 className="text-3xl sm:text-5xl font-extrabold">{info.name}</h1>
              {info.plot && <p className="max-w-2xl text-white/80">{info.plot}</p>}
              <div className="flex items-center gap-2">
                <Stars v={+info.rating_5based}/>
                {(+info.rating_5based).toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* جدول البيانات */}
      <section className="container mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-2xl font-bold mb-4">بيانات المسلسل</h2>
        <ul className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
          {details.map(([k,v])=>([
            <li key={k} className="font-semibold">{k}</li>,
            <li key={`${k}-v`}>{v}</li>
          ]))}
        </ul>
      </section>

      {/* مواسم / حلقات */}
      <section className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <span className="font-semibold">الموسم:</span>
          <select className="bg-black/40 border-white/20 rounded px-3 py-1 text-sm"
            value={season??""} onChange={e=>setSeason(Number(e.target.value))}>
            {Object.keys(episodes).map(n=><option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-4">{epsCurrent.map(e=><EpCard key={e.id} e={e} onClick={play}/>)}</div>
        </div>
      </section>

      {/* مواصفات تقنية */}
      {(firstEp?.info.video || firstEp?.info.audio) && (
        <section className="container mx-auto px-4 sm:px-6 pb-12 space-y-4">
          <h2 className="text-2xl font-bold">تفاصيل تقنية</h2>
          <div className="flex flex-wrap gap-4">
            {firstEp.info.video && <SpecDialog title="مواصفات الفيديو" icon={Video} spec={firstEp.info.video}/>}
            {firstEp.info.audio && <SpecDialog title="مواصفات الصوت" icon={Music} spec={firstEp.info.audio}/>}
          </div>
        </section>
      )}

      {/* طاقم العمل */}
      {people.length>0 && (
        <section className="container mx-auto px-4 sm:px-6 pb-12">
          <h2 className="text-2xl font-bold mb-4">طاقم العمل</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {people.map(p=><PCard key={p.id} p={p}/>)}
          </div>
        </section>
      )}

      {/* توصيات */}
      {recs.length>0 && (
        <section className="container mx-auto px-4 sm:px-6 pb-20">
          <h2 className="text-2xl font-bold mb-4">قد يُعجبك أيضًا</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {recs.map(r=><RCard key={r.id} r={r}/>)}
          </div>
        </section>
      )}

      {/* مشغل */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="p-0 max-w-4xl">
          {video
            ? <video src={video} controls autoPlay className="w-full h-full bg-black" style={{aspectRatio:"16/9"}}/>
            : <div className="h-[50vh] flex items-center justify-center">لا يمكن تشغيل الحلقة</div>}
        </DialogContent>
      </Dialog>
    </main>
  )
}
