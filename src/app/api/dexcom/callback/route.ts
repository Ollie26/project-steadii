import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEXCOM_ENV = process.env.DEXCOM_ENV || 'sandbox';
const DEXCOM_CLIENT_ID = process.env.DEXCOM_CLIENT_ID || '';
const DEXCOM_CLIENT_SECRET = process.env.DEXCOM_CLIENT_SECRET || '';
const DEXCOM_REDIRECT_URI = process.env.DEXCOM_REDIRECT_URI || 'http://localhost:3000/api/dexcom/callback';

const DEXCOM_BASE_URL =
  DEXCOM_ENV === 'production'
    ? 'https://api.dexcom.com'
    : 'https://sandbox-api.dexcom.com';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Dexcom auth error:', error);
      return NextResponse.redirect(
        new URL('/you?dexcom=error&message=' + encodeURIComponent(error), request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/you?dexcom=error&message=No+authorization+code+received', request.url)
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(`${DEXCOM_BASE_URL}/v2/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DEXCOM_CLIENT_ID,
        client_secret: DEXCOM_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: DEXCOM_REDIRECT_URI,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error('Dexcom token exchange failed:', errorBody);
      return NextResponse.redirect(
        new URL('/you?dexcom=error&message=Token+exchange+failed', request.url)
      );
    }

    const tokenData = await tokenResponse.json();

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // Store tokens in DexcomConnection
    await prisma.dexcomConnection.upsert({
      where: { id: 'default' },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiry: expiresAt,
        isConnected: true,
      },
      create: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiry: expiresAt,
        isConnected: true,
      },
    });

    return NextResponse.redirect(
      new URL('/you?dexcom=success', request.url)
    );
  } catch (error) {
    console.error('Error handling Dexcom callback:', error);
    return NextResponse.redirect(
      new URL('/you?dexcom=error&message=Unexpected+error', request.url)
    );
  }
}
