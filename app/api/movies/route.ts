/* ------------------------------------------------------------------
   app/api/movies/route.ts
   بوّابة Next.js لجلب كاتلوج الأفلام مع:
     • page / pageSize
     • ?search= للاستعلام
     • استجابة آمنة في حال تعذّر الخادوم البعيد
------------------------------------------------------------------- */

import type { NextRequest } from "next/server"
import { NextResponse }     from "next/server"

/* ---------- إعدادات Xtream ---------- */
const USERNAME = process.env.TERA_USERNAME ?? "30865694866849"
const PASSWORD = process.env.TERA_PASSWORD ?? "15354429669149"
/*  ⚠️ بروتوكول HTTP (وليس HTTPS) لأن المنفذ ‎8880‎ لا يدعم TLS */
const HOST     = process.env.TERA_HOST     ?? "http://tera4k.com:8880"

export const dynamic = "force-dynamic"   // تعطيل الكاش

/* ================================================================ */
export async function GET(req: NextRequest) {
  const params   = new URL(req.url).searchParams
  const page     = Math.max(0, Number(params.get("page")      ?? 1) - 1)   // صفرىّ داخليًا
  const pageSize = Math.max(1, Number(params.get("pageSize")  ?? 24))
  const query    = (params.get("search") ?? "").trim().toLowerCase()

  /* -------- طلب الكاتلوج الكامل مرة واحدة -------- */
  const remoteURL =
    `${HOST}/player_api.php` +
    `?action=get_vod_streams&username=${USERNAME}&password=${PASSWORD}`

  let catalog: any[] = []
  try {
    const res = await fetch(remoteURL, { cache: "no-store", next: { revalidate: 0 } })
    if (!res.ok) throw new Error(`Upstream ${res.status}`)
    catalog = await res.json()
  } catch (err) {
    console.error("[api/movies] Upstream error:", err)
    /* نُرجِع استجابة 200 مع حقل خطأ بدلاً من 500 حتى لا تنهار الواجهة */
    return NextResponse.json({ error: "upstream-failure" })
  }

  /* -------- بحث نصّى (إن وُجد) -------- */
  if (query) {
    catalog = catalog.filter((m) => m.name?.toLowerCase().includes(query))
  }

  /* -------- تقطيع الصفحة -------- */
  const slice = catalog.slice(page * pageSize, page * pageSize + pageSize)

  return NextResponse.json(slice)
}
