import { createClient } from "@supabase/supabase-js"

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for user management
export async function getUserByEmail(email: string) {
  const { data, error } = await supabase.from("user").select("*").eq("email", email).single()

  if (error) {
    console.error("Error fetching user by email:", error)
    return null
  }

  return data
}

export async function createUser(username: string, email: string, password: string) {
  const { data, error } = await supabase
    .from("user")
    .insert([
      {
        username,
        email,
        password,
        role: "user", // Default role is user
        created_at: new Date().toISOString(),
      },
    ])
    .select()

  if (error) {
    console.error("Error creating user:", error)
    throw error
  }

  return data[0]
}

export async function verifyCredentials(email: string, password: string) {
  const { data, error } = await supabase.from("user").select("*").eq("email", email).eq("password", password).single()

  if (error) {
    console.error("Error verifying credentials:", error)
    return null
  }

  return data
}

