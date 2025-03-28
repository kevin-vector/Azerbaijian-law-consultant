import { createClient } from "@supabase/supabase-js"
import * as bcrypt from "bcryptjs";

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);

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
  const { data:user, error } = await supabase.from("user").select("*").eq("email", email).single()

  if (error) {
    console.error("Error verifying credentials:", error)
    return null
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return null;
  }
  return user
}

function splitText(text:string, maxLength = 1500, overlap = 100) {
  // Split text into chunks under maxLength with overlap
  if (text.length <= maxLength) {
      return [text];
  }
  
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
      let end = start + maxLength;
      const st = Math.max(start - overlap, 0);
      const ed = Math.min(end + overlap, text.length);
      const chunk = text.slice(st, ed);
      chunks.push(chunk);
      start = end - overlap < text.length ? end - overlap : end;
  }
  
  return chunks;
}

export async function manualInput(title: string, content: string) {
  const id_supa = await supabase
    .from("Ajerbaijian_rule")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .single();

  console.log(id_supa);
  const id = id_supa.data ? Number(id_supa.data.id) + 1 : 1;

  const chunks = content.length > 1500 ? splitText(content, 1500, 100) : [content];
  const rowsToInsert = chunks.map((chunk, idx) => ({
    title,
    content: chunk,
    chunk_id: `${id}_${idx}`,
  }));

  try {
    const { data, error } = await supabase
      .from("Ajerbaijian_rule")
      .insert(rowsToInsert)
      .select();

    if (error) {
      console.error("Error creating manual input:", error);
      throw error;
    }

    // console.log("Inserted rows:", data);
    return data;
  } catch (error) {
    console.error("Error during batch insert:", error);
    throw error;
  }
}