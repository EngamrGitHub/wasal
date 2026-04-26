'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@/src/i18n/routing';
import { ArrowLeft, Loader2, UploadCloud } from 'lucide-react';
import { Link } from '@/src/i18n/routing';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

// Function to generate schema with translations
const getProductSchema = (t: any) => z.object({
  title: z.string().min(3, t('validation.title_min')),
  description: z.string().min(10, t('validation.desc_min')),
  price: z.number({ message: t('validation.price_valid') }).positive(t('validation.price_positive')),
  stock: z.number({ message: t('validation.stock_valid') }).int().nonnegative(t('validation.stock_positive')),
  category: z.string().min(1, t('validation.category_required')),
});

export default function AddProductPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const t = useTranslations('Merchant.Products.Add');
  const tCommon = useTranslations('Common');

  const productSchema = getProductSchema((key: string) => t(key));
  type ProductFormData = z.infer<typeof productSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  // Mock API call using React Query
  const mutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const payload = {
        ...data,
        status: 'PENDING_APPROVAL'
      };
      
      console.log('Submitted Product Payload:', payload);
      return payload;
    },
    onSuccess: () => {
      // Redirect back to products page after successful submission
      router.push('/merchant/products');
    },
    onError: (error) => {
      setSubmitError(error.message || 'Something went wrong');
    }
  });

  const onSubmit = (data: ProductFormData) => {
    setSubmitError(null);
    mutation.mutate(data);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/merchant/products" 
          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors rtl:rotate-180"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-foreground">{t('title')}</h1>
          <p className="text-gray-500 mt-1">{t('description')}</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Image Upload Placeholder */}
          <div className="col-span-full">
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('images')}</label>
            <div className="mt-2 flex justify-center rounded-2xl border border-dashed border-gray-300 px-6 py-12 hover:bg-gray-50 transition-colors cursor-pointer group">
              <div className="text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-300 group-hover:text-primary transition-colors" aria-hidden="true" />
                <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                  <span className="relative rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80">
                    {t('upload_file')}
                  </span>
                  <p className="pl-1">{t('drag_drop')}</p>
                </div>
                <p className="text-xs leading-5 text-gray-500">{t('file_hint')}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('product_title')}</label>
              <input
                type="text"
                {...register('title')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                placeholder={t('title_placeholder')}
              />
              {errors.title && <p className="text-error text-sm mt-1">{errors.title.message}</p>}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('price')}</label>
              <input
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                placeholder={t('price_placeholder')}
              />
              {errors.price && <p className="text-error text-sm mt-1">{errors.price.message}</p>}
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('stock')}</label>
              <input
                type="number"
                {...register('stock', { valueAsNumber: true })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                placeholder={t('stock_placeholder')}
              />
              {errors.stock && <p className="text-error text-sm mt-1">{errors.stock.message}</p>}
            </div>

            {/* Category */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('category')}</label>
              <select
                {...register('category')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none bg-white"
              >
                <option value="">{t('select_category')}</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="home">Home & Garden</option>
                <option value="sports">Sports</option>
              </select>
              {errors.category && <p className="text-error text-sm mt-1">{errors.category.message}</p>}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('description_label')}</label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                placeholder={t('description_placeholder')}
              />
              {errors.description && <p className="text-error text-sm mt-1">{errors.description.message}</p>}
            </div>
          </div>

          {submitError && (
            <div className="p-4 bg-error/10 text-error rounded-xl text-sm font-medium">
              {submitError}
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {mutation.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
              {mutation.isPending ? t('submitting') : t('submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
