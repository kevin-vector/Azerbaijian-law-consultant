"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { HelpCircle } from "lucide-react"

interface ChatMessageProps {
  type: "user" | "system"
  query: string
  response: string
  language: string
  isDetailed: boolean
}

export default function ChatMessage({ type, query, response, language, isDetailed }: ChatMessageProps) {
  const [showCitations, setShowCitations] = useState(false)

  // Sample data for the example query about taxes
  const isTaxQuery = !query.toLowerCase().startsWith("welcome") 

  // const responseText = isDetailed ? responseData.detailed : responseData.brief
  const detailedMarker = '[Detailed Response]';
  const summarizedMarker = '[Summarized Response]';

  const detailedStart = response.indexOf(detailedMarker);
  const summarizedStart = response.indexOf(summarizedMarker);

  const detailed = response
    .slice(detailedStart + detailedMarker.length, summarizedStart)
    .trim();
  const summarized = response
    .slice(summarizedStart + summarizedMarker.length)
    .trim();
  const responseText = isDetailed ? detailed.split("\n") : summarized.split("\n");

  // Restore the original bubble design for user messages while keeping the right alignment
  if (type === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-4 py-2 max-w-[30%]">
          <div>{query}</div>
        </div>
      </div>
    )
  }

  // For system messages with tax query - restore the special card design but keep full width
  if (isTaxQuery && type === "system") {
    // This is our special tax response
    return (
      <div className="mb-6 w-full">
        <div className="max-w-full shadow-sm border-l-4 border-l-primary bg-muted rounded-lg">
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 mt-1 text-primary shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-bot"
                >
                  <path d="M12 8V4H8" />
                  <rect width="16" height="12" x="4" y="8" rx="2" />
                  <path d="M2 14h2" />
                  <path d="M20 14h2" />
                  <path d="M15 13v2" />
                  <path d="M9 13v2" />
                </svg>
              </div>
              <div>
                <p className="text-muted-foreground italic mb-4">
                  {query}
                </p>

                <ul className="space-y-2 list-disc pl-5">
                  {responseText.map((item, index) => (
                    <div key={index}>{item}</div>
                  ))}
                </ul>

                {/* {showCitations && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-2">{language === "en" ? "Citations" : "İstinadlar"}</h4>
                    <ul className="space-y-1 list-decimal pl-5 text-sm text-muted-foreground">
                      {response.citations.map((citation, index) => (
                        <li key={index}>{citation}</li>
                      ))}
                    </ul>
                  </div>
                )} */}
              </div>
            </div>

            {/* <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCitations(!showCitations)}>
                {showCitations
                  ? language === "en"
                    ? "Hide Citations"
                    : "İstinadları gizlət"
                  : language === "en"
                    ? "Show Citations"
                    : "İstinadları göstər"}
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={responseData.explanation === undefined}>
                    <HelpCircle className="h-4 w-4 mr-1" />
                    {language === "en" ? "Explain" : "İzah et"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {language === "en" ? "Legal Concept Explanation" : "Hüquqi Konsepsiya İzahı"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">{language === "en" ? "Profit Tax" : "Mənfəət Vergisi"}</h4>
                      <p className="text-sm text-muted-foreground">{responseData.explanation.profitTax}</p>
                    </div>
                    <div>
                      <h4 className="font-medium">{language === "en" ? "Branch Tax" : "Filial Vergisi"}</h4>
                      <p className="text-sm text-muted-foreground">{responseData.explanation.branchTax}</p>
                    </div>
                    <div>
                      <h4 className="font-medium">{language === "en" ? "Currency Control" : "Valyuta Nəzarəti"}</h4>
                      <p className="text-sm text-muted-foreground">{responseData.explanation.currencyControl}</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div> */}
          </div>
        </div>
      </div>
    )
  }

  // Regular system message - restore the original bubble design but keep full width
  return (
    <div className="flex justify-start mb-4 w-full">
      <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-2 max-w-[80%]">
        <div>{query}</div>
      </div>
    </div>
  )
}

