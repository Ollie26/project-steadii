import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const AI_ENABLED = process.env.AI_ENABLED === 'true';

export async function POST() {
  try {
    if (!AI_ENABLED) {
      return NextResponse.json({ aiEnabled: false });
    }

    const [meals, readings, lifestyleLogs, profile, painPoints] = await Promise.all([
      prisma.meal.findMany({
        include: { items: true },
        orderBy: { timestamp: 'desc' },
        take: 50,
      }),
      prisma.glucoseReading.findMany({
        orderBy: { timestamp: 'desc' },
        take: 500,
      }),
      prisma.lifestyleLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 50,
      }),
      prisma.userProfile.findUnique({ where: { id: 'default' } }),
      prisma.painPoint.findMany({
        where: { isActive: true },
        orderBy: { priority: 'asc' },
      }),
    ]);

    const serializedData = JSON.stringify({
      meals: meals.map((m) => ({
        name: m.name,
        mealType: m.mealType,
        timestamp: m.timestamp,
        carbsGrams: m.carbsGrams,
        calories: m.calories,
        proteinGrams: m.proteinGrams,
        fatGrams: m.fatGrams,
        fiberGrams: m.fiberGrams,
        tirScore: m.tirScore,
        tirColor: m.tirColor,
        items: m.items.map((i) => ({
          name: i.name,
          carbsGrams: i.carbsGrams,
          calories: i.calories,
        })),
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
        diabetesType: profile.diabetesType,
        targetLow: profile.targetLow,
        targetHigh: profile.targetHigh,
      } : null,
      painPoints: painPoints.map((pp) => ({
        slug: pp.slug,
        label: pp.label,
        description: pp.description,
      })),
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: `You are a blood sugar management insight generator. Analyze the user's data and generate 5-8 actionable insights as a JSON array. Each insight: { "title": "Short headline", "body": "2-3 sentences with specific numbers", "category": "food|time_of_day|stress|exercise|sleep|general|warning", "actionable": "Specific recommendation", "confidence": "low|medium|high", "dataPoints": number }. Focus on the user's pain points. Return ONLY the JSON array.`,
        messages: [
          {
            role: 'user',
            content: `Analyze this health data and generate insights:\n${serializedData}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const result = await response.json();
    const aiText = result.content?.[0]?.text || '[]';

    let parsedInsights;
    try {
      parsedInsights = JSON.parse(aiText);
    } catch {
      const jsonMatch = aiText.match(/\[[\s\S]*\]/);
      parsedInsights = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }

    // Mark old insights as inactive
    await prisma.insight.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Store new insights
    const createdInsights = await Promise.all(
      parsedInsights.map((insight: Record<string, unknown>) =>
        prisma.insight.create({
          data: {
            title: (insight.title as string) || 'Insight',
            body: (insight.body as string) || '',
            category: (insight.category as string) || 'general',
            actionable: (insight.actionable as string) || null,
            dataPoints: (insight.dataPoints as number) || 0,
            confidence: (insight.confidence as string) || 'medium',
            source: 'ai',
            isActive: true,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      insights: createdInsights,
    });
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI insights' },
      { status: 500 }
    );
  }
}
