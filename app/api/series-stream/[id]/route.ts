import { NextRequest, NextResponse } from "next/server"

const USER = process.env.TERA_USERNAME  ?? "30865694866849"
const PASS = process.env.TERA_PASSWORD  ?? "15354429669149"
const HOST = process.env.TERA_HOST      ?? "http://tera4k.com:8880"

export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id }   = await params                // episode_id فعلياً
  const ext      = new URL(req.url).searchParams.get("ext") ?? "mp4"
  const firstHop = `${HOST}/series/${USER}/${PASS}/${id}.${ext}`

  const r = await fetch(firstHop, {
    redirect: "manual",
    headers : { Range: "bytes=0-" },          // يولّد التوكن فقط
    next    : { revalidate: 0 },
  })

  const final = r.headers.get("Location")
  if (!final)
    return NextResponse.json({ error: "no-location" }, { status: 502 })

  return NextResponse.json({ url: final })
}
