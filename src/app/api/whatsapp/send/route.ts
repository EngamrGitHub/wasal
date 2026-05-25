import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppNotification, WhatsAppMessagePayload } from '@/src/services/whatsappService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, orderId, itemCount, productName, shippingPrice, totalPrice, imageUrl, locale } = body;

    if (!to || !orderId || !itemCount || !productName || totalPrice === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters (to, orderId, itemCount, productName, totalPrice)' },
        { status: 400 }
      );
    }

    const payload: WhatsAppMessagePayload = {
      to,
      orderId,
      itemCount,
      productName,
      shippingPrice: Number(shippingPrice || 0),
      totalPrice: Number(totalPrice),
      imageUrl,
      locale: locale || 'ar',
    };

    const result = await sendWhatsAppNotification(payload);

    if (!result.success) {
      // Return 200 with success: false so the client doesn't crash on checkout, just log the warning
      return NextResponse.json({
        success: false,
        warning: 'Message delivery skipped or failed.',
        error: result.error
      });
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error: any) {
    console.error('Error in send WhatsApp endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
