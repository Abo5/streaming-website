import { NextRequest, NextResponse } from "next/server"
import { fetchSeriesInfo } from "@/app/lib/api"

export const dynamic = "force-dynamic"

/* Next 15 → params لازم await */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const seriesId = Number(id)

  if (!seriesId)
    return NextResponse.json({ error: "invalid-id" }, { status: 400 })

  try {
    const data = await fetchSeriesInfo(seriesId)      // POST → Xtream
    return NextResponse.json(data)
  } catch (err) {
    console.error("[series-info]", err)
    return NextResponse.json({ error: "upstream-failure" })
  }
}
