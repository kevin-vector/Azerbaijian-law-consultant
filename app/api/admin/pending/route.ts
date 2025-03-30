import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { getPendingAdmins } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {

    // Get pending admins
    const pendingAdmins = await getPendingAdmins()

    return NextResponse.json({ pendingAdmins })
  } catch (error) {
    console.error("Error fetching pending admins:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

