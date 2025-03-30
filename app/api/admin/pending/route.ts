import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { getPendingAdmins } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user data to check role
    const { data: userData, error: userError } = await supabase
      .from("user")
      .select("role")
      .eq("email", session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is a root user
    if (userData.role !== "root") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get pending admins
    const pendingAdmins = await getPendingAdmins()

    return NextResponse.json({ pendingAdmins })
  } catch (error) {
    console.error("Error fetching pending admins:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

