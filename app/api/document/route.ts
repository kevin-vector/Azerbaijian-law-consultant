import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "@/lib/supabase"

// GET handler to retrieve manual documents
export async function GET(request: NextRequest) {
  try {

    // Get search params
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    // If ID is provided, get a single document
    if (id) {
      const { data: document, error: documentError } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .single()

      if (documentError) {
        console.error("Error fetching document:", documentError)
        return NextResponse.json({ error: "Document not found" }, { status: 404 })
      }

      return NextResponse.json({ document })
    }

    // Otherwise, get all documents
    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .select("*")
      .eq("data_source", "manual")
      .order("created_at", { ascending: false })

    if (documentsError) {
      console.error("Error fetching documents:", documentsError)
      return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
    }

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST handler to create a new document
export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json()
    const { title, content, type, language } = body

    // Validate input
    if (!title || !content || !type || !language) {
      return NextResponse.json(
        { error: "Invalid input. Title, content, type, and language are required" },
        { status: 400 }
      )
    }

    // Verify authentication
    const cookieStore = cookies()
    const supabaseAuth = createRouteHandlerClient({ cookies: () => cookieStore })
    const {
      data: { session },
    } = await supabaseAuth.auth.getSession()

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

    // Check if user is an admin or root
    if (userData.role !== "admin" && userData.role !== "root") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Create new document
    const { data: document, error: documentError } = await supabase
      .from("documents")
      .insert([
        {
          title,
          content,
          type,
          language,
          data_source: "manual",
          source: "Manual Entry",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: session.user.email,
        },
      ])
      .select()

    if (documentError) {
      console.error("Error creating document:", documentError)
      return NextResponse.json({ error: "Failed to create document" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      document: document[0],
    })
  } catch (error) {
    console.error("Error creating document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT handler to update an existing document
export async function PUT(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json()
    const { id, title, content, type, language } = body

    // Validate input
    if (!id || !title || !content || !type || !language) {
      return NextResponse.json(
        { error: "Invalid input. ID, title, content, type, and language are required" },
        { status: 400 }
      )
    }

    // Verify authentication
    const cookieStore = cookies()
    const supabaseAuth = createRouteHandlerClient({ cookies: () => cookieStore })
    const {
      data: { session },
    } = await supabaseAuth.auth.getSession()

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

    // Check if user is an admin or root
    if (userData.role !== "admin" && userData.role !== "root") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update document
    const { data: document, error: documentError } = await supabase
      .from("documents")
      .update({
        title,
        content,
        type,
        language,
        updated_at: new Date().toISOString(),
        updated_by: session.user.email,
      })
      .eq("id", id)
      .eq("data_source", "manual") // Ensure we only update manual documents
      .select()

    if (documentError) {
      console.error("Error updating document:", documentError)
      return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      document: document[0],
    })
  } catch (error) {
    console.error("Error updating document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE handler to delete a document
export async function DELETE(request: NextRequest) {
  try {
    // Get document ID from URL
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }

    // Verify authentication
    const cookieStore = cookies()
    const supabaseAuth = createRouteHandlerClient({ cookies: () => cookieStore })
    const {
      data: { session },
    } = await supabaseAuth.auth.getSession()

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

    // Check if user is an admin or root
    if (userData.role !== "admin" && userData.role !== "root") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete document
    const { error: documentError } = await supabase
      .from("documents")
      .delete()
      .eq("id", id)
      .eq("data_source", "manual") // Ensure we only delete manual documents

    if (documentError) {
      console.error("Error deleting document:", documentError)
      return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
