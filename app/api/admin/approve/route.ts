import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { approveAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json()
    const { adminId } = body
    
    if (!adminId) {
      return NextResponse.json({ error: "Admin ID is required" }, { status: 400 })
    }
    
    // Verify authentication
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session } } = await supabase.auth.getSession()
    
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
    
    // Approve admin
    await approveAdmin(adminId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error approving admin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
