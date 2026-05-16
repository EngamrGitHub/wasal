import { Hero } from '@/src/components/home/Hero'
import { CategoryBar } from '@/src/components/home/CategoryBar'
import { ProductGrid } from '@/src/components/home/ProductGrid'

export default function Home() {
  return (
    <div className="space-y-4">
      <Hero />
      <CategoryBar />
      <ProductGrid />
    </div>
  )
}