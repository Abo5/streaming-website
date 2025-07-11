/* ----------------------------------------------------------------
   طبقة API موحّدة بين الواجهات ومسارات Next الداخلية
---------------------------------------------------------------- */

/* ---------------- مسارات Next الداخلية ---------------- */
const INTERNAL_MOVIES_API  = "/api/movies"
const INTERNAL_SERIES_API  = "/api/series"
const INTERNAL_MOVIE_INFO  = "/api/movie-info"
const INTERNAL_SERIES_INFO = "/api/series-info"
const INTERNAL_STREAM      = "/api/stream"
const INTERNAL_SERIES_STR  = "/api/series-stream"

/* ---------------- إعدادات Xtream ---------------- */
const IPTV_BASE = process.env.NEXT_PUBLIC_IPTV_API_BASE
               ?? "http://tera4k.com:8880/player_api.php"
const IPTV_USER = process.env.NEXT_PUBLIC_IPTV_USERNAME
               ?? "30865694866849"
const IPTV_PASS = process.env.NEXT_PUBLIC_IPTV_PASSWORD
               ?? "15354429669149"

/* ---------------- أداة جلب عامّة ---------------- */
async function fetchJSON<T>(
  url: RequestInfo,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<T>
}

/* ---------------- مساعد Query String ---------------- */
function buildQS(page: number, pageSize: number, search = "") {
  const p = new URLSearchParams({
    page:      String(page),
    pageSize:  String(pageSize),
  })
  if (search.trim()) p.set("search", search.trim())
  return p.toString()
}

/* ================= أفلام ================= */
export async function fetchMovies(page = 1, pageSize = 24, search = "") {
  return fetchJSON<any[]>(`${INTERNAL_MOVIES_API}?${buildQS(page, pageSize, search)}`)
}

/* ---------------- فيلم مفصّل ---------------- */
export async function fetchMovieDetail(id: number) {
  return fetchJSON<any>(`${INTERNAL_MOVIE_INFO}/${id}`)
}

/* ---------------- بيانات Xtream مباشرة ---------------- */
export async function fetchMovieInfo(vodId: number) {
  const body = new URLSearchParams({
    action  : "get_vod_info",
    username: IPTV_USER,
    password: IPTV_PASS,
    vod_id  : String(vodId),
  })
  return fetchJSON<any>(IPTV_BASE, {
    method : "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
}

/* ---------------- رابط تشغيل فيلم ---------------- */
export async function fetchStreamUrl(streamId: number, ext = "mp4") {
  return fetchJSON<{ url: string }>(`${INTERNAL_STREAM}/${streamId}?ext=${ext}`)
}

/* ================= مسلسلات ================= */
export async function fetchSeries(page = 1, pageSize = 24, search = "") {
  return fetchJSON<any[]>(`${INTERNAL_SERIES_API}?${buildQS(page, pageSize, search)}`)
}

/* ---------------- مسلسل مفصّل ---------------- */
export async function fetchSeriesDetail(id: number) {
  return fetchJSON<any>(`${INTERNAL_SERIES_INFO}/${id}`)
}

/* ---------------- رابط تشغيل حلقة ---------------- */
export async function fetchEpisodeStream(episodeId: number, ext = "mp4") {
  return fetchJSON<{ url: string }>(`${INTERNAL_SERIES_STR}/${episodeId}?ext=${ext}`)
}

/* ---------------- بيانات Xtream للمسلسل ---------------- */
export async function fetchSeriesInfo(seriesId: number) {
  const body = new URLSearchParams({
    action    : "get_series_info",
    username  : IPTV_USER,
    password  : IPTV_PASS,
    series_id : String(seriesId),
  })
  return fetchJSON<any>(IPTV_BASE, {
    method : "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
}
