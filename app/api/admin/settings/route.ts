import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { data: settings, error: settingsError } = await supabase.from("settings").select("title, value")

    if (settingsError) {
      console.error("Error fetching settings:", settingsError)
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }

    const settingsObject: Record<string, string> = {}
    settings?.forEach((setting) => {
      settingsObject[setting.title] = setting.value
    })

    return NextResponse.json({
      includeScraping: settingsObject.include_scraping === "false" ? false : true,
      includeManual: settingsObject.include_manual === "false" ? false : true,
    })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, value } = body

    if (!title || value === undefined) {
      return NextResponse.json({ error: "Invalid input. Both title and value are required" }, { status: 400 })
    }

    const { data: existingSetting } = await supabase.from("settings").select("id").eq("title", title).single()

    let result

    if (existingSetting) {
      result = await supabase
        .from("settings")
        .update({ value: String(value), updated_at: new Date().toISOString() })
        .eq("title", title)
        .select()
    } else {
      result = await supabase
        .from("settings")
        .insert([
          {
            title,
            value: String(value),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
    }

    if (result.error) {
      console.error("Error updating setting:", result.error)
      return NextResponse.json({ error: "Failed to update setting" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      setting: result.data[0],
    })
  } catch (error) {
    console.error("Error updating setting:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
