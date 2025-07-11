import { NextRequest, NextResponse } from "next/server"

const USER = process.env.TERA_USERNAME  ?? "30865694866849"
const PASS = process.env.TERA_PASSWORD  ?? "15354429669149"
const HOST = process.env.TERA_HOST      ?? "http://tera4k.com:8880"

export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const streamId = params.id
  const ext = new URL(req.url).searchParams.get("ext") ?? "mp4"
  const firstHop = `${HOST}/movie/${USER}/${PASS}/${streamId}.${ext}`

  /* HEAD يكفى – Range=0‑ ليتولّد التوكن */
  const r = await fetch(firstHop, {
    redirect: "manual",
    headers: { Range: "bytes=0-" },
    next: { revalidate: 0 },
  })

  const final = r.headers.get("Location")
  if (!final)
    return NextResponse.json({ error: "no‑location" }, { status: 502 })

  return NextResponse.json({ url: final })
}
