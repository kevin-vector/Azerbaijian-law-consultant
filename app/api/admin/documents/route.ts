import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { splitIntoChunks, mergeChunks, generateChunkId, getNextDocumentId } from "@/lib/document-utils"
import { getUser } from "@/lib/session"
import { getEmbedding } from "@/lib/embeddings"
import { manualIndex } from "@/lib/pinecone"

export async function GET(request: NextRequest) {
  console.log('get')
  try {

    // const userData = getUser()
    // if (!userData || (userData.role !== "root" && userData.role !== "admin")) {
    //   return NextResponse.json({ error: "Document not found" }, { status: 404 })
    // }
    
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (id) {
      const { data: chunks, error: documentError } = await supabase
        .from("Ajerbaijian_manual")
        .select("*")
        .like("chunk_id", `${id}_%`)
        .order("chunk_id", { ascending: true })

      if (documentError) {
        console.error("Error fetching document chunks:", documentError)
        return NextResponse.json({ error: "Document not found" }, { status: 404 })
      }

      if (!chunks || chunks.length === 0) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 })
      }

      const mergedDocument = {
        ...chunks[0],
        content: chunks.map((chunk) => chunk.content).join(""),
        chunk_count: chunks.length,
      }

      return NextResponse.json({ document: mergedDocument })
    }

    const { data: allChunks, error: chunksError } = await supabase
      .from("Ajerbaijian_manual")
      .select("*")
      .order("created_at", { ascending: false })

    if (chunksError) {
      console.error("Error fetching documents:", chunksError)
      return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
    }

    const documents = mergeChunks(allChunks || [])

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, type, language } = body

    if (!title || !content || !type || !language) {
      return NextResponse.json(
        { error: "Invalid input. Title, content, type, and language are required" },
        { status: 400 },
      )
    }

    const documentId = await getNextDocumentId(supabase)

    const contentChunks = splitIntoChunks(content)
    const chunkInserts = contentChunks.map((chunkContent, index) => ({
      title,
      content: chunkContent,
      chunk_id: generateChunkId(documentId, index),
      language: language,
      type: type
    }))

    const { data: insertedChunks, error: insertError } = await supabase
      .from("Ajerbaijian_manual")
      .insert(chunkInserts)
      .select()

    if (insertError) {
      console.error("Error creating document chunks:", insertError)
      return NextResponse.json({ error: "Failed to create document" }, { status: 500 })
    }

    const pineconeRecords = await Promise.all(
      insertedChunks.map(async (row) => {
        const embedding = await getEmbedding(row.content);
        return {
          id: row.id.toString(),
          values: embedding,
          metadata: {
            content_id: documentId,
          },
        };
      })
    );
  
    try {
      await manualIndex.upsert(pineconeRecords);
      console.log(`Successfully upserted embeddings for Supabase IDs into Pinecone`);
    } catch (pineconeError) {
      console.error(`Error managing Pinecone records:`, pineconeError);
    }

    return NextResponse.json({
      success: true,
      document: {
        ...insertedChunks[0],
        chunk_count: contentChunks.length,
      },
    })
  } catch (error) {
    console.error("Error creating document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, content, type, language } = body

    if (!id || !title || !content || !type || !language) {
      return NextResponse.json(
        { error: "Invalid input. ID, title, content, type, and language are required" },
        { status: 400 },
      )
    }

    const documentIdPrefix = id.split("_")[0]

    const { data:ids, error } = await supabase
      .from("Ajerbaijian_manual")
      .select("id")
      .like("chunk_id", `${documentIdPrefix}_%`)

    if (error) {
      console.error("Error deleting existing document chunks:", error)
      return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
    }

    const { error: deleteError } = await supabase
      .from("Ajerbaijian_manual")
      .delete()
      .like("chunk_id", `${documentIdPrefix}_%`)

    if (deleteError) {
      console.error("Error deleting existing document chunks:", deleteError)
      return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
    }

    const contentChunks = splitIntoChunks(content)

    const chunkInserts = contentChunks.map((chunkContent, index) => ({
      title,
      content: chunkContent,
      chunk_id: generateChunkId(documentIdPrefix, index),
      language: language,
      type: type
    }))

    const { data: insertedChunks, error: insertError } = await supabase
      .from("Ajerbaijian_manual")
      .insert(chunkInserts)
      .select()

    if (insertError) {
      console.error("Error updating document chunks:", insertError)
      return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
    }

    const pineconeRecords = await Promise.all(
      insertedChunks.map(async (row) => {
        const embedding = await getEmbedding(row.content);
        return {
          id: row.id.toString(),
          values: embedding,
          metadata: {
            content_id: documentIdPrefix,
          },
        };
      })
    );
  
    try {
      await manualIndex.deleteMany({content_id:documentIdPrefix});
      console.log(`Successfully deleted existing Pinecone records with content_id: ${documentIdPrefix}`);

      await manualIndex.upsert(pineconeRecords);

      console.log(`Successfully upserted embeddings for Supabase IDs into Pinecone`);
    } catch (pineconeError) {
      console.error(`Error managing Pinecone records:`, pineconeError);
    }

    return NextResponse.json({
      success: true,
      document: {
        ...insertedChunks[0],
        chunk_count: contentChunks.length,
      },
    })
  } catch (error) {
    console.error("Error updating document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    const documentIdPrefix = id?.split("_")[0]

    const { data:ids, error } = await supabase
      .from("Ajerbaijian_manual")
      .select("id")
      .like("chunk_id", `${documentIdPrefix}_%`)
    const idArray = ids?.map((item) => String(item.id)) || [];
    console.log(idArray)

    if (error) {
      console.error("Error deleting document chunks:", error)
      return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
    }

    const { error: documentError } = await supabase
      .from("Ajerbaijian_manual")
      .delete()
      .like("chunk_id", `${documentIdPrefix}_%`)

    if (documentError) {
      console.error("Error deleting document chunks:", documentError)
      return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
    }

    try {
      await manualIndex.deleteMany(idArray);
      console.log(`Successfully deleted existing Pinecone records with content_id: ${documentIdPrefix}`);
    } catch (pineconeError) {
      console.error(`Error managing Pinecone records:`, pineconeError);
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

