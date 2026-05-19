import { Hero } from '@/src/components/home/Hero'
import { CategoryCarousel } from '@/src/components/home/CategoryCarousel'
import { ProductGrid } from '@/src/components/home/ProductGrid'

export default function Home({ search }: { search?: string }) {
  return (
    <div className="space-y-4">
      {/* Hide Hero and Categories if user is searching to focus on results */}
      {!search && (
        <>
          <Hero />
          <CategoryCarousel />
        </>
      )}
      <ProductGrid search={search} />
    </div>
  )
}