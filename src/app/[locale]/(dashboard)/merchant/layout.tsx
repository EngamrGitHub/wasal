import { MerchantHeader } from "@/src/components/merchant/MerchantHeader"
import { MerchantSidebar } from "@/src/components/merchant/MerchantSidebar"

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <MerchantSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MerchantHeader />
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
