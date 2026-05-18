'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@/src/i18n/routing';
import { ArrowLeft, Loader2, UploadCloud, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { Link } from '@/src/i18n/routing';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ProductService } from '@/src/services/productService';
import { createClient } from '@/src/lib/supabase/client';

// Schema that supports variants based on the ERD
const getProductSchema = (t: any) => z.object({
  name_ar: z.string().min(3, t('validation.title_min') || 'Title too short'),
  name_en: z.string().optional(),
  description_ar: z.string().min(10, t('validation.desc_min') || 'Description too short'),
  description_en: z.string().optional(),
  category_id: z.string().min(1, 'Category is required'),
  variants: z.array(z.object({
    price: z.preprocess((val) => Number.isNaN(val) ? undefined : val, z.number({ required_error: 'السعر مطلوب' }).positive()),
    stock_quantity: z.preprocess((val) => Number.isNaN(val) ? undefined : val, z.number({ required_error: 'الكمية مطلوبة' }).int().nonnegative()),
    weight_kg: z.preprocess((val) => Number.isNaN(val) ? undefined : val, z.number().optional()),
    sku: z.string().optional(),
    color_id: z.string().nullable().optional(),
    size_id: z.string().nullable().optional(),
  })).min(1, 'At least one variant is required'),
  size_type_id: z.string().nullable().optional(),
});

