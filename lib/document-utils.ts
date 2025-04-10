/**
 * Utility functions for document chunking and processing
 */

// Function to split content into chunks
export function splitIntoChunks(content: string, maxChunkSize = 1500, overlapSize = 100): string[] {
    if (content.length <= maxChunkSize) {
      return [content]
    }
  
    const chunks: string[] = []
    let startIndex = 0
  
    while (startIndex < content.length) {
      // Calculate end index for this chunk
      let endIndex = startIndex + maxChunkSize
  
      // If this isn't the last chunk, adjust end index to include overlap
      if (endIndex < content.length) {
        // Try to find a space or punctuation to break at
        const breakPoint = findBreakPoint(content, endIndex)
        endIndex = breakPoint > 0 ? breakPoint : endIndex
      } else {
        endIndex = content.length
      }
  
      // Add the chunk
      chunks.push(content.substring(startIndex, endIndex))
  
      // Move start index for next chunk, accounting for overlap
      startIndex = endIndex - overlapSize
  
      // Make sure we don't go backwards (can happen if overlap > chunk size)
      if (startIndex <= 0 || startIndex >= content.length - overlapSize) {
        startIndex = endIndex
      }
    }
  
    return chunks
  }
  
  // Helper function to find a good break point (space or punctuation) near the target index
  function findBreakPoint(text: string, targetIndex: number, searchRange = 100): number {
    // Define break characters
    const breakChars = [".", "!", "?", ",", ";", " ", "\n", "\r", "\t"]
  
    // Search range should not exceed text length
    const maxSearchIndex = Math.min(targetIndex + searchRange, text.length)
    const minSearchIndex = Math.max(targetIndex - searchRange, 0)
  
    // First try to find a sentence break
    for (let i = targetIndex; i < maxSearchIndex; i++) {
      if ([".", "!", "?"].includes(text[i])) {
        return i + 1 // Include the punctuation in the chunk
      }
    }
  
    // Then try to find a clause break
    for (let i = targetIndex; i < maxSearchIndex; i++) {
      if ([",", ";"].includes(text[i])) {
        return i + 1
      }
    }
  
    // Finally, try to find a space
    for (let i = targetIndex; i < maxSearchIndex; i++) {
      if (text[i] === " " || text[i] === "\n") {
        return i
      }
    }
  
    // If no good break point found, just use the target index
    return targetIndex
  }
  
  // Function to merge chunks from the same document
  export function mergeChunks(chunks: any[]): any[] {
    if (!chunks || chunks.length === 0) {
      return []
    }
  
    // Group chunks by their document ID prefix
    const groupedChunks: Record<string, any[]> = {}
  
    chunks.forEach((chunk) => {
      // Extract the document ID prefix (e.g., "1" from "1_2")
      const idParts = chunk.chunk_id.split("_")
      const docIdPrefix = idParts[0]
  
      if (!groupedChunks[docIdPrefix]) {
        groupedChunks[docIdPrefix] = []
      }
  
      groupedChunks[docIdPrefix].push(chunk)
    })
  
    // Merge chunks for each document
    const mergedDocuments = Object.keys(groupedChunks).map((docIdPrefix) => {
      const docChunks = groupedChunks[docIdPrefix]
  
      // Sort chunks by their sequence number
      docChunks.sort((a, b) => {
        const aSeq = Number.parseInt(a.chunk_id.split("_")[1])
        const bSeq = Number.parseInt(b.chunk_id.split("_")[1])
        return aSeq - bSeq
      })
  
      // Use the first chunk as the base document
      const baseDoc = { ...docChunks[0] }
  
      // Merge content from all chunks
      if (docChunks.length > 1) {
        baseDoc.content = docChunks.map((chunk) => chunk.content).join(" ")
        baseDoc.is_merged = true
        baseDoc.chunk_count = docChunks.length
      }
  
      return baseDoc
    })
  
    return mergedDocuments
  }
  
  // Function to generate a new chunk ID
  export function generateChunkId(documentId: string, chunkIndex: number): string {
    return `${documentId}_${chunkIndex}`
  }
  
  // Function to get the next document ID
  export async function getNextDocumentId(supabase: any): Promise<string> {
    // Get the highest document ID currently in use
    const { data, error } = await supabase
        .from("Ajerbaijian_manual")
        .select("chunk_id")
        .like("chunk_id", "%\\_0")
  
    if (error) {
      console.error("Error getting next document ID:", error)
      throw error
    }
  
    let nextId = "1"
    let highestId = 0
    if (data && data.length > 0) {
      data.map((chunk: { chunk_id: string }) => {
        const id = chunk.chunk_id.split("_")[0]
        const idNum = Number.parseInt(id)
        if (idNum > highestId) {
          highestId = idNum
        }
      })
      nextId = (highestId + 1).toString()
    }
  
    return nextId
  }
  
  