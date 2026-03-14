import { NextResponse } from 'next/server';

const AI_ENABLED = process.env.AI_ENABLED === 'true';

export async function POST(request: Request) {
  try {
    if (!AI_ENABLED) {
      return NextResponse.json({ aiEnabled: false });
    }

    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'text is required' },
        { status: 400 }
      );
    }

    const { analyzeFoodText } = await import('@/lib/ai/analyzeFoodText');
    const analysis = await analyzeFoodText(text);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing food text:', error);
    return NextResponse.json(
      { error: 'Failed to analyze food text' },
      { status: 500 }
    );
  }
}
