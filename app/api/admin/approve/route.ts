import { NextRequest, NextResponse } from "next/server"
import { approveAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json()
    const { adminId } = body
    
    if (!adminId) {
      return NextResponse.json({ error: "Admin ID is required" }, { status: 400 })
    }
    
    // Approve admin
    await approveAdmin(adminId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error approving admin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