export default function AddProductPage() {
  const router = useRouter();
  const t = useTranslations('Merchant.Products.Add');
  const tCommon = useTranslations('Common');

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [images, setImages] = useState<{ url: string; is_main: boolean }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Reference Data from DB
  const [categories, setCategories] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [sizeTypes, setSizeTypes] = useState<any[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);

  // Fetch ERD Reference Data
  useEffect(() => {
    async function loadReferenceData() {
      const supabase = createClient() as any;
      if (!supabase) return;
      
      const [catsRes, colorsRes, sizeTypesRes, sizesRes] = await Promise.all([
        supabase.from('categories').select('id, name_en, name_ar'),
        supabase.from('colors').select('id, name, hex_code'),
        supabase.from('size_types').select('id, name'),
        supabase.from('sizes').select('id, name, size_type_id')
      ]);

      if (catsRes.data) setCategories(catsRes.data);
      if (colorsRes.data) setColors(colorsRes.data);
      if (sizeTypesRes.data) setSizeTypes(sizeTypesRes.data);
      if (sizesRes.data) setSizes(sizesRes.data);
    }
    loadReferenceData();
  }, []);

  const productSchema = getProductSchema((key: string) => t(key));
  type ProductFormData = z.infer<typeof productSchema>;

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      variants: [{ price: 0, stock_quantity: 0 }] // Initial empty variant
    }
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: "variants"
  });

  const selectedSizeTypeId = watch('size_type_id');
  const filteredSizes = selectedSizeTypeId ? sizes.filter(s => s.size_type_id === selectedSizeTypeId) : sizes;

  // Handle Multiple Images Upload to Cloudinary
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    setSubmitError(null);

    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'tujaria_unsigned';
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'diw3yge3k';

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', preset);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (response.ok) {
          return data.secure_url;
        } else {
          throw new Error(data.error?.message || 'Failed to upload image');
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      // Append new images. First image ever uploaded becomes main automatically.
      setImages(prev => [
        ...prev,
        ...uploadedUrls.map((url, i) => ({
          url,
          is_main: prev.length === 0 && i === 0 // Make main if it's the very first image
        }))
      ]);

    } catch (err: any) {
      console.error('Upload Error:', err);
      setSubmitError(err.message || 'Error uploading images');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== indexToRemove);
      // Ensure there's always one main image if images exist
      if (newImages.length > 0 && !newImages.some(img => img.is_main)) {
        newImages[0].is_main = true;
      }
      return newImages;
    });
  };

  const setMainImage = (indexToSet: number) => {
    setImages(prev => prev.map((img, i) => ({ ...img, is_main: i === indexToSet })));
  };

  const mutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (images.length === 0) {
        throw new Error('Please upload at least one product image.');
      }
      
      // Structure payload perfectly for ProductService
      const payload = {
        name_ar: data.name_ar,
        name_en: data.name_en || data.name_ar, // Fallback to Arabic if English is missing
        description_ar: data.description_ar,
        description_en: data.description_en || data.description_ar, // Fallback to Arabic if English is missing
        category_id: data.category_id,
        variants: data.variants.map(v => ({
          price: v.price,
          stock_quantity: v.stock_quantity,
          weight_kg: v.weight_kg,
          sku: v.sku,
          color_id: v.color_id === '' ? null : v.color_id,
          size_id: v.size_id === '' ? null : v.size_id
        })),
        images: images // Includes URL and is_main
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
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/merchant/products" 
          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors rtl:rotate-180"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-foreground">إضافة منتج متكامل</h1>
          <p className="text-gray-500 mt-1">أضف تفاصيل منتجك بجميع مقاساته، ألوانه وصوره المتعددة.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Section 1: Basic Info */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
          <h2 className="text-xl font-bold border-b pb-4">البيانات الأساسية للمنتج (Basic Info)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">اسم المنتج بالعربية *</label>
                <input
                  type="text"
                  {...register('name_ar')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none rtl text-right"
                  placeholder="تيشيرت أوفرسايز..."
                />
                {errors.name_ar && <p className="text-error text-sm mt-1">{errors.name_ar.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">الوصف بالعربية *</label>
                <textarea
                  {...register('description_ar')}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none resize-none rtl text-right"
                />
                {errors.description_ar && <p className="text-error text-sm mt-1">{errors.description_ar.message}</p>}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name EN *</label>
                <input
                  type="text"
                  {...register('name_en')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none ltr text-left"
                  placeholder="Oversized T-shirt..."
                />
                {errors.name_en && <p className="text-error text-sm mt-1">{errors.name_en.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description EN *</label>
                <textarea
                  {...register('description_en')}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none resize-none ltr text-left"
                />
                {errors.description_en && <p className="text-error text-sm mt-1">{errors.description_en.message}</p>}
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">القسم (Category) *</label>
                <select
                  {...register('category_id')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none bg-white"
                >
                  <option value="">اختر القسم...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name_ar} / {cat.name_en}
                    </option>
                  ))}
                </select>
                {errors.category_id && <p className="text-error text-sm mt-1">{errors.category_id.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">نوع المقاس (Size Type)</label>
                <select
                  {...register('size_type_id')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none bg-white"
                >
                  <option value="">بدون مقاس</option>
                  {sizeTypes.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">يحدد نوع المقاسات التي ستظهر للمتغيرات (مثل: ملابس، أحذية)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Images Upload */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-xl font-bold border-b pb-4 flex justify-between items-center">
            <span>صور المنتج (Product Images) *</span>
            <span className="text-sm font-normal text-gray-400">يمكنك رفع صور متعددة</span>
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Upload Button */}
            <div 
              className="border-2 border-dashed border-gray-300 rounded-2xl h-40 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-primary transition-colors relative"
              onClick={() => document.getElementById('multi-image-upload')?.click()}
            >
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm font-semibold text-gray-600">أضف صور</span>
                </>
              )}
              <input 
                id="multi-image-upload" 
                type="file" 
                multiple 
                accept="image/*" 
                className="sr-only" 
                onChange={handleImageUpload} 
              />
            </div>

            {/* Display Uploaded Images */}
            {images.map((img, idx) => (
              <div key={idx} className={`relative group h-40 rounded-2xl border-2 overflow-hidden ${img.is_main ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100'}`}>
                <img src={img.url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  {!img.is_main && (
                    <button type="button" onClick={() => setMainImage(idx)} className="text-xs font-bold text-white bg-black/50 px-3 py-1 rounded-full hover:bg-primary">
                      تعيين كرئيسية
                    </button>
                  )}
                  <button type="button" onClick={() => removeImage(idx)} className="text-white bg-error/80 p-2 rounded-full hover:bg-error">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {img.is_main && (
                  <div className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                    الرئيسية
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Variants (Colors, Sizes, Prices) */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-xl font-bold">خصائص المنتج المتعددة (Variants) *</h2>
            <button
              type="button"
              onClick={() => appendVariant({ price: 0, stock_quantity: 0 })}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary rounded-xl font-bold hover:bg-primary/20 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" /> إضافة متغير جديد
            </button>
          </div>

          <div className="space-y-6">
            {variantFields.map((field, index) => (
              <div key={field.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 relative">
                {variantFields.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeVariant(index)}
                    className="absolute top-4 left-4 p-2 text-gray-400 hover:text-error hover:bg-white rounded-lg transition-colors shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                
                <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">{index + 1}</span>
                  متغير رقم {index + 1}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {/* Price */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">السعر (EGP) *</label>
                    <input
                      type="number" step="0.01"
                      {...register(`variants.${index}.price`, { valueAsNumber: true })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-primary text-sm"
                    />
                    {errors.variants?.[index]?.price && <p className="text-error text-xs mt-1">{errors.variants[index]?.price?.message}</p>}
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">الكمية المتاحة *</label>
                    <input
                      type="number"
                      {...register(`variants.${index}.stock_quantity`, { valueAsNumber: true })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-primary text-sm"
                    />
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">الوزن (Kg)</label>
                    <input
                      type="number" step="0.01"
                      {...register(`variants.${index}.weight_kg`, { valueAsNumber: true })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-primary text-sm"
                    />
                  </div>

                  {/* SKU */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">SKU (اختياري)</label>
                    <input
                      type="text"
                      {...register(`variants.${index}.sku`)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-primary text-sm"
                    />
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">اللون</label>
                    <select
                      {...register(`variants.${index}.color_id`)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-primary text-sm bg-white"
                    >
                      <option value="">بدون لون</option>
                      {colors.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Size */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">المقاس</label>
                    <select
                      {...register(`variants.${index}.size_id`)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-primary text-sm bg-white"
                    >
                      <option value="">بدون مقاس</option>
                      {filteredSizes.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {submitError && (
          <div className="p-4 bg-error/10 text-error rounded-xl text-sm font-medium border border-error/20">
            {submitError}
          </div>
        )}

        {/* Submit Action */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={mutation.isPending || isUploading}
            className="px-10 py-4 bg-primary text-white rounded-2xl font-black hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 text-lg hover:-translate-y-1"
          >
            {mutation.isPending && <Loader2 className="w-6 h-6 animate-spin" />}
            {mutation.isPending ? 'جاري الإضافة...' : 'حفظ ونشر المنتج'}
          </button>
        </div>
      </form>
    </div>
  );
}
