'use client'

import { useTranslations } from 'next-intl'
import { 
  Shirt, 
  Monitor, 
  Home, 
  Sparkles, 
  Gamepad2, 
  Trophy, 
  ShoppingBasket, 
  BookOpen 
} from 'lucide-react'
import Link from 'next/link'

const categories = [
  { id: 'fashion', icon: Shirt, color: 'bg-orange-100 text-orange-600' },
  { id: 'electronics', icon: Monitor, color: 'bg-blue-100 text-blue-600' },
  { id: 'home', icon: Home, color: 'bg-green-100 text-green-600' },
  { id: 'beauty', icon: Sparkles, color: 'bg-pink-100 text-pink-600' },
  { id: 'toys', icon: Gamepad2, color: 'bg-purple-100 text-purple-600' },
  { id: 'sports', icon: Trophy, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'supermarket', icon: ShoppingBasket, color: 'bg-cyan-100 text-cyan-600' },
  { id: 'books', icon: BookOpen, color: 'bg-indigo-100 text-indigo-600' },
]

export function CategoryBar() {
  const t = useTranslations('Categories')

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('title')}</h2>
        <Link 
          href="/categories" 
          className="text-orange-600 font-semibold hover:underline"
        >
          {t('view_all')}
        </Link>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <Link
              key={category.id}
              href={`/categories/${category.id}`}
              className="group flex flex-col items-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:border-orange-200"
            >
              <div className={`w-12 h-12 rounded-xl ${category.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={24} />
              </div>
              <span className="text-sm font-bold text-gray-700 group-hover:text-orange-600 text-center">
                {t(category.id)}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
