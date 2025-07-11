/* =======================================
   components/SeriesDetail.tsx
   ======================================= */
"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { PlayIcon } from "@heroicons/react/24/solid"

/* ---------- أنواع البيانات ---------- */
export interface Episode {
  id: string
  episode_num: number
  title: string
  season: number
}

export interface Info {
  name: string
  cover: string
  plot: string
  rating: string
  genre: string
  releaseDate: string
  backdrop_path: string[]
}

export interface SeriesResponse {
  info: Info
  /** مجمَّع بالحالة  episodes[season] = Episode[] */
  episodes: Record<string, Episode[]>
}

/* ---------- المكوّن ---------- */
export default function SeriesDetail({ data }: { data: SeriesResponse }) {
  /* المواسم المتاحة */
  const seasons = useMemo(
    () => Object.keys(data.episodes).sort((a, b) => Number(a) - Number(b)),
    [data.episodes]
  )

  const [season, setSeason] = useState<string>(seasons[0] ?? "")
  const episodes = data.episodes[season] ?? []

  return (
    <div className="mx-auto max-w-6xl p-4 text-white">
      {/* ===== هيدر العمل ===== */}
      <header className="relative h-[450px] overflow-hidden rounded-2xl">
        {data.info.backdrop_path?.[0] && (
          <Image
            src={data.info.backdrop_path[0]}
            alt={data.info.name}
            fill
            priority
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        <div className="absolute bottom-4 left-4 flex gap-6">
          <Image
            src={data.info.cover}
            alt={data.info.name}
            width={150}
            height={225}
            className="hidden rounded-xl shadow-lg sm:block"
          />

          <div>
            <h1 className="mb-2 text-3xl font-bold">{data.info.name}</h1>
            <p className="mb-4 max-w-xl line-clamp-4">{data.info.plot}</p>
            <p className="text-sm opacity-80">
              {data.info.genre} • {data.info.releaseDate.slice(0, 4)} • ⭐{" "}
              {data.info.rating}
            </p>
          </div>
        </div>
      </header>

      {/* ===== اختيار الموسم ===== */}
      <section className="mt-8 flex items-center gap-2">
        <label htmlFor="season" className="font-semibold">
          الموسم:
        </label>

        <select
          id="season"
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          className="rounded-lg bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {seasons.map((s) => (
            <option key={s} value={s}>
              الموسم {s}
            </option>
          ))}
        </select>
      </section>

      {/* ===== قائمة الحلقات ===== */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {episodes.map((ep) => (
          <Link
            key={ep.id}
            href={`/watch/${ep.id}`}
            className="group relative overflow-hidden rounded-xl bg-neutral-900 p-4 transition hover:bg-neutral-800"
          >
            {/* رقم الحلقة */}
            <span className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-black">
              {ep.episode_num}
            </span>

            {/* عنوان الحلقة */}
            <h3 className="inline-block font-semibold transition-colors group-hover:text-primary">
              {ep.title}
            </h3>

            {/* أيقونة تشغيل عائمة */}
            <PlayIcon className="absolute right-4 top-4 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}

        {episodes.length === 0 && (
          <p className="col-span-full py-12 text-center text-neutral-400">
            لا توجد حلقات لهذا الموسم.
          </p>
        )}
      </section>
    </div>
  )
}
