'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { ShoppingBag, Loader2, CheckCircle2, User, MapPin, Phone, Plus, Minus, Trash2, Tag, X, CheckCircle } from 'lucide-react';
import { createClient } from '@/src/lib/supabase/client';
import { useRouter, Link } from '@/src/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';

function CartCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const productId = searchParams.get('productId');
  const variantId = searchParams.get('variantId');
  const urlQuantity = searchParams.get('quantity');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [product, setProduct] = useState<any>(null);
  
  // Single source of truth for the active cart item
  const [cartItem, setCartItem] = useState<{ productId: string; variantId: string; quantity: number } | null>(null);
  
  // Governorate / Shipping states
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [selectedGovId, setSelectedGovId] = useState('');
  const [actualShippingPrice, setActualShippingPrice] = useState(0);

  // Customer Form states
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ couponId: string; code: string; discountAmount: number } | null>(null);

  // 💡 This is the fixed shipping cost shown to the customer (The rest is absorbed into product price)
  const FIXED_CUSTOMER_SHIPPING = 45.00;

  // 1. Sync URL and LocalStorage into a single cartItem state
  useEffect(() => {
    let activeItem: { productId: string; variantId: string; quantity: number } | null = null;

    if (productId) {
      // URL parameters take priority (when redirected from product detail page)
      const parsedQty = urlQuantity ? parseInt(urlQuantity, 10) : 1;
      activeItem = {
        productId,
        variantId: variantId || '',
        quantity: isNaN(parsedQty) ? 1 : parsedQty
      };
      localStorage.setItem('wesal_cart', JSON.stringify(activeItem));
      window.dispatchEvent(new Event('wesal_cart_updated'));
    } else {
      // Fallback: Read from LocalStorage (when navigating from Navbar)
      const saved = localStorage.getItem('wesal_cart');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.productId) {
            activeItem = {
              productId: parsed.productId,
              variantId: parsed.variantId || '',
              quantity: Number(parsed.quantity || 1)
            };
          }
        } catch (e) {
          console.error('Error parsing cart from localStorage', e);
        }
      }
    }

    setCartItem(activeItem);
  }, [productId, variantId, urlQuantity]);

  // 2. Fetch product details and governorates when cartItem.productId changes
  useEffect(() => {
    async function loadData() {
      if (!cartItem?.productId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const supabase = createClient() as any;
      if (!supabase) return;

      try {
        // Fetch governorates if not loaded yet
        if (governorates.length === 0) {
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
        }

        // Fetch product with variants and images via API to bypass RLS
        const response = await fetch(`/api/products/${cartItem.productId}`);
        if (response.ok) {
          const prodData = await response.json();
          setProduct(prodData);
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error('Error loading checkout data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [cartItem?.productId, locale]);

  const handleGovChange = (govId: string) => {
    setSelectedGovId(govId);
    const gov = governorates.find(g => g.id === govId);
    if (gov) {
      setActualShippingPrice(Number(gov.shipping_price || 0));
    }
  };

  // 🧮 Calculations for hidden shipping logic
  const selectedVariant = product?.product_variants?.find((v: any) => v.id === cartItem?.variantId) 
    || product?.product_variants?.[0];
  const basePrice = Number(selectedVariant?.price || 350.00);
  
  // Display shipping is the actual shipping cost of the chosen governorate.
  const displayShipping = Number(actualShippingPrice);
  
  // Product price is the clean basePrice
  const displayProductPrice = basePrice;
  const quantity = cartItem?.quantity || 1;
  const productsSubtotal = displayProductPrice * quantity;
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const finalPrice = productsSubtotal + displayShipping - discountAmount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    setAppliedCoupon(null);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, orderTotal: productsSubtotal + displayShipping })
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error || 'كود غير صحيح');
      } else {
        setAppliedCoupon({ couponId: data.couponId, code: data.code, discountAmount: data.discountAmount });
        setCouponError('');
      }
    } catch {
      setCouponError('حدث خطأ أثناء التحقق من الكود');
    } finally {
      setCouponLoading(false);
    }
  };

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
          products_total: productsSubtotal,
          commission_total: 0,
          fixed_shipping_price: displayShipping,
          actual_shipping_cost: actualShippingPrice,
          discount_id: appliedCoupon?.couponId || null,
          discount_amount: discountAmount,
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
          variant_id: selectedVariant?.id || product?.product_variants?.[0]?.id,
          quantity: quantity,
          unit_price: displayProductPrice, // Save the combined price
          total_price: productsSubtotal,
          commission_amount: 0 // No separate markup here
        });

      if (itemError) throw itemError;

      // Increment coupon usage if one was applied
      if (appliedCoupon?.couponId) {
        await fetch('/api/coupons/use', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ couponId: appliedCoupon.couponId })
        });
      }

      localStorage.removeItem('wesal_cart');
      window.dispatchEvent(new Event('wesal_cart_updated'));

      // Build WhatsApp confirmation message
      const govName = governorates.find(g => g.id === selectedGovId);
      const govLabel = locale === 'ar' ? govName?.name_ar : govName?.name_en;
      const pName = locale === 'ar'
        ? (product?.name_ar || product?.title?.ar || 'المنتج')
        : (product?.name_en || product?.title?.en || 'Product');
      const colorName = selectedVariant?.colors?.name || '';
      const sizeName = selectedVariant?.sizes?.name || '';
      const variantLine = [colorName, sizeName].filter(Boolean).join(' - ');

      const msgLines = locale === 'ar'
        ? [
            '🛍️ *طلب جديد من متجر وصال*',
            '',
            `👤 *الاسم:* ${customerName}`,
            `📞 *الهاتف:* ${phone}`,
            `📍 *المحافظة:* ${govLabel || ''}`,
            `🏠 *العنوان:* ${address}`,
            '',
            '🧾 *تفاصيل الطلب:*',
            `• المنتج: ${pName}`,
            variantLine ? `• المواصفات: ${variantLine}` : '',
            `• الكمية: ${quantity}`,
            '',
            `💰 سعر المنتجات: ${productsSubtotal.toFixed(2)} جنيه`,
            `🚚 الشحن: ${displayShipping.toFixed(2)} جنيه`,
            discountAmount > 0 ? `🏷️ خصم (${appliedCoupon?.code}): -${discountAmount.toFixed(2)} جنيه` : '',
            `✅ *الإجمالي النهائي: ${finalPrice.toFixed(2)} جنيه*`,
          ]
        : [
            '🛍️ *New Order - Wesal Store*',
            '',
            `👤 *Name:* ${customerName}`,
            `📞 *Phone:* ${phone}`,
            `📍 *Governorate:* ${govLabel || ''}`,
            `🏠 *Address:* ${address}`,
            '',
            '🧾 *Order Details:*',
            `• Product: ${pName}`,
            variantLine ? `• Variant: ${variantLine}` : '',
            `• Qty: ${quantity}`,
            '',
            `💰 Products subtotal: ${productsSubtotal.toFixed(2)} EGP`,
            `🚚 Shipping: ${displayShipping.toFixed(2)} EGP`,
            discountAmount > 0 ? `🏷️ Discount (${appliedCoupon?.code}): -${discountAmount.toFixed(2)} EGP` : '',
            `✅ *Grand Total: ${finalPrice.toFixed(2)} EGP*`,
          ];

      const msgText = msgLines.filter(l => l !== '').join('\n');
      // Store owner's WhatsApp number (Egypt +20) — hidden from the customer
      const STORE_WHATSAPP = '201124124461';
      const waUrl = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(msgText)}`;
      setWhatsappUrl(waUrl);

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 8000);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  const defaultImage = selectedVariant?.image_url
    || product?.product_images?.find((img: any) => img.is_main)?.image_url 
    || product?.product_images?.[0]?.image_url 
    || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500';

  const productName = locale === 'ar' 
    ? (product?.name_ar || 'قميص أزرق كلاسيكي فاخر') 
    : (product?.name_en || 'Premium Classic Blue Shirt');

  if (success) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-gray-100 rounded-3xl shadow-xl text-center space-y-6 animate-in fade-in zoom-in duration-300" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        {/* Success Icon */}
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto text-success">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-foreground">
            {locale === 'ar' ? '🎉 تم تأكيد طلبك بنجاح!' : '🎉 Order Placed Successfully!'}
          </h2>
          <p className="text-gray-500 text-sm">
            {locale === 'ar'
              ? 'شكراً لك! اضغط الزر أدناه لإرسال تفاصيل طلبك عبر الواتساب.'
              : 'Thank you! Tap the button below to send your order details via WhatsApp.'}
          </p>
        </div>

        {/* WhatsApp CTA Button */}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg transition-all duration-200 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', boxShadow: '0 8px 24px rgba(37,211,102,0.35)' }}
          >
            {/* WhatsApp SVG Icon */}
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white shrink-0" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            {locale === 'ar' ? 'أرسل تفاصيل طلبك على الواتساب' : 'Send Order Details on WhatsApp'}
          </a>
        )}

        <p className="text-xs text-gray-400">
          {locale === 'ar'
            ? 'سيتم تحويلك للصفحة الرئيسية تلقائياً خلال لحظات.'
            : 'You will be redirected to the home page shortly.'}
        </p>
      </div>
    );
  }

  if (!product && !loading) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-gray-100 rounded-3xl shadow-xl text-center space-y-6 animate-in fade-in zoom-in duration-300" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-foreground">
            {locale === 'ar' ? 'سلتك فارغة حالياً!' : 'Your cart is empty!'}
          </h2>
          <p className="text-gray-500 text-sm">
            {locale === 'ar' 
              ? 'يبدو أنك لم تقم بإضافة أي منتجات إلى سلتك بعد.' 
              : 'Looks like you haven\'t added any products to your cart yet.'}
          </p>
        </div>
        <Link 
          href="/" 
          className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
        >
          {locale === 'ar' ? 'تصفح المنتجات الآن' : 'Browse Products'}
        </Link>
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
                  <div className="flex items-center gap-2 mb-2">
                    {selectedVariant?.colors?.hex_code && (
                      <span 
                        className="w-4 h-4 rounded-full border border-gray-200 shadow-sm" 
                        style={{ backgroundColor: selectedVariant.colors.hex_code }}
                        title={selectedVariant.colors.name}
                      />
                    )}
                    <p className="text-xs text-gray-500 font-medium">
                      {selectedVariant?.colors?.name || selectedVariant?.sizes?.name 
                        ? [selectedVariant?.colors?.name, selectedVariant?.sizes?.name].filter(Boolean).join(' - ')
                        : `SKU: ${selectedVariant?.sku || product?.product_variants?.[0]?.sku || 'SHIRT-BLUE-01'}`}
                    </p>
                  </div>
                  
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
                    onClick={() => {
                      const newQ = Math.max(1, quantity - 1);
                      if (cartItem) {
                        const updated = { ...cartItem, quantity: newQ };
                        setCartItem(updated);
                        localStorage.setItem('wesal_cart', JSON.stringify(updated));
                        window.dispatchEvent(new Event('wesal_cart_updated'));
                      }
                    }}
                    className="p-1 text-gray-500 hover:text-primary transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-black text-gray-900 min-w-[20px] text-center">{quantity}</span>
                  <button 
                    type="button"
                    onClick={() => {
                      const newQ = quantity + 1;
                      if (cartItem) {
                        const updated = { ...cartItem, quantity: newQ };
                        setCartItem(updated);
                        localStorage.setItem('wesal_cart', JSON.stringify(updated));
                        window.dispatchEvent(new Event('wesal_cart_updated'));
                      }
                    }}
                    className="p-1 text-gray-500 hover:text-primary transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Delete / Remove button */}
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('wesal_cart');
                    window.dispatchEvent(new Event('wesal_cart_updated'));
                    setProduct(null);
                    setCartItem(null);
                    router.push('/cart');
                  }}
                  className="p-3 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all duration-200 shadow-sm"
                  title={locale === 'ar' ? 'حذف المنتج من السلة' : 'Remove Product'}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
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

            {/* Coupon Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                {locale === 'ar' ? 'كود الخصم' : 'Discount Code'}
              </label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-bold text-sm">{appliedCoupon.code}</span>
                    <span className="text-xs">- وفرت {appliedCoupon.discountAmount.toFixed(2)} EGP</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                    placeholder={locale === 'ar' ? 'أدخل كود الخصم...' : 'Enter coupon code...'}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm font-mono uppercase tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (locale === 'ar' ? 'تطبيق' : 'Apply')}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="text-red-500 text-xs flex items-center gap-1">
                  <X className="w-3 h-3" /> {couponError}
                </p>
              )}
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>{locale === 'ar' ? 'المجموع الفرعي للمنتجات' : 'Products Subtotal'}</span>
                <span className="font-semibold">{productsSubtotal.toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>{locale === 'ar' ? 'تكلفة الشحن' : 'Shipping'}</span>
                <span className="font-semibold">{displayShipping.toFixed(2)} EGP</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {locale === 'ar' ? `خصم (${appliedCoupon?.code})` : `Discount (${appliedCoupon?.code})`}
                  </span>
                  <span className="font-semibold">- {discountAmount.toFixed(2)} EGP</span>
                </div>
              )}
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
