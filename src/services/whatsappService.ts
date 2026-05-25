export interface WhatsAppMessagePayload {
  to: string;
  orderId: string;
  itemCount: number;
  productName: string;
  shippingPrice: number;
  totalPrice: number;
  imageUrl?: string;
  locale?: string;
}

/**
 * Service to handle automated WhatsApp Template Notifications via Meta Cloud API.
 * Uses environment variables:
 * - WHATSAPP_ACCESS_TOKEN
 * - WHATSAPP_PHONE_NUMBER_ID
 * - WHATSAPP_TEMPLATE_NAME
 */
export async function sendWhatsAppNotification(payload: WhatsAppMessagePayload) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'order_confirmation';

  if (!token || !phoneNumberId) {
    console.warn(
      '⚠️ WhatsApp Business API credentials (WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID) are not configured. Skipping automated message.'
    );
    return {
      success: false,
      error: 'WhatsApp credentials not configured in environment variables.',
    };
  }

  // Format recipient number (ensure no leading +, no spaces, no leading zeros)
  // Egypt numbers should start with 20
  let formattedPhone = payload.to.replace(/[^0-9]/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '2' + formattedPhone;
  }

  const isAr = payload.locale === 'ar';
  
  // Format items count text
  const itemCountText = isAr 
    ? `${payload.itemCount} ${payload.itemCount > 10 ? 'عنصر' : payload.itemCount >= 3 ? 'عناصر' : payload.itemCount === 2 ? 'عنصرين' : 'عنصر واحد'}`
    : `${payload.itemCount} Item${payload.itemCount > 1 ? 's' : ''}`;

  const shortOrderId = payload.orderId.split('-')[0] || payload.orderId;
  const shippingText = isAr 
    ? `رسوم التوصيل: ${payload.shippingPrice} جنيه`
    : `Shipping method: ${payload.shippingPrice} EGP`;

  // Fallback default image if none provided
  const imageUrl = payload.imageUrl || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500';

  const bodyData = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: isAr ? 'ar' : 'en',
      },
      components: [
        // 1. Header (Dynamic Image)
        {
          type: 'header',
          parameters: [
            {
              type: 'image',
              image: {
                link: imageUrl,
              },
            },
          ],
        },
        // 2. Body (Placeholders matching Meta template definition)
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: itemCountText, // {{1}} (e.g., "4 Items")
            },
            {
              type: 'text',
              text: `#${shortOrderId}`, // {{2}} (e.g., "Order #2395")
            },
            {
              type: 'text',
              text: shippingText, // {{3}} (e.g., "Shipping method: 45 EGP")
            },
            {
              type: 'text',
              text: `${payload.totalPrice.toFixed(2)} EGP`, // {{4}}
            }
          ],
        },
        // 3. Dynamic URL button parameter (e.g., view order page)
        {
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [
            {
              type: 'text',
              text: payload.orderId, // {{1}} appended to the base dynamic URL configured in Meta dashboard
            },
          ],
        },
      ],
    },
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ WhatsApp API Error Response:', data);
      return {
        success: false,
        error: data.error?.message || 'Failed to send WhatsApp message.',
      };
    }

    console.log('✅ WhatsApp Template Message Sent Successfully:', data);
    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error: any) {
    console.error('❌ WhatsApp API Network Error:', error);
    return {
      success: false,
      error: error.message || 'Network error sending WhatsApp notification.',
    };
  }
}
