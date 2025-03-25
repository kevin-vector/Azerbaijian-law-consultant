"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

interface FilterPanelProps {
  language: string
}

export default function FilterPanel({ language }: FilterPanelProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [document, setDocument] = useState("all")

  const handleClearFilters = () => {
    setStartDate(undefined)
    setEndDate(undefined)
    setDocument("all")
  }

  return (
    <div className="bg-card rounded-lg p-4 shadow-sm space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="document-type">{language === "en" ? "Document Type" : "Sənəd növü"}</Label>
          <Select value={document} onValueChange={setDocument}>
            <SelectTrigger id="document-type">
              <SelectValue placeholder={language === "en" ? "All Types" : "Bütün növlər"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "en" ? "All Types" : "Bütün növlər"}</SelectItem>
              <SelectItem value="law">{language === "en" ? "Law" : "Qanun"}</SelectItem>
              <SelectItem value="court-decision">{language === "en" ? "Court Decision" : "Məhkəmə qərarı"}</SelectItem>
              <SelectItem value="tax-code">{language === "en" ? "Tax Code" : "Vergi Məcəlləsi"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* <div className="space-y-2">
          <Label htmlFor="category">{language === "en" ? "Category" : "Kateqoriya"}</Label>
          <Select>
            <SelectTrigger id="category">
              <SelectValue placeholder={language === "en" ? "All Categories" : "Bütün kateqoriyalar"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tax">{language === "en" ? "Tax" : "Vergi"}</SelectItem>
              <SelectItem value="corporate">{language === "en" ? "Corporate" : "Korporativ"}</SelectItem>
              <SelectItem value="banking">{language === "en" ? "Banking" : "Bank işi"}</SelectItem>
              <SelectItem value="labor">{language === "en" ? "Labor" : "Əmək"}</SelectItem>
            </SelectContent>
          </Select>
        </div> */}

        <div className="space-y-2">
          <Label>{language === "en" ? "Date Range" : "Tarix aralığı"}</Label>
          <div className="flex space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : language === "en" ? "From" : "Başlanğıc"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : language === "en" ? "To" : "Son"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        {/* <Button variant="outline" onClick={handleClearFilters}> */}
        <Button onClick={handleClearFilters}>
          {language === "en" ? "Clear Filters" : "Filtrləri təmizlə"}
        </Button>
        {/* <Button>{language === "en" ? "Apply Filters" : "Filtrləri tətbiq et"}</Button> */}
      </div>
    </div>
  )
}

