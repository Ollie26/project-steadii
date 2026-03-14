import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const AI_ENABLED = process.env.AI_ENABLED === 'true';

export async function POST(request: Request) {
  try {
    if (!AI_ENABLED) {
      return NextResponse.json({ aiEnabled: false });
    }

    const body = await request.json();
    const { question } = body;

    if (!question) {
      return NextResponse.json(
        { error: 'question is required' },
        { status: 400 }
      );
    }

    const [meals, readings, lifestyleLogs, profile, painPoints] = await Promise.all([
      prisma.meal.findMany({
        include: { items: true },
        orderBy: { timestamp: 'desc' },
        take: 30,
      }),
      prisma.glucoseReading.findMany({
        orderBy: { timestamp: 'desc' },
        take: 500,
      }),
      prisma.lifestyleLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 30,
      }),
      prisma.userProfile.findUnique({ where: { id: 'default' } }),
      prisma.painPoint.findMany({ where: { isActive: true }, orderBy: { priority: 'asc' } }),
    ]);

    const serializedData = JSON.stringify({
      meals: meals.map((m) => ({
        name: m.name,
        mealType: m.mealType,
        timestamp: m.timestamp,
        carbsGrams: m.carbsGrams,
        calories: m.calories,
        tirScore: m.tirScore,
        tirColor: m.tirColor,
        items: m.items.map((i) => ({ name: i.name, carbsGrams: i.carbsGrams })),
      })),
      readings: readings.map((r) => ({
        value: r.value,
        timestamp: r.timestamp,
        trend: r.trend,
      })),
      lifestyleLogs: lifestyleLogs.map((l) => ({
        type: l.type,
        timestamp: l.timestamp,
        intensity: l.intensity,
        notes: l.notes,
      })),
      profile: profile ? {
        name: profile.name,
        diabetesType: profile.diabetesType,
        targetLow: profile.targetLow,
        targetHigh: profile.targetHigh,
      } : null,
      painPoints: painPoints.map((pp) => pp.slug),
    });

    const painPointsStr = painPoints.map((pp) => pp.label).join(', ');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: `You are a personal diabetes assistant. The user is asking a question about their own blood sugar and meal data. Answer conversationally, specifically, and with numbers from their data. The user's top concerns are: ${painPointsStr}. Keep it concise (2-5 sentences). Give a direct recommendation if relevant.`,
        messages: [
          {
            role: 'user',
            content: `Here is my health data:\n${serializedData}\n\nMy question: ${question}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const result = await response.json();
    const answer = result.content?.[0]?.text || 'Sorry, I could not generate an answer.';

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Error in AI Q&A:', error);
    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    );
  }
}
