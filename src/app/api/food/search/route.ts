import { NextResponse } from 'next/server';
import { searchFoods } from '@/lib/food/usdaClient';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    const results = await searchFoods(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching foods:', error);
    return NextResponse.json([]);
  }
}
