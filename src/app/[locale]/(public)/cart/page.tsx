'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { ShoppingBag, Loader2, CheckCircle2, User, MapPin, Phone, Plus, Minus, Trash2, Tag, X, CheckCircle, Store } from 'lucide-react';
import { createClient } from '@/src/lib/supabase/client';
import { useRouter, Link } from '@/src/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';

interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
}

interface ProductDetails {
  id: string;
  name_ar: string;
  name_en: string;
  store_id: string | null;
  stores: { id: string; name: string } | null;
  product_variants: any[];
  product_images: any[];
}

function CartCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, ProductDetails>>({});

  const [governorates, setGovernorates] = useState<any[]>([]);
  const [selectedGovId, setSelectedGovId] = useState('');

  const [shippingQuotes, setShippingQuotes] = useState<Record<string, number>>({});
  const [shippingLoading, setShippingLoading] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ couponId: string; code: string; discountAmount: number } | null>(null);

  // 1. Sync URL and LocalStorage into cartItems array
  useEffect(() => {
    let currentCart: CartItem[] = [];

    // First read from LocalStorage
    const saved = localStorage.getItem('wesal_cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          currentCart = parsed;
        } else if (parsed && parsed.productId) {
          currentCart = [parsed];
        }
      } catch (e) {
        console.error('Error parsing cart from localStorage', e);
      }
    }

    const productId = searchParams.get('productId');
    const variantId = searchParams.get('variantId');
    const urlQuantity = searchParams.get('quantity');

    if (productId) {
      // URL parameters take priority (e.g. direct Buy Now links)
      const parsedQty = urlQuantity ? parseInt(urlQuantity, 10) : 1;
      const vId = variantId || '';

      const existingIndex = currentCart.findIndex(item => item.variantId === vId && item.productId === productId);
      if (existingIndex >= 0) {
        currentCart[existingIndex].quantity += (isNaN(parsedQty) ? 1 : parsedQty);
      } else {
        currentCart.push({
          productId,
          variantId: vId,
          quantity: isNaN(parsedQty) ? 1 : parsedQty
        });
      }

      localStorage.setItem('wesal_cart', JSON.stringify(currentCart));
      window.dispatchEvent(new Event('wesal_cart_updated'));
      // Clean up URL to avoid re-adding on refresh
      router.replace('/cart');
    }

    setCartItems(currentCart);
  }, [searchParams, router]);

  // 2. Fetch products and governorates
  useEffect(() => {
    async function loadData() {
      if (cartItems.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const supabase = createClient() as any;
      if (!supabase) return;

      try {
        if (governorates.length === 0) {
          const { data: govData } = await supabase
            .from('governorates')
            .select('*')
            .eq('is_active', true)
            .order(isRtl ? 'name_ar' : 'name_en');

          if (govData) {
            setGovernorates(govData);
            const cairo = govData.find((g: any) => g.name_en.toLowerCase() === 'cairo');
            if (cairo) {
              setSelectedGovId(cairo.id);
            } else if (govData.length > 0) {
              setSelectedGovId(govData[0].id);
            }
          }
        }

        const productIds = Array.from(new Set(cartItems.map(item => item.productId)));
        const { data: productsData } = await supabase
          .from('products')
          .select('*, product_variants(*, colors(name), sizes(name)), product_images(*), stores(id, name)')
          .in('id', productIds);

        if (productsData) {
          const pMap: Record<string, ProductDetails> = {};
          productsData.forEach((p: any) => {
            if (p.product_variants) {
              p.product_variants.forEach((v: any) => {
                v.original_price = v.price;
              });
            }
            pMap[p.id] = p;
          });
          setProductsMap(pMap);

          // Remove stale cart items whose products no longer exist in the database
          const validIds = new Set(Object.keys(pMap));
          const validCart = cartItems.filter(item => validIds.has(item.productId));
          if (validCart.length !== cartItems.length) {
            setCartItems(validCart);
            localStorage.setItem('wesal_cart', JSON.stringify(validCart));
            window.dispatchEvent(new Event('wesal_cart_updated'));
          }
        }
      } catch (err) {
        console.error('Error loading checkout data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [JSON.stringify(cartItems), isRtl]);

  // 3. Fetch shipping quotes whenever selectedGovId or stores change
  useEffect(() => {
    async function fetchQuotes() {
      if (!selectedGovId || cartItems.length === 0 || Object.keys(productsMap).length === 0) return;

      const storeIds = Array.from(new Set(
        cartItems.map(item => {
          const product = productsMap[item.productId];
          return product?.store_id || 'platform'; // Use 'platform' if no store
        })
      ));

      setShippingLoading(true);
      try {
        // Send actual store IDs (filter out 'platform')
        const validStoreIds = storeIds.filter(id => id !== 'platform');

        let fetchedQuotes: Record<string, number> = {};

        if (validStoreIds.length > 0) {
          const response = await fetch('/api/shipping/quotes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storeIds: validStoreIds, governorateId: selectedGovId })
          });
          const data = await response.json();
          if (data.quotes) {
            fetchedQuotes = data.quotes;
          }
        }

        // Fallback for platform items (no store)
        if (storeIds.includes('platform')) {
          const gov = governorates.find(g => g.id === selectedGovId);
          fetchedQuotes['platform'] = Number(gov?.shipping_price || 45);
        }

        setShippingQuotes(fetchedQuotes);
      } catch (err) {
        console.error('Failed to fetch shipping quotes', err);
      } finally {
        setShippingLoading(false);
      }
    }
    fetchQuotes();
  }, [selectedGovId, cartItems, productsMap, governorates]);

  const updateQuantity = (variantId: string, newQty: number) => {
    const updated = cartItems.map(item =>
      item.variantId === variantId ? { ...item, quantity: newQty } : item
    );
    setCartItems(updated);
    localStorage.setItem('wesal_cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('wesal_cart_updated'));
  };

  const removeItem = (variantId: string) => {
    const updated = cartItems.filter(item => item.variantId !== variantId);
    setCartItems(updated);
    localStorage.setItem('wesal_cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('wesal_cart_updated'));
  };

  // Group items by store
  const groupedItems = cartItems.reduce((acc, item) => {
    const product = productsMap[item.productId];
    if (!product) return acc;
    const storeId = product.store_id || 'platform';
    const storeName = product.stores?.name || (isRtl ? 'منتجات وافر' : 'WafirProducts');

    if (!acc[storeId]) {
      acc[storeId] = { storeId, storeName, items: [], subtotal: 0 };
    }

    const variant = product.product_variants.find((v: any) => v.id === item.variantId) || product.product_variants[0];
    const price = Number(variant?.price || 0);
    acc[storeId].items.push({ cartItem: item, product, variant, price });
    acc[storeId].subtotal += price * item.quantity;

    return acc;
  }, {} as Record<string, { storeId: string; storeName: string; items: any[]; subtotal: number }>);

  // Calculations
  const productsSubtotal = Object.values(groupedItems).reduce((sum, group) => sum + group.subtotal, 0);
  const totalShipping = Object.values(groupedItems).reduce((sum, group) => sum + (shippingQuotes[group.storeId] || 0), 0);
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const finalPrice = productsSubtotal + totalShipping - discountAmount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    setAppliedCoupon(null);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, orderTotal: productsSubtotal + totalShipping })
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
      setErrorMsg(isRtl ? 'يرجى ملء جميع حقول الشحن.' : 'Please fill in all shipping fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          phone,
          address,
          governorateId: selectedGovId,
          items: cartItems, // SENDING MULTIPLE ITEMS
          couponCode: appliedCoupon?.code,
          guestId: 'de000000-0000-0000-0000-000000000000'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order.');
      }

      // Decrement stock securely
      cartItems.forEach(async (item) => {
        await fetch('/api/products/decrement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variantId: item.variantId, quantity: item.quantity })
        }).catch(() => { });
      });

      if (appliedCoupon?.couponId) {
        await fetch('/api/coupons/use', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ couponId: appliedCoupon.couponId })
        }).catch(() => { });
      }

      localStorage.removeItem('wesal_cart');
      window.dispatchEvent(new Event('wesal_cart_updated'));
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

  if (success) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-gray-100 rounded-3xl shadow-xl text-center space-y-6 animate-in fade-in zoom-in duration-300" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto text-success">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-foreground">
            {isRtl ? '🎉 تم تأكيد طلباتك بنجاح!' : '🎉 Orders Placed Successfully!'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isRtl ? 'شكراً لك! سيتم التواصل معك قريباً لتأكيد الشحن.' : 'Thank you! We will contact you soon to confirm shipping.'}
          </p>
        </div>
        <p className="text-xs text-gray-400">
          {isRtl ? 'سيتم تحويلك للصفحة الرئيسية تلقائياً خلال لحظات.' : 'You will be redirected to the home page shortly.'}
        </p>
      </div>
    );
  }

  if (cartItems.length === 0 && !loading) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-gray-100 rounded-3xl shadow-xl text-center space-y-6 animate-in fade-in zoom-in duration-300" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-foreground">
            {isRtl ? 'سلتك فارغة حالياً!' : 'Your cart is empty!'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isRtl ? 'يبدو أنك لم تقم بإضافة أي منتجات إلى سلتك بعد.' : "Looks like you haven't added any products to your cart yet."}
          </p>
        </div>
        <Link href="/" className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
          {isRtl ? 'تصفح المنتجات الآن' : 'Browse Products'}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-primary" />
          {isRtl ? 'إتمام الطلب' : 'Checkout'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isRtl ? 'قم بتأكيد بيانات الشحن لإكمال طلباتك.' : 'Confirm your shipping details to place your orders.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns (Cart Items Grouped by Store) */}
        <div className="lg:col-span-2 space-y-6">

          {Object.values(groupedItems).map((group, index) => (
            <div key={group.storeId} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                  <Store className="w-5 h-5 text-gray-400" />
                  {isRtl ? `شحنة ${index + 1} (من: ${group.storeName})` : `Shipment ${index + 1} (from: ${group.storeName})`}
                </h3>
                {shippingQuotes[group.storeId] !== undefined && (
                  <span className="text-sm font-semibold bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                    {isRtl ? 'مصاريف الشحن:' : 'Shipping:'} {shippingQuotes[group.storeId]} EGP
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {group.items.map((itemObj: any) => {
                  const { cartItem, product, variant, price } = itemObj;
                  const defaultImage = variant?.image_url || product?.product_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500';
                  const productName = isRtl ? (product.name_ar || 'منتج') : (product.name_en || 'Product');

                  return (
                    <div key={cartItem.variantId} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                      <img src={defaultImage} alt={productName} className="w-20 h-20 rounded-2xl object-cover border border-gray-100" />
                      <div className="flex-1 space-y-1">
                        <h4 className="font-bold text-gray-900 text-base">{productName}</h4>
                        <p className="text-xs text-gray-500 font-medium">
                          {variant?.colors?.name || variant?.sizes?.name
                            ? [variant?.colors?.name, variant?.sizes?.name].filter(Boolean).join(' - ')
                            : `SKU: ${variant?.sku || product?.sku || 'N/A'}`}
                        </p>
                        <p className="text-lg font-black text-primary">{price.toFixed(2)} EGP</p>
                      </div>

                      <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                        <button onClick={() => updateQuantity(cartItem.variantId, Math.max(1, cartItem.quantity - 1))} className="p-1 text-gray-500 hover:text-primary">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-black text-gray-900 min-w-[20px] text-center">{cartItem.quantity}</span>
                        <button onClick={() => updateQuantity(cartItem.variantId, cartItem.quantity + 1)} className="p-1 text-gray-500 hover:text-primary">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button onClick={() => removeItem(cartItem.variantId)} className="p-2.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Pricing Invoice breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-lg border-b pb-2 text-foreground">
              {isRtl ? 'تفصيل الفاتورة الشاملة' : 'Total Invoice Summary'}
            </h3>

            {/* Coupon Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                {isRtl ? 'كود الخصم' : 'Discount Code'}
              </label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-bold text-sm">{appliedCoupon.code}</span>
                    <span className="text-xs">- وفرت {appliedCoupon.discountAmount.toFixed(2)} EGP</span>
                  </div>
                  <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input type="text" value={couponCode} onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())} placeholder={isRtl ? 'أدخل كود الخصم...' : 'Enter coupon code...'} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm font-mono uppercase" />
                  <button onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()} className="px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50">
                    {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRtl ? 'تطبيق' : 'Apply')}
                  </button>
                </div>
              )}
              {couponError && <p className="text-red-500 text-xs flex items-center gap-1"><X className="w-3 h-3" /> {couponError}</p>}
            </div>

            <div className="space-y-3 text-sm pt-2">
              <div className="flex justify-between text-gray-500">
                <span>{isRtl ? 'المجموع الفرعي للمنتجات' : 'Products Subtotal'}</span>
                <span className="font-semibold">{productsSubtotal.toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between text-gray-500 items-center">
                <span className="flex items-center gap-2">
                  {isRtl ? 'إجمالي الشحن' : 'Total Shipping'}
                  {shippingLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                </span>
                <span className="font-semibold">{totalShipping.toFixed(2)} EGP</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{isRtl ? `خصم (${appliedCoupon?.code})` : `Discount (${appliedCoupon?.code})`}</span>
                  <span className="font-semibold">- {discountAmount.toFixed(2)} EGP</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-4 text-xl font-black text-gray-900">
                <span>{isRtl ? 'الإجمالي النهائي' : 'Grand Total'}</span>
                <span className="text-primary">{finalPrice.toFixed(2)} EGP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout shipping info */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 h-fit sticky top-28">
          <h3 className="font-bold text-lg border-b pb-3 text-foreground">
            {isRtl ? 'بيانات التوصيل' : 'Shipping Information'}
          </h3>
          <form onSubmit={handlePlaceOrder} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {isRtl ? 'الاسم بالكامل' : 'Full Name'}</label>
              <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder={isRtl ? 'أحمد محمد السيد' : 'John Doe'} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {isRtl ? 'رقم الهاتف' : 'Phone Number'}</label>
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0123456789" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {isRtl ? 'المحافظة' : 'Governorate'}</label>
              <select required value={selectedGovId} onChange={(e) => setSelectedGovId(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm bg-white">
                {governorates.map((gov) => (
                  <option key={gov.id} value={gov.id}>{isRtl ? gov.name_ar : gov.name_en}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {isRtl ? 'العنوان التفصيلي' : 'Detailed Address'}</label>
              <textarea required rows={3} value={address} onChange={(e) => setAddress(e.target.value)} placeholder={isRtl ? 'الشارع، رقم العمارة، رقم الشقة' : 'Street, Building, Apartment'} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm resize-none" />
            </div>

            {errorMsg && <div className="p-3 bg-error/10 text-error text-xs font-semibold rounded-xl">{errorMsg}</div>}

            <button type="submit" disabled={loading || cartItems.length === 0 || shippingLoading} className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {loading ? (isRtl ? 'جاري التنفيذ...' : 'Processing...') : (isRtl ? 'تأكيد الطلب الآن' : 'Confirm Order')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>}>
      <CartCheckoutContent />
    </Suspense>
  );
}
