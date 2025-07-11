import { NextRequest, NextResponse } from "next/server"
import { fetchMovieInfo } from "@/app/lib/api"

export const dynamic = "force-dynamic"      // no cache

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  /* ⚠️ لازم await */
  const { id } = await params
  const vodId = Number(id)

  if (!vodId)
    return NextResponse.json({ error: "invalid-id" }, { status: 400 })

  try {
    const data = await fetchMovieInfo(vodId)   // POST إلى Xtream
    return NextResponse.json(data)
  } catch (err) {
    console.error("[movie-info]", err)
    return NextResponse.json({ error: "upstream-failure" })
  }
}
