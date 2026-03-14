import { NextResponse } from 'next/server';

const AI_ENABLED = process.env.AI_ENABLED === 'true';

export async function POST(request: Request) {
  try {
    if (!AI_ENABLED) {
      return NextResponse.json({ aiEnabled: false });
    }

    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'image (base64 string) is required' },
        { status: 400 }
      );
    }

    const { analyzeFoodPhoto } = await import('@/lib/ai/analyzeFood');
    const analysis = await analyzeFoodPhoto(image);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing food photo:', error);
    return NextResponse.json(
      { error: 'Failed to analyze food photo' },
      { status: 500 }
    );
  }
}
