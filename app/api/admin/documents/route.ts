import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { splitIntoChunks, mergeChunks, generateChunkId, getNextDocumentId } from "@/lib/document-utils"
import { getUser } from "@/lib/session"
import { getEmbedding } from "@/lib/embeddings"
import { manualIndex } from "@/lib/pinecone"


export async function GET(request: NextRequest) {
  try {
    
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (id) {
      try {
        const chunks = await supabase
          .from("manual")
          .select("*")
          .eq("id", `${id}`)

        if (!chunks) {
          return NextResponse.json({ error: "Document not found" }, { status: 404 })
        }

        return NextResponse.json({ document: chunks.data![0] })
      } catch (error) {
        console.error("Error fetching document:", error)
        return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 })
      }
    }

    const { data: documentChunks, error: chunksError } = await supabase
      .from("manual")
      .select("id, title, type, language, created_at, chunk_count")
      .order("created_at", { ascending: true })

    // console.log('documentschunks', documentChunks)

    if (chunksError) {
      console.error("Error fetching document metadata:", chunksError)
      return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
    }

    return NextResponse.json({ documents: documentChunks })
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

    const contentChunks = splitIntoChunks(content)

    const { data, error: documentError } = await supabase
      .from("manual")
      .insert({
        title,
        type,
        language,
        content,
        chunk_count: contentChunks.length,
      })
      .select("id")
    
    if(documentError){
      console.error("Error creating document:", documentError)
      return NextResponse.json({ error: "Failed to create document" }, { status: 500 })
    }

    const documentId = data[0].id

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

    const documentIdPrefix = id

    const { data:ids, error } = await supabase
      .from("Ajerbaijian_manual")
      .select("id")
      .like("chunk_id", `${documentIdPrefix}\\_%`)

    if (error) {
      console.error("Error deleting existing document chunks:", error)
      return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
    }

    const { error: deleteError } = await supabase
      .from("Ajerbaijian_manual")
      .delete()
      .like("chunk_id", `${documentIdPrefix}\\_%`)

    if (deleteError) {
      console.error("Error deleting existing document chunks:", deleteError)
      return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
    }

    const contentChunks = splitIntoChunks(content)

    const { error: documentError } = await supabase
      .from("manual")
      .update({ title, type, language, content, chunk_count: contentChunks.length })
      .eq("id", `${documentIdPrefix}`)

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

    if (insertError || documentError) {
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
      .like("chunk_id", `${documentIdPrefix}\\_%`)
    const idArray = ids?.map((item) => String(item.id)) || [];
    console.log(idArray)

    if (error) {
      console.error("Error deleting document chunks:", error)
      return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
    }

    const { error: documentError } = await supabase
      .from("Ajerbaijian_manual")
      .delete()
      .like("chunk_id", `${documentIdPrefix}\\_%`)

    const { error: deleteError } = await supabase
      .from("manual")
      .delete()
      .eq("id", `${documentIdPrefix}`)

    if (documentError || deleteError) {
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

