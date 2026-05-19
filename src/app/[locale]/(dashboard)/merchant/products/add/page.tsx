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
    price: z.number({ message: 'السعر مطلوب' }).positive(),
    stock_quantity: z.number({ message: 'الكمية مطلوبة' }).int().nonnegative(),
    weight_kg: z.number().nullable().optional(),
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
      try {
        const res = await fetch('/api/reference');
        if (!res.ok) throw new Error('Failed to fetch reference data');
        const data = await res.json();
        
        if (data.categories) setCategories(data.categories);
        if (data.colors) setColors(data.colors);
        if (data.sizeTypes) setSizeTypes(data.sizeTypes);
        if (data.sizes) setSizes(data.sizes);
      } catch (err) {
        console.error('Error loading reference data from API:', err);
      }
    }
    loadReferenceData();
  }, []);

  const productSchema = getProductSchema((key: string) => t(key));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type ProductFormData = any;

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
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

  // Bulk Variant Generation States
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [defaultPrice, setDefaultPrice] = useState<number>(333);
  const [defaultStock, setDefaultStock] = useState<number>(50);
  const [defaultWeight, setDefaultWeight] = useState<number>(0.5);

  // Clear selected sizes when size type changes
  useEffect(() => {
    setSelectedSizes([]);
  }, [selectedSizeTypeId]);

  // Cartesian combinations bulk variant generator
  const generateBulkVariants = () => {
    const generated: any[] = [];
    
    // If no colors and no sizes are selected, just add one default variant
    if (selectedColors.length === 0 && selectedSizes.length === 0) {
      generated.push({
        price: defaultPrice,
        stock_quantity: defaultStock,
        weight_kg: defaultWeight,
        sku: 'SKU-DEFAULT',
        color_id: null,
        size_id: null
      });
    }
    // If only colors are selected
    else if (selectedColors.length > 0 && selectedSizes.length === 0) {
      selectedColors.forEach(colorId => {
        const colorObj = colors.find(c => c.id === colorId);
        const colorName = colorObj ? colorObj.name.split(' ')[0] : 'COLOR';
        generated.push({
          price: defaultPrice,
          stock_quantity: defaultStock,
          weight_kg: defaultWeight,
          sku: `SKU-${colorName.toUpperCase()}`,
          color_id: colorId,
          size_id: null
        });
      });
    }
    // If only sizes are selected
    else if (selectedColors.length === 0 && selectedSizes.length > 0) {
      selectedSizes.forEach(sizeId => {
        const sizeObj = sizes.find(s => s.id === sizeId);
        const sizeName = sizeObj ? sizeObj.name : 'SIZE';
        generated.push({
          price: defaultPrice,
          stock_quantity: defaultStock,
          weight_kg: defaultWeight,
          sku: `SKU-${sizeName.toUpperCase()}`,
          color_id: null,
          size_id: sizeId
        });
      });
    }
    // If both are selected
    else {
      selectedColors.forEach(colorId => {
        const colorObj = colors.find(c => c.id === colorId);
        const colorName = colorObj ? colorObj.name.split(' ')[0] : 'COLOR';
        
        selectedSizes.forEach(sizeId => {
          const sizeObj = sizes.find(s => s.id === sizeId);
          const sizeName = sizeObj ? sizeObj.name : 'SIZE';
          generated.push({
            price: defaultPrice,
            stock_quantity: defaultStock,
            weight_kg: defaultWeight,
            sku: `SKU-${colorName.toUpperCase()}-${sizeName.toUpperCase()}`,
            color_id: colorId,
            size_id: sizeId
          });
        });
      });
    }

    setValue('variants', generated);
  };

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
        variants: data.variants.map((v: any) => ({
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
                {errors.name_ar && <p className="text-error text-sm mt-1">{(errors.name_ar as any)?.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">الوصف بالعربية *</label>
                <textarea
                  {...register('description_ar')}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none resize-none rtl text-right"
                />
                {errors.description_ar && <p className="text-error text-sm mt-1">{(errors.description_ar as any)?.message}</p>}
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
                {errors.name_en && <p className="text-error text-sm mt-1">{(errors.name_en as any)?.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description EN *</label>
                <textarea
                  {...register('description_en')}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none resize-none ltr text-left"
                />
                {errors.description_en && <p className="text-error text-sm mt-1">{(errors.description_en as any)?.message}</p>}
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
                {errors.category_id && <p className="text-error text-sm mt-1">{(errors.category_id as any)?.message}</p>}
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

        {/* Section 3: Dynamic Bulk Variants Builder */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
          <div className="border-b pb-4">
            <h2 className="text-xl font-bold">خصائص ومتغيرات المنتج (Variants Generator)</h2>
            <p className="text-sm text-gray-400 mt-1">توليد تلقائي للمتغيرات (جميع الألوان والمقاسات) بضغطة زر واحدة لتوفير الوقت.</p>
          </div>

          {/* Quick Selection Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
            {/* Colors Multi-Select Swatches */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-700">الألوان المتاحة للمنتج (Colors)</h4>
              <div className="flex flex-wrap gap-2">
                {colors.map(c => {
                  const isSelected = selectedColors.includes(c.id);
                  const toggleColorSelection = (colorId: string) => {
                    setSelectedColors(prev => 
                      prev.includes(colorId) ? prev.filter(id => id !== colorId) : [...prev, colorId]
                    );
                  };
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleColorSelection(c.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm' 
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span 
                        className="w-4 h-4 rounded-full border border-black/10 shrink-0" 
                        style={{ backgroundColor: c.hex_code || '#fff' }}
                      />
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sizes Multi-Select Filtered by Type */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-700">
                المقاسات المتاحة للمنتج (Sizes)
                {!selectedSizeTypeId && <span className="text-[10px] text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-md font-medium shrink-0 ml-2">يرجى تحديد نوع المقاس أولاً</span>}
              </h4>
              
              {selectedSizeTypeId ? (
                <div className="flex flex-wrap gap-2">
                  {filteredSizes.map(s => {
                    const isSelected = selectedSizes.includes(s.id);
                    const toggleSizeSelection = (sizeId: string) => {
                      setSelectedSizes(prev => 
                        prev.includes(sizeId) ? prev.filter(id => id !== sizeId) : [...prev, sizeId]
                      );
                    };
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleSizeSelection(s.id)}
                        className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                          isSelected 
                            ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm' 
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 leading-relaxed">يرجى تحديد "نوع المقاس" (Size Type) من قسم البيانات الأساسية لعرض المقاسات المتاحة للتوليد.</p>
              )}
            </div>

            {/* Quick Fill Default Parameters */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-700">القيم الافتراضية للمتغيرات (Quick Settings)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">السعر (EGP)</label>
                  <input
                    type="number"
                    value={defaultPrice}
                    onChange={(e) => setDefaultPrice(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">الكمية بالمخزن</label>
                  <input
                    type="number"
                    value={defaultStock}
                    onChange={(e) => setDefaultStock(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 outline-none text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <button
                    type="button"
                    onClick={generateBulkVariants}
                    className="w-full py-2.5 bg-primary text-white rounded-xl font-black text-xs hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-1"
                  >
                    توليد المتغيرات المدمجة تلقائياً
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Variants Table / Grid */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-800">
                قائمة المتغيرات المضافة ({variantFields.length})
              </h3>
              <button
                type="button"
                onClick={() => appendVariant({ price: 0, stock_quantity: 0 })}
                className="text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-xl transition-all"
              >
                + إضافة متغير يدوي مستقل
              </button>
            </div>

            {variantFields.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 border border-dashed rounded-2xl text-gray-400 text-sm">
                لم يتم إضافة أو توليد أي متغيرات للمنتج بعد. يرجى اختيار الألوان/المقاسات والضغط على توليد المتغيرات.
              </div>
            ) : (
              <div className="space-y-3">
                {variantFields.map((field, index) => {
                  const watchColorId = watch(`variants.${index}.color_id`);
                  const watchSizeId = watch(`variants.${index}.size_id`);
                  
                  const activeColor = colors.find(c => c.id === watchColorId);
                  const activeSize = sizes.find(s => s.id === watchSizeId);

                  return (
                    <div key={field.id} className="p-4 bg-white border border-gray-100 hover:border-gray-200 rounded-2xl shadow-sm flex flex-col lg:flex-row items-start lg:items-center gap-4 transition-all relative">
                      
                      {/* Combination Badges Indicator */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-bold">
                          {index + 1}
                        </span>
                        
                        {/* Color badge */}
                        {activeColor ? (
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold text-gray-700">
                            <span className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: activeColor.hex_code }} />
                            {activeColor.name}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-50 rounded-lg text-[10px] text-gray-400 font-semibold border border-dashed">لا يوجد لون</span>
                        )}

                        {/* Size badge */}
                        {activeSize ? (
                          <span className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-black text-primary">
                            {activeSize.name}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-50 rounded-lg text-[10px] text-gray-400 font-semibold border border-dashed">بدون مقاس</span>
                        )}
                      </div>

                      {/* Input fields row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1 w-full">
                        <div>
                          <label className="block text-[9px] font-bold text-gray-400 mb-0.5">SKU رمز المتغير</label>
                          <input
                            type="text"
                            {...register(`variants.${index}.sku`)}
                            className="w-full px-3 py-1.5 rounded-xl border border-gray-200 outline-none text-xs focus:border-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-gray-400 mb-0.5">السعر (EGP) *</label>
                          <input
                            type="number" step="0.01"
                            {...register(`variants.${index}.price`, { valueAsNumber: true })}
                            className="w-full px-3 py-1.5 rounded-xl border border-gray-200 outline-none text-xs focus:border-primary font-bold text-primary"
                          />
                          {(errors as any).variants?.[index]?.price && (
                            <p className="text-error text-[10px] mt-0.5">{(errors as any).variants?.[index]?.price?.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-gray-400 mb-0.5">الكمية *</label>
                          <input
                            type="number"
                            {...register(`variants.${index}.stock_quantity`, { valueAsNumber: true })}
                            className="w-full px-3 py-1.5 rounded-xl border border-gray-200 outline-none text-xs focus:border-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-gray-400 mb-0.5">الوزن (Kg)</label>
                          <input
                            type="number" step="0.01"
                            {...register(`variants.${index}.weight_kg`, { valueAsNumber: true })}
                            className="w-full px-3 py-1.5 rounded-xl border border-gray-200 outline-none text-xs focus:border-primary"
                          />
                        </div>
                      </div>

                      {/* Selectable manual overrides for Color and Size (for manual addition flexibility) */}
                      {!activeColor && !activeSize && (
                        <div className="flex gap-2 w-full lg:w-auto mt-2 lg:mt-0">
                          <select
                            {...register(`variants.${index}.color_id`)}
                            className="px-2 py-1 rounded-lg border border-gray-200 text-xs bg-white focus:border-primary outline-none"
                          >
                            <option value="">لون...</option>
                            {colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>

                          <select
                            {...register(`variants.${index}.size_id`)}
                            className="px-2 py-1 rounded-lg border border-gray-200 text-xs bg-white focus:border-primary outline-none"
                          >
                            <option value="">مقاس...</option>
                            {filteredSizes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                      )}

                      {/* Delete combination button */}
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-gray-400 hover:text-error hover:bg-red-50 p-2 rounded-xl transition-all self-end lg:self-auto ml-auto lg:ml-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  );
                })}
              </div>
            )}
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
