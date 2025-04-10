
export function splitIntoChunks(content: string, maxChunkSize = 1500, overlapSize = 100): string[] {
    if (content.length <= maxChunkSize) {
      return [content]
    }
  
    const chunks: string[] = []
    let startIndex = 0
  
    while (startIndex < content.length) {
      let endIndex = startIndex + maxChunkSize
  
      if (endIndex < content.length) {
        const breakPoint = findBreakPoint(content, endIndex)
        endIndex = breakPoint > 0 ? breakPoint : endIndex
      } else {
        endIndex = content.length
      }
  
      chunks.push(content.substring(startIndex, endIndex))
  
      startIndex = endIndex - overlapSize
  
      if (startIndex <= 0 || startIndex >= content.length - overlapSize) {
        startIndex = endIndex
      }
    }
  
    return chunks
  }
  function findBreakPoint(text: string, targetIndex: number, searchRange = 100): number {
    const breakChars = [".", "!", "?", ",", ";", " ", "\n", "\r", "\t"]
  
    const maxSearchIndex = Math.min(targetIndex + searchRange, text.length)
    const minSearchIndex = Math.max(targetIndex - searchRange, 0)
  
    for (let i = targetIndex; i < maxSearchIndex; i++) {
      if ([".", "!", "?"].includes(text[i])) {
        return i + 1
      }
    }
  
    for (let i = targetIndex; i < maxSearchIndex; i++) {
      if ([",", ";"].includes(text[i])) {
        return i + 1
      }
    }
  
    for (let i = targetIndex; i < maxSearchIndex; i++) {
      if (text[i] === " " || text[i] === "\n") {
        return i
      }
    }
  
    return targetIndex
  }
  
  export function mergeChunks(chunks: any[]): any[] {
    if (!chunks || chunks.length === 0) {
      return []
    }
  
    const groupedChunks: Record<string, any[]> = {}
  
    chunks.forEach((chunk) => {
      const idParts = chunk.chunk_id.split("_")
      const docIdPrefix = idParts[0]
  
      if (!groupedChunks[docIdPrefix]) {
        groupedChunks[docIdPrefix] = []
      }
  
      groupedChunks[docIdPrefix].push(chunk)
    })
  
    const mergedDocuments = Object.keys(groupedChunks).map((docIdPrefix) => {
      const docChunks = groupedChunks[docIdPrefix]
  
      docChunks.sort((a, b) => {
        const aSeq = Number.parseInt(a.chunk_id.split("_")[1])
        const bSeq = Number.parseInt(b.chunk_id.split("_")[1])
        return aSeq - bSeq
      })
  
      const baseDoc = { ...docChunks[0] }
  
      if (docChunks.length > 1) {
        baseDoc.content = docChunks.map((chunk) => chunk.content).join(" ")
        baseDoc.is_merged = true
        baseDoc.chunk_count = docChunks.length
      }
  
      return baseDoc
    })
  
    return mergedDocuments
  }
  
  export function generateChunkId(documentId: string, chunkIndex: number): string {
    return `${documentId}_${chunkIndex}`
  }
  
  export async function getNextDocumentId(supabase: any): Promise<string> {
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
  
  