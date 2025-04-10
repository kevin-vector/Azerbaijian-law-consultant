"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import UserHeader from "@/components/user-header"
import DocumentForm from "@/components/document-form"
import { Loader2, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react"
import { getUser } from "@/lib/session"

export default function DocumentsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [language, setLanguage] = useState("en")
  const [userRole, setUserRole] = useState("admin")
  const [user, setUser] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null)
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load user data and documents on component mount
  useEffect(() => {
    const loadData = async () => {
      const userData = getUser()
      if (!userData || (userData.role !== "root" && userData.role !== "admin")) {
        router.push("/dashboard")
        return
      }

      setUser(userData)
      setUserRole(userData.role)

      // Load documents
      await fetchDocuments()
    }

    loadData()
  }, [router])

  // Fetch documents from API
  const fetchDocuments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/documents")
      console.log(response)
      if (!response.ok) {
        throw new Error("Failed to fetch documents")
      }
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error("Error fetching documents:", error)
      toast({
        title: "Error",
        description: "Failed to load documents. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle language
  const toggleLanguage = () => {
    setLanguage(language === "en" ? "az" : "en")
  }

  // Handle document creation success
  const handleDocumentSuccess = () => {
    setShowAddDialog(false)
    setEditingDocumentId(null)
    fetchDocuments()
  }

  // Handle document deletion
  const handleDeleteDocument = async () => {
    if (!deletingDocumentId) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/documents?id=${deletingDocumentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete document")
      }

      toast({
        title: "Success",
        description: language === "en" ? "Document deleted successfully" : "Sənəd uğurla silindi",
      })

      // Refresh documents list
      fetchDocuments()
    } catch (error: any) {
      console.error("Error deleting document:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeletingDocumentId(null)
    }
  }

  // Get document type label
  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "law":
        return language === "en" ? "Law" : "Qanun"
      case "court-decision":
        return language === "en" ? "Court Decision" : "Məhkəmə qərarı"
      case "tax-code":
        return language === "en" ? "Tax Code" : "Vergi Məcəlləsi"
      default:
        return type
    }
  }

  // If user is not loaded yet, show loading
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <UserHeader
        userRole={userRole}
        language={language}
        onLanguageToggle={toggleLanguage}
        userEmail={user.email}
        username={user.username}
      />

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => router.push("/admin")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">
                {language === "en" ? "Manage Manual Documents" : "Əl ilə daxil edilmiş sənədləri idarə edin"}
              </h1>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {language === "en" ? "Add Document" : "Sənəd əlavə et"}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-muted p-8 rounded-lg text-center">
              <p className="text-muted-foreground">
                {language === "en" ? "No manual documents found" : "Əl ilə daxil edilmiş sənəd tapılmadı"}
              </p>
              <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                {language === "en" ? "Add Your First Document" : "İlk sənədinizi əlavə edin"}
              </Button>
            </div>
          ) : (
            // <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            //   {documents.map((document) => (
            //     <Card key={document.chunk_id}>
            //       <CardHeader className="pb-2">
            //         <div className="flex justify-between items-start">
            //           <CardTitle className="text-lg">{document.title}</CardTitle>
            //           <div className="flex gap-1">
            //             <Badge variant="outline">{getDocumentTypeLabel(document.type)}</Badge>
            //             <Badge variant="outline" className="bg-green-100 text-green-800">
            //               {document.language === "en" ? "English" : "Azərbaycan"}
            //             </Badge>
            //             {document.chunk_count > 1 && (
            //               <Badge variant="outline" className="bg-blue-100 text-blue-800">
            //                 {document.chunk_count} {language === "en" ? "chunks" : "hissə"}
            //               </Badge>
            //             )}
            //           </div>
            //         </div>
            //         <div className="text-sm text-muted-foreground">
            //           {language === "en" ? "Added on" : "Əlavə edilib"}:{" "}
            //           {new Date(document.created_at).toLocaleDateString()}
            //         </div>
            //       </CardHeader>
            //       <CardContent>
            //         <p className="line-clamp-3">{document.content}</p>
            //       </CardContent>
            //       <CardFooter className="flex justify-end gap-2 border-t pt-4">
            //         <Button
            //           variant="outline"
            //           size="sm"
            //           onClick={() => setEditingDocumentId(document.chunk_id.split("_")[0])}
            //           className="flex items-center"
            //         >
            //           <Pencil className="h-4 w-4 mr-1" />
            //           {language === "en" ? "Edit" : "Redaktə et"}
            //         </Button>
            //         <Button
            //           variant="destructive"
            //           size="sm"
            //           onClick={() => setDeletingDocumentId(document.chunk_id.split("_")[0])}
            //           className="flex items-center"
            //         >
            //           <Trash2 className="h-4 w-4 mr-1" />
            //           {language === "en" ? "Delete" : "Sil"}
            //         </Button>
            //       </CardFooter>
            //     </Card>
            //   ))}
            // </div>
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-medium">{language === "en" ? "ID" : "ID"}</th>
                      <th className="text-left p-3 font-medium">{language === "en" ? "Title" : "Başlıq"}</th>
                      <th className="text-left p-3 font-medium">{language === "en" ? "Type" : "Növ"}</th>
                      <th className="text-left p-3 font-medium">{language === "en" ? "Language" : "Dil"}</th>
                      <th className="text-left p-3 font-medium">{language === "en" ? "Chunks" : "Hissələr"}</th>
                      <th className="text-left p-3 font-medium">{language === "en" ? "Date" : "Tarix"}</th>
                      <th className="text-right p-3 font-medium">{language === "en" ? "Actions" : "Əməliyyatlar"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {documents.map((document) => {
                      const docId = document.id
                      return (
                        <tr key={docId || 0} className="hover:bg-muted/30">
                          <td className="p-3 text-sm font-mono">{docId}</td>
                          <td className="p-3 font-medium">{document.title}</td>
                          <td className="p-3">
                            <Badge variant="outline">{getDocumentTypeLabel(document.type)}</Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              {document.language === "en" ? "English" : "Azərbaycan"}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              {document.chunk_count} {language === "en" ? "chunks" : "hissə"}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {new Date(document.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingDocumentId(docId)}
                                className="flex items-center"
                                disabled={editingDocumentId == docId}
                              >
                                <Pencil className="h-4 w-4 mr-1" />
                                {language === "en" ? "Edit" : "Redaktə et"}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeletingDocumentId(docId)}
                                className="flex items-center"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                {language === "en" ? "Delete" : "Sil"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Document Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{language === "en" ? "Add New Document" : "Yeni Sənəd Əlavə Et"}</DialogTitle>
          </DialogHeader>
          <DocumentForm
            language={language}
            onSuccess={handleDocumentSuccess}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={!!editingDocumentId} onOpenChange={(open) => !open && setEditingDocumentId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{language === "en" ? "Edit Document" : "Sənədi Redaktə Et"}</DialogTitle>
          </DialogHeader>
          {editingDocumentId && (
            <DocumentForm
              documentId={editingDocumentId}
              language={language}
              onSuccess={handleDocumentSuccess}
              onCancel={() => setEditingDocumentId(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingDocumentId} onOpenChange={(open) => !open && setDeletingDocumentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "en"
                ? "Are you sure you want to delete this document?"
                : "Bu sənədi silmək istədiyinizə əminsiniz?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "en"
                ? "This action cannot be undone. This will permanently delete the document from the database."
                : "Bu əməliyyat geri qaytarıla bilməz. Bu, sənədi verilənlər bazasından həmişəlik siləcək."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{language === "en" ? "Cancel" : "Ləğv et"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDocument} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === "en" ? "Deleting..." : "Silinir..."}
                </>
              ) : language === "en" ? (
                "Delete"
              ) : (
                "Sil"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

