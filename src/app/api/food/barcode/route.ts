import { NextResponse } from 'next/server';
import { lookupBarcode } from '@/lib/food/openFoodFacts';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Query parameter "code" is required' },
        { status: 400 }
      );
    }

    const result = await lookupBarcode(code);

    if (!result) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error looking up barcode:', error);
    return NextResponse.json(
      { error: 'Failed to lookup barcode' },
      { status: 500 }
    );
  }
}
