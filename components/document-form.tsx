"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface DocumentFormProps {
  documentId?: string
  language: string
  onSuccess: () => void
  onCancel: () => void
}

export default function DocumentForm({ documentId, language, onSuccess, onCancel }: DocumentFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingDocument, setIsLoadingDocument] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [documentType, setDocumentType] = useState("law")
  const [documentLanguage, setDocumentLanguage] = useState(language)
  const [chunkCount, setChunkCount] = useState(1)

  // Document type options
  const documentTypes = [
    { id: "law", label: language === "en" ? "Law" : "Qanun" },
    { id: "court-decision", label: language === "en" ? "Court Decision" : "Məhkəmə qərarı" },
    { id: "tax-code", label: language === "en" ? "Tax Code" : "Vergi Məcəlləsi" },
  ]

  // Load document data if editing
  useEffect(() => {
    if (documentId) {
      setIsLoadingDocument(true)
      fetch(`/api/admin/documents?id=${documentId}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch document")
          }
          return response.json()
        })
        .then((data) => {
          setTitle(data.document.title)
          setContent(data.document.content)
          setDocumentType(data.document.type)
          setDocumentLanguage(data.document.language)
          setChunkCount(data.document.chunk_count || 1)
        })
        .catch((error) => {
          console.error("Error loading document:", error)
          toast({
            title: "Error",
            description: "Failed to load document. Please try again.",
            variant: "destructive",
          })
        })
        .finally(() => {
          setIsLoadingDocument(false)
        })
    }
  }, [documentId, toast])

  // Calculate estimated chunks based on content length
  const estimateChunks = (text: string): number => {
    if (!text) return 1
    const chunkSize = 1500
    const overlap = 100
    const effectiveChunkSize = chunkSize - overlap
    return Math.ceil(text.length / effectiveChunkSize) || 1
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate form
      if (!title.trim() || !content.trim()) {
        toast({
          title: "Validation Error",
          description: language === "en" ? "All fields are required" : "Bütün sahələr tələb olunur",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Determine if creating or updating
      const method = documentId ? "PUT" : "POST"
      const url = "/api/admin/documents"
      const body = documentId
        ? { id: documentId, title, content, type: documentType, language: documentLanguage }
        : { title, content, type: documentType, language: documentLanguage }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save document")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: documentId
          ? language === "en"
            ? `Document updated successfully (${data.document.chunk_count} chunks)`
            : `Sənəd uğurla yeniləndi (${data.document.chunk_count} hissə)`
          : language === "en"
            ? `Document created successfully (${data.document.chunk_count} chunks)`
            : `Sənəd uğurla yaradıldı (${data.document.chunk_count} hissə)`,
      })

      // Call success callback
      onSuccess()
    } catch (error: any) {
      console.error("Error saving document:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingDocument) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Estimate chunks for current content
  const estimatedChunks = estimateChunks(content)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="document-title">{language === "en" ? "Document Title" : "Sənəd başlığı"}</Label>
        <Input
          id="document-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mt-1"
          required
        />
      </div>

      <div>
        <Label htmlFor="document-content">
          {language === "en" ? "Document Content" : "Sənəd məzmunu"}
          {content && (
            <span className="ml-2 text-xs text-muted-foreground">
              {language === "en"
                ? `(${content.length} characters, estimated ${estimatedChunks} chunks)`
                : `(${content.length} simvol, təxminən ${estimatedChunks} hissə)`}
            </span>
          )}
          {documentId && chunkCount > 1 && (
            <span className="ml-2 text-xs text-amber-600">
              {language === "en"
                ? `(Currently stored in ${chunkCount} chunks)`
                : `(Hazırda ${chunkCount} hissədə saxlanılır)`}
            </span>
          )}
        </Label>
        <textarea
          id="document-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full mt-1 min-h-[200px] p-2 border rounded-md"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          {language === "en"
            ? "Documents longer than 1500 characters will be automatically split into chunks with 100 character overlap."
            : "1500 simvoldan uzun sənədlər avtomatik olaraq 100 simvol üst-üstə düşməklə hissələrə bölünəcək."}
        </p>
      </div>

      <div>
        <Label>{language === "en" ? "Document Type" : "Sənəd növü"}</Label>
        <RadioGroup value={documentType} onValueChange={setDocumentType} className="flex space-x-4 mt-1">
          {documentTypes.map((type) => (
            <div key={type.id} className="flex items-center space-x-2">
              <RadioGroupItem value={type.id} id={`type-${type.id}`} />
              <Label htmlFor={`type-${type.id}`} className="font-normal">
                {type.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div>
        <Label htmlFor="document-language">{language === "en" ? "Document Language" : "Sənəd dili"}</Label>
        <Select value={documentLanguage} onValueChange={setDocumentLanguage}>
          <SelectTrigger id="document-language" className="mt-1">
            <SelectValue placeholder={language === "en" ? "Select language" : "Dil seçin"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="az">Azərbaycan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {language === "en" ? "Cancel" : "Ləğv et"}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {language === "en" ? "Saving..." : "Saxlanılır..."}
            </>
          ) : documentId ? (
            language === "en" ? (
              "Update Document"
            ) : (
              "Sənədi Yenilə"
            )
          ) : language === "en" ? (
            "Create Document"
          ) : (
            "Sənəd Yarat"
          )}
        </Button>
      </div>
    </form>
  )
}

