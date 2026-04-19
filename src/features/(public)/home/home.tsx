import { Hero } from '@/src/components/home/Hero'
import { CategoryBar } from '@/src/components/home/CategoryBar'

export default function Home() {
  return (
    <div className="space-y-4">
      <Hero />
      <CategoryBar />
    </div>
  )
}