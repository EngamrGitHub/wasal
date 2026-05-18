'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { ShoppingBag, Loader2, CheckCircle2, User, MapPin, Phone, Plus, Minus } from 'lucide-react';
import { createClient } from '@/src/lib/supabase/client';
import { useRouter } from '@/src/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';

function CartCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const productId = searchParams.get('productId');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  
  // Governorate / Shipping states
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [selectedGovId, setSelectedGovId] = useState('');
  const [actualShippingPrice, setActualShippingPrice] = useState(0);

  // Customer Form states
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 💡 This is the fixed shipping cost shown to the customer (The rest is absorbed into product price)
  const FIXED_CUSTOMER_SHIPPING = 45.00;

  // Fetch product and governorates
  useEffect(() => {
    async function loadData() {
      const supabase = createClient() as any;
      if (!supabase) return;

      // 1. Fetch Governorates
      const { data: govData } = await supabase
        .from('governorates')
        .select('*')
        .eq('is_active', true)
        .order(locale === 'ar' ? 'name_ar' : 'name_en');

      if (govData) {
        setGovernorates(govData);
        // Select Cairo by default if found
        const cairo = govData.find((g: any) => g.name_en.toLowerCase() === 'cairo');
        if (cairo) {
          setSelectedGovId(cairo.id);
          setActualShippingPrice(Number(cairo.shipping_price || 45));
        } else if (govData.length > 0) {
          setSelectedGovId(govData[0].id);
          setActualShippingPrice(Number(govData[0].shipping_price || 0));
        }
      }

      // 2. Fetch specific product or fallback
      let query = supabase.from('products').select('*, product_variants(*), product_images(*)');
      
      if (productId) {
        query = query.eq('id', productId);
      }
      
      const { data: prodData } = await query.limit(1);

      if (prodData && prodData.length > 0) {
        setProduct(prodData[0]);
      }
    }
    loadData();
  }, [productId, locale]);

  const handleGovChange = (govId: string) => {
    setSelectedGovId(govId);
    const gov = governorates.find(g => g.id === govId);
    if (gov) {
      setActualShippingPrice(Number(gov.shipping_price || 0));
    }
  };

  // 🧮 Calculations for hidden shipping logic
  const basePrice = Number(product?.product_variants?.[0]?.price || 350.00);
  
  // Calculate extra shipping to be secretly absorbed into product price
  const extraShipping = Math.max(0, actualShippingPrice - FIXED_CUSTOMER_SHIPPING);
  const displayShipping = Math.min(actualShippingPrice, FIXED_CUSTOMER_SHIPPING);
  
  const displayProductPrice = basePrice + extraShipping;
  const productsSubtotal = displayProductPrice * quantity;
  const finalPrice = productsSubtotal + displayShipping;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !address || !phone || !selectedGovId) {
      setErrorMsg(locale === 'ar' ? 'يرجى ملء جميع حقول الشحن.' : 'Please fill in all shipping fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = createClient() as any;
      if (!supabase) throw new Error('Supabase client missing');

      const guestId = 'de000000-0000-0000-0000-000000000000'; // Generic guest user ID
      
      // Upsert profile
      await supabase.from('profiles').upsert({
        id: guestId,
        full_name: customerName,
        phone: phone
      });

      // 1. Create Order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: guestId,
          governorate_id: selectedGovId,
          products_total: productsSubtotal, // Save the combined product price
          commission_total: 0, // Admin commission is already calculated inside basePrice elsewhere
          fixed_shipping_price: displayShipping,
          final_price: finalPrice,
          status: 'PENDING',
          shipping_address: {
            name: customerName,
            address: address,
            phone: phone,
            governorate: governorates.find(g => g.id === selectedGovId)?.name_en || ''
          }
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create Order Item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: orderData.id,
          product_id: product?.id,
          variant_id: product?.product_variants?.[0]?.id,
          quantity: quantity,
          unit_price: displayProductPrice, // Save the combined price
          total_price: productsSubtotal,
          commission_amount: 0 // No separate markup here
        });

      if (itemError) throw itemError;

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 3000);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  const defaultImage = product?.product_images?.find((img: any) => img.is_main)?.image_url 
    || product?.product_images?.[0]?.image_url 
    || product?.product_variants?.[0]?.image_url
    || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500';

  const productName = locale === 'ar' 
    ? (product?.name_ar || 'قميص أزرق كلاسيكي فاخر') 
    : (product?.name_en || 'Premium Classic Blue Shirt');

  if (success) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-gray-100 rounded-3xl shadow-xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto text-success">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground">
            {locale === 'ar' ? 'تم تأكيد طلبك بنجاح!' : 'Order Placed Successfully!'}
          </h2>
          <p className="text-gray-500 mt-2">
            {locale === 'ar' 
              ? 'شكراً لك. سيتم التواصل معك قريباً لتأكيد الشحن.' 
              : 'Thank you. We will contact you soon to confirm shipping.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-8" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-primary" />
          {locale === 'ar' ? 'إتمام الطلب' : 'Checkout'}
        </h1>
        <p className="text-gray-500 mt-1">
          {locale === 'ar' 
            ? 'قم بتأكيد بيانات الشحن لإكمال الطلب وتوصيله إليك.' 
            : 'Confirm your shipping details to place your order.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Cart Item Detail */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-lg border-b pb-3 text-foreground">
              {locale === 'ar' ? 'المنتجات في سلتك' : 'Cart Items'}
            </h3>
            {product ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 py-2">
                <img 
                  src={defaultImage} 
                  alt={productName} 
                  className="w-24 h-24 rounded-2xl object-cover border border-gray-100"
                />
                <div className="flex-1 space-y-1">
                  <h4 className="font-bold text-gray-900 text-lg">{productName}</h4>
                  <p className="text-xs text-gray-400 mb-2">SKU: {product.product_variants?.[0]?.sku || 'SHIRT-BLUE-01'}</p>
                  
                  {/* Clean Customer Price */}
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-black text-primary">
                      {displayProductPrice.toFixed(2)} EGP
                    </p>
                  </div>
                </div>
                
                {/* Quantity selector */}
                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                  <button 
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-1 text-gray-500 hover:text-primary transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-black text-gray-900 min-w-[20px] text-center">{quantity}</span>
                  <button 
                    type="button"
                    onClick={() => setQuantity(q => q + 1)}
                    className="p-1 text-gray-500 hover:text-primary transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400">
                {locale === 'ar' ? 'جاري تحميل تفاصيل المنتج...' : 'Loading product details...'}
              </div>
            )}
          </div>

          {/* Pricing Invoice breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-lg border-b pb-2 text-foreground">
              {locale === 'ar' ? 'تفصيل الفاتورة' : 'Invoice Summary'}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>{locale === 'ar' ? 'المجموع الفرعي للمنتجات' : 'Products Subtotal'}</span>
                <span className="font-semibold">{productsSubtotal.toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>{locale === 'ar' ? 'تكلفة الشحن' : 'Shipping'}</span>
                <span className="font-semibold">{displayShipping.toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between border-t pt-4 text-xl font-black text-gray-900">
                <span>{locale === 'ar' ? 'الإجمالي' : 'Total'}</span>
                <span className="text-primary">{finalPrice.toFixed(2)} EGP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout shipping info */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 h-fit">
          <h3 className="font-bold text-lg border-b pb-3 text-foreground">
            {locale === 'ar' ? 'بيانات التوصيل' : 'Shipping Information'}
          </h3>
          <form onSubmit={handlePlaceOrder} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> {locale === 'ar' ? 'الاسم بالكامل' : 'Full Name'}
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={locale === 'ar' ? 'أحمد محمد السيد' : 'John Doe'}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> {locale === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0123456789"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> {locale === 'ar' ? 'المحافظة' : 'Governorate'}
              </label>
              <select
                required
                value={selectedGovId}
                onChange={(e) => handleGovChange(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm bg-white transition"
              >
                {governorates.map((gov) => (
                  <option key={gov.id} value={gov.id}>
                    {locale === 'ar' ? gov.name_ar : gov.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> {locale === 'ar' ? 'العنوان التفصيلي' : 'Detailed Address'}
              </label>
              <textarea
                required
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={locale === 'ar' ? 'الشارع، رقم العمارة، رقم الشقة' : 'Street, Building, Apartment'}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm resize-none transition"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-error/10 text-error text-xs font-semibold rounded-xl">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !product}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {loading 
                ? (locale === 'ar' ? 'جاري تأكيد الطلب...' : 'Processing...') 
                : (locale === 'ar' ? 'تأكيد الطلب الآن' : 'Confirm Order')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <CartCheckoutContent />
    </Suspense>
  );
}
