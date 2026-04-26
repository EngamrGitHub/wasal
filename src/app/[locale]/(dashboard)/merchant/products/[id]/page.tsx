'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from '@/src/i18n/routing';
import { ArrowLeft, Loader2, UploadCloud } from 'lucide-react';
import { Link } from '@/src/i18n/routing';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

// Function to generate schema with translations
const getProductSchema = (t: any) => z.object({
  title: z.string().min(3, t('validation.title_min')),
  description: z.string().min(10, t('validation.desc_min')),
  price: z.number({ message: t('validation.price_valid') }).positive(t('validation.price_positive')),
  stock: z.number({ message: t('validation.stock_valid') }).int().nonnegative(t('validation.stock_positive')),
  category: z.string().min(1, t('validation.category_required')),
});

export default function EditProductPage() {
  const params = useParams(); 
  const id = params.id;
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const t = useTranslations('Merchant.Products.Edit');
  const tAdd = useTranslations('Merchant.Products.Add');
  const tCommon = useTranslations('Common');

  const productSchema = getProductSchema((key: string) => tAdd(key));
  type ProductFormData = z.infer<typeof productSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  // Mock fetching existing product data
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        id,
        title: 'Premium Sneakers',
        description: 'High quality premium sneakers for everyday use.',
        price: 120.00,
        stock: 45,
        category: 'clothing',
      };
    }
  });

  // Update form default values when data is loaded
  useEffect(() => {
    if (product) {
      reset({
        title: product.title,
        description: product.description,
        price: product.price,
        stock: product.stock,
        category: product.category,
      });
    }
  }, [product, reset]);

  // Mock API call for updating the product
  const mutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Enforce status reset to PENDING_APPROVAL upon edit
      const payload = {
        ...data,
        id,
        status: 'PENDING_APPROVAL'
      };
      
      console.log('Updated Product Payload:', payload);
      return payload;
    },
    onSuccess: () => {
      // Redirect back to products page after successful update
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

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tAdd('product_title')}</label>
              <input
                type="text"
                {...register('title')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              />
              {errors.title && <p className="text-error text-sm mt-1">{errors.title.message}</p>}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tAdd('price')}</label>
              <input
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              />
              {errors.price && <p className="text-error text-sm mt-1">{errors.price.message}</p>}
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tAdd('stock')}</label>
              <input
                type="number"
                {...register('stock', { valueAsNumber: true })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              />
              {errors.stock && <p className="text-error text-sm mt-1">{errors.stock.message}</p>}
            </div>

            {/* Category */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tAdd('category')}</label>
              <select
                {...register('category')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none bg-white"
              >
                <option value="">{tAdd('select_category')}</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="home">Home & Garden</option>
                <option value="sports">Sports</option>
              </select>
              {errors.category && <p className="text-error text-sm mt-1">{errors.category.message}</p>}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tAdd('description_label')}</label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
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
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <Link
              href="/merchant/products"
              className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              {tCommon('cancel')}
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {mutation.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
              {mutation.isPending ? tCommon('loading') : tCommon('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
