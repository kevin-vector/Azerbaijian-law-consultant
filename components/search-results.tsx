"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { HelpCircle } from "lucide-react"

interface SearchResultsProps {
  language: string
  isDetailed: boolean
}

export default function SearchResults({ language, isDetailed }: SearchResultsProps) {
  const [showCitations, setShowCitations] = useState(false)

  // Sample data for the example query
  const sampleQuery =
    language === "en"
      ? "If a branch office of a foreign company receives damages under a court decision and wishes to transfer the amount in USD, what taxes are due?"
      : "Əgər xarici şirkətin filialı məhkəmə qərarı əsasında zərər alırsa və məbləği USD ilə köçürmək istəyirsə, hansı vergilər ödənilməlidir?"

  const sampleResponse = {
    en: {
      brief: [
        "Profit Tax: 20% on the received amount as it is considered income.",
        "Branch Tax: Additional 5% on the net profit after profit tax.",
        "Currency Control: No additional tax, but subject to currency control regulations.",
      ],
      detailed: [
        "Profit Tax (20%): The damages received by the branch office are considered as income under Article 13.2.16 of the Tax Code of Azerbaijan. As such, they are subject to the standard corporate profit tax rate of 20%. This applies to the full amount of damages received.",
        "Branch Tax (5%): According to Article 125 of the Tax Code, a branch of a foreign legal entity is subject to an additional 5% tax on the net profit after the deduction of profit tax. This is essentially a branch remittance tax that applies when profits are repatriated.",
        "Currency Control Regulations: While not a tax per se, the transfer of USD abroad is subject to currency control regulations under the Law on Currency Regulation. The branch must provide documentation proving the legal basis for the transfer (court decision) and comply with reporting requirements to the Central Bank.",
      ],
      citations: [
        "Tax Code of Azerbaijan, Article 13.2.16 (Definition of Income)",
        "Tax Code of Azerbaijan, Article 105.1 (Profit Tax Rate)",
        "Tax Code of Azerbaijan, Article 125 (Branch Profit Tax)",
        "Law on Currency Regulation of Azerbaijan, Article 7 (Currency Operations)",
        "Central Bank of Azerbaijan, Regulation on Currency Operations, Section 4.3",
      ],
      explanation: {
        profitTax:
          "Profit Tax is the Azerbaijani equivalent of corporate income tax. It applies to all forms of income, including compensatory damages received through court decisions. The tax base is the gross amount received.",
        branchTax:
          "Branch Tax is a form of withholding tax specifically applied to foreign entities operating through branches rather than subsidiaries. It's designed to equalize the tax treatment between branches and subsidiaries, as subsidiaries would pay dividend withholding tax when distributing profits to foreign parents.",
        currencyControl:
          "Currency Control regulations in Azerbaijan require documentation and reporting for outbound foreign currency transfers. These are not taxes but regulatory requirements aimed at monitoring capital flows and preventing capital flight or money laundering.",
      },
    },
    az: {
      brief: [
        "Mənfəət Vergisi: Alınan məbləğin 20%-i gəlir hesab olunur.",
        "Filial Vergisi: Mənfəət vergisindən sonra xalis mənfəətin əlavə 5%-i.",
        "Valyuta Nəzarəti: Əlavə vergi yoxdur, lakin valyuta nəzarəti qaydalarına tabedir.",
      ],
      detailed: [
        "Mənfəət Vergisi (20%): Filial tərəfindən alınan zərərlər Azərbaycan Vergi Məcəlləsinin 13.2.16-cı maddəsinə əsasən gəlir hesab olunur. Beləliklə, onlar standart korporativ mənfəət vergisi dərəcəsi olan 20% -ə tabedir. Bu, alınan zərərlərin tam məbləğinə tətbiq olunur.",
        "Filial Vergisi (5%): Vergi Məcəlləsinin 125-ci maddəsinə əsasən, xarici hüquqi şəxsin filialı mənfəət vergisinin çıxılmasından sonra xalis mənfəətə əlavə 5% vergi ödəməlidir. Bu, əsasən mənfəət repatriasiya edildikdə tətbiq olunan filial köçürmə vergisidir.",
        "Valyuta Nəzarəti Qaydaları: Vergi olmasa da, USD-nin xaricə köçürülməsi Valyuta Tənzimlənməsi haqqında Qanuna əsasən valyuta nəzarəti qaydalarına tabedir. Filial köçürmənin hüquqi əsasını (məhkəmə qərarı) təsdiq edən sənədləri təqdim etməli və Mərkəzi Banka hesabat tələblərinə əməl etməlidir.",
      ],
      citations: [
        "Azərbaycan Vergi Məcəlləsi, Maddə 13.2.16 (Gəlirin Tərifi)",
        "Azərbaycan Vergi Məcəlləsi, Maddə 105.1 (Mənfəət Vergisi Dərəcəsi)",
        "Azərbaycan Vergi Məcəlləsi, Maddə 125 (Filial Mənfəət Vergisi)",
        "Azərbaycan Valyuta Tənzimlənməsi haqqında Qanun, Maddə 7 (Valyuta Əməliyyatları)",
        "Azərbaycan Mərkəzi Bankı, Valyuta Əməliyyatları haqqında Qaydalar, Bölmə 4.3",
      ],
      explanation: {
        profitTax:
          "Mənfəət Vergisi Azərbaycanda korporativ gəlir vergisinin ekvivalentidir. O, məhkəmə qərarları vasitəsilə alınan kompensasiya zərərləri də daxil olmaqla, bütün gəlir formalarına tətbiq olunur. Vergi bazası alınan ümumi məbləğdir.",
        branchTax:
          "Filial Vergisi xüsusilə törəmə şirkətlər deyil, filiallar vasitəsilə fəaliyyət göstərən xarici qurumlar üçün tətbiq olunan bir növ vergi tutumudur. Bu, filiallar və törəmə şirkətlər arasında vergi rejimini bərabərləşdirmək üçün nəzərdə tutulub, çünki törəmə şirkətlər xarici ana şirkətlərə mənfəət payladıqda dividend vergi tutumu ödəyəcəklər.",
        currencyControl:
          "Azərbaycanda Valyuta Nəzarəti qaydaları xaricə valyuta köçürmələri üçün sənədləşdirmə və hesabat tələb edir. Bunlar vergi deyil, kapital axınlarını izləmək və kapital qaçışının və ya çirkli pulların yuyulmasının qarşısını almaq məqsədi daşıyan tənzimləyici tələblərdir.",
      },
    },
  }

  const responseData = language === "en" ? sampleResponse.en : sampleResponse.az
  const responseText = isDetailed ? responseData.detailed : responseData.brief

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-xl">{language === "en" ? "Response" : "Cavab"}</CardTitle>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {language === "en" ? "Relevance: High" : "Uyğunluq: Yüksək"}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {language === "en" ? "Date: 03/21/2025" : "Tarix: 21/03/2025"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-muted-foreground italic">{sampleQuery}</p>

          <ul className="space-y-3 list-disc pl-5">
            {responseText.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          {showCitations && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium mb-2">{language === "en" ? "Citations" : "İstinadlar"}</h4>
              <ul className="space-y-1 list-decimal pl-5 text-sm text-muted-foreground">
                {responseData.citations.map((citation, index) => (
                  <li key={index}>{citation}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setShowCitations(!showCitations)}>
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
            <Button variant="ghost" size="icon">
              <HelpCircle className="h-4 w-4" />
              <span className="sr-only">{language === "en" ? "Explain" : "İzah et"}</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === "en" ? "Legal Concept Explanation" : "Hüquqi Konsepsiya İzahı"}</DialogTitle>
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
      </CardFooter>
    </Card>
  )
}

