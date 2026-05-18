import { Hero } from '@/src/components/home/Hero'
import { CategoryBar } from '@/src/components/home/CategoryBar'
import { ProductGrid } from '@/src/components/home/ProductGrid'

export default function Home({ search }: { search?: string }) {
  return (
    <div className="space-y-4">
      {/* Hide Hero and Categories if user is searching to focus on results */}
      {!search && (
        <>
          <Hero />
          <CategoryBar />
        </>
      )}
      <ProductGrid search={search} />
    </div>
  )
}