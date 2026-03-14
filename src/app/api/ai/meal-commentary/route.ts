import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const AI_ENABLED = process.env.AI_ENABLED === 'true';

const MEAL_COMMENTARY_PROMPT = `You are a blood sugar management assistant for the Steadii app.
Given a meal and its blood glucose impact data, provide a brief, friendly commentary explaining:
1. How the meal affected blood sugar levels
2. What specific foods likely contributed to the response
3. One actionable suggestion for improvement (if applicable)
Keep the commentary concise (2-4 sentences). Be supportive and non-judgmental.
Always remind users to consult their healthcare provider for medical advice.`;

export async function POST(request: Request) {
  try {
    if (!AI_ENABLED) {
      return NextResponse.json({ aiEnabled: false });
    }

    const body = await request.json();
    const { mealId } = body;

    if (!mealId) {
      return NextResponse.json(
        { error: 'mealId is required' },
        { status: 400 }
      );
    }

    // Fetch meal with items
    const meal = await prisma.meal.findUnique({
      where: { id: mealId },
      include: { items: true },
    });

    if (!meal) {
      return NextResponse.json(
        { error: 'Meal not found' },
        { status: 404 }
      );
    }

    // Fetch same-day context
    const mealDate = new Date(meal.timestamp);
    const dayStart = new Date(mealDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(mealDate);
    dayEnd.setHours(23, 59, 59, 999);

    const [lifestyleLogs, readings] = await Promise.all([
      prisma.lifestyleLog.findMany({
        where: {
          timestamp: { gte: dayStart, lte: dayEnd },
        },
        orderBy: { timestamp: 'asc' },
      }),
      prisma.glucoseReading.findMany({
        where: {
          timestamp: {
            gte: new Date(mealDate.getTime() - 2 * 60 * 60 * 1000),
            lte: new Date(mealDate.getTime() + 4 * 60 * 60 * 1000),
          },
        },
        orderBy: { timestamp: 'asc' },
      }),
    ]);

    const contextData = JSON.stringify({
      meal: {
        name: meal.name,
        mealType: meal.mealType,
        timestamp: meal.timestamp,
        carbsGrams: meal.carbsGrams,
        calories: meal.calories,
        proteinGrams: meal.proteinGrams,
        fatGrams: meal.fatGrams,
        fiberGrams: meal.fiberGrams,
        tirScore: meal.tirScore,
        tirColor: meal.tirColor,
        bgImpactJson: meal.bgImpactJson,
        items: meal.items.map((i) => ({
          name: i.name,
          carbsGrams: i.carbsGrams,
          calories: i.calories,
          proteinGrams: i.proteinGrams,
          fatGrams: i.fatGrams,
          fiberGrams: i.fiberGrams,
          servingSize: i.servingSize,
        })),
      },
      sameDayLifestyle: lifestyleLogs.map((l) => ({
        type: l.type,
        timestamp: l.timestamp,
        intensity: l.intensity,
        notes: l.notes,
      })),
      glucoseReadings: readings.map((r) => ({
        value: r.value,
        timestamp: r.timestamp,
        trend: r.trend,
      })),
    });

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        system: MEAL_COMMENTARY_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Please provide commentary on this meal and its blood sugar impact:\n${contextData}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const result = await response.json();
    const commentary =
      result.content?.[0]?.text || 'Unable to generate commentary for this meal.';

    return NextResponse.json({ commentary });
  } catch (error) {
    console.error('Error generating meal commentary:', error);
    return NextResponse.json(
      { error: 'Failed to generate meal commentary' },
      { status: 500 }
    );
  }
}
