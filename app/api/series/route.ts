/* --------------------------------------------------------------
   app/api/series/route.ts
   يرجع جزءاً (صفحة) من قائمة المسلسلات مع دعم البحث
---------------------------------------------------------------- */
import { NextRequest, NextResponse } from "next/server"

const USERNAME = process.env.TERA_USERNAME  || "30865694866849"
const PASSWORD = process.env.TERA_PASSWORD  || "15354429669149"
const HOST     = process.env.TERA_HOST      || "http://tera4k.com:8880"

/* إجبار Next على تخطّى الـ Cache */
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  /* ------------ قراءة بارامترات الطلب ------------ */
  const { searchParams } = new URL(req.url)
  const page     = Number(searchParams.get("page")     ?? 1)
  const pageSize = Number(searchParams.get("pageSize") ?? 24)
  const search   =        searchParams.get("search")?.trim().toLowerCase() ?? ""

  /* ------------ جلب كل المسلسلات من Xtream ------------ */
  const url = `${HOST}/player_api.php?action=get_series&username=${USERNAME}&password=${PASSWORD}`
  const xtreamRes = await fetch(url, { cache: "no-store" })

  if (!xtreamRes.ok) {
    return NextResponse.json(
      { error: xtreamRes.statusText },
      { status: xtreamRes.status },
    )
  }

  const allSeries: any[] = await xtreamRes.json()

  /* ------------ بحث + تقطيع ------------ */
  const filtered = search
    ? allSeries.filter((s) =>
        (s.name as string).toLowerCase().includes(search),
      )
    : allSeries

  const start = (page - 1) * pageSize
  const slice = filtered.slice(start, start + pageSize)

  return NextResponse.json(slice)
}
