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
import { ProductService } from '@/src/services/productService';

// Function to generate schema with translations
const getProductSchema = (t: any) => z.object({
  name_ar: z.string().min(3, t('validation.title_min')),
  name_en: z.string().min(3, t('validation.title_min')),
  description_ar: z.string().min(10, t('validation.desc_min')),
  description_en: z.string().min(10, t('validation.desc_min')),
  price: z.number({ message: t('validation.price_valid') }).positive(t('validation.price_positive')),
  stock: z.number({ message: t('validation.stock_valid') }).int().nonnegative(t('validation.stock_positive')),
  weight_kg: z.number({ message: 'Weight must be a valid number' }).positive('Weight must be positive').optional(),
  sku: z.string().optional(),
  category_id: z.string().optional(), // Make optional until we fetch real categories
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

  // Real API call using ProductService
  const mutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      // The payload matches the expected input in ProductService.createProduct
      const payload = {
        name_ar: data.name_ar,
        name_en: data.name_en,
        description_ar: data.description_ar,
        description_en: data.description_en,
        price: data.price,
        stock: data.stock,
        weight_kg: data.weight_kg || 0,
        sku: data.sku,
        category_id: data.category_id,
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80', // Default placeholder
      };
      
      return await ProductService.createProduct(payload);
    },
    onSuccess: () => {
      router.push('/merchant/products');
    },
    onError: (error: any) => {
      setSubmitError(error.message || 'Something went wrong');
    }
  });

  const onSubmit = (data: ProductFormData) => {
    setSubmitError(null);
    mutation.mutate(data);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/merchant/products" 
          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors rtl:rotate-180"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-foreground">{t('title') || 'Add New Product'}</h1>
          <p className="text-gray-500 mt-1">{t('description') || 'Fill details for both Arabic and English.'}</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Image Upload Placeholder */}
          <div className="col-span-full">
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('images') || 'Product Image'}</label>
            <div className="mt-2 flex justify-center rounded-2xl border border-dashed border-gray-300 px-6 py-12 hover:bg-gray-50 transition-colors cursor-pointer group">
              <div className="text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-300 group-hover:text-primary transition-colors" aria-hidden="true" />
                <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                  <span className="relative rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80">
                    {t('upload_file') || 'Upload a file'}
                  </span>
                  <p className="pl-1">{t('drag_drop') || 'or drag and drop'}</p>
                </div>
                <p className="text-xs leading-5 text-gray-500">{t('file_hint') || 'PNG, JPG up to 10MB'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Arabic Info */}
            <div className="space-y-6">
              <h3 className="font-bold text-lg border-b pb-2">Arabic Details</h3>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">اسم المنتج (Product Name AR)</label>
                <input
                  type="text"
                  {...register('name_ar')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none rtl text-right"
                  placeholder="حذاء رياضي"
                />
                {errors.name_ar && <p className="text-error text-sm mt-1">{errors.name_ar.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">الوصف (Description AR)</label>
                <textarea
                  {...register('description_ar')}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none rtl text-right"
                  placeholder="وصف المنتج بالعربية..."
                />
                {errors.description_ar && <p className="text-error text-sm mt-1">{errors.description_ar.message}</p>}
              </div>
            </div>

            {/* English Info */}
            <div className="space-y-6">
              <h3 className="font-bold text-lg border-b pb-2">English Details</h3>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name EN</label>
                <input
                  type="text"
                  {...register('name_en')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none ltr text-left"
                  placeholder="Running Shoes"
                />
                {errors.name_en && <p className="text-error text-sm mt-1">{errors.name_en.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description EN</label>
                <textarea
                  {...register('description_en')}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none ltr text-left"
                  placeholder="Product description in English..."
                />
                {errors.description_en && <p className="text-error text-sm mt-1">{errors.description_en.message}</p>}
              </div>
            </div>

            {/* Pricing and Stock */}
            <div className="md:col-span-2 space-y-6">
              <h3 className="font-bold text-lg border-b pb-2">Inventory, Pricing & Shipping</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('price') || 'Price'}</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('price', { valueAsNumber: true })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                    placeholder="0.00"
                  />
                  {errors.price && <p className="text-error text-sm mt-1">{errors.price.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('stock') || 'Stock'}</label>
                  <input
                    type="number"
                    {...register('stock', { valueAsNumber: true })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                    placeholder="100"
                  />
                  {errors.stock && <p className="text-error text-sm mt-1">{errors.stock.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Weight (Kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('weight_kg', { valueAsNumber: true })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                    placeholder="1.5"
                  />
                  {errors.weight_kg && <p className="text-error text-sm mt-1">{errors.weight_kg.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">SKU (Optional)</label>
                  <input
                    type="text"
                    {...register('sku')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                    placeholder="PRD-001"
                  />
                </div>
              </div>
            </div>
            
            {/* Category */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('category') || 'Category'}</label>
              <select
                {...register('category_id')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none bg-white"
              >
                <option value="">{t('select_category') || 'Select a category'}</option>
                <option value="electronics">Electronics (Dummy)</option>
                <option value="clothing">Clothing (Dummy)</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">Note: Categories should be fetched from DB in a real scenario.</p>
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
              {mutation.isPending ? t('submitting') || 'Submitting...' : t('submit') || 'Submit Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
