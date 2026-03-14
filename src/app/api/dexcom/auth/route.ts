import { NextResponse } from 'next/server';

const DEXCOM_ENV = process.env.DEXCOM_ENV || 'sandbox';
const DEXCOM_CLIENT_ID = process.env.DEXCOM_CLIENT_ID || '';
const DEXCOM_REDIRECT_URI = process.env.DEXCOM_REDIRECT_URI || 'http://localhost:3000/api/dexcom/callback';

const DEXCOM_BASE_URL =
  DEXCOM_ENV === 'production'
    ? 'https://api.dexcom.com'
    : 'https://sandbox-api.dexcom.com';

export async function GET() {
  try {
    if (!DEXCOM_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Dexcom client ID is not configured' },
        { status: 500 }
      );
    }

    const authUrl = new URL(`${DEXCOM_BASE_URL}/v2/oauth2/login`);
    authUrl.searchParams.set('client_id', DEXCOM_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', DEXCOM_REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'offline_access');

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('Error initiating Dexcom auth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Dexcom authorization' },
      { status: 500 }
    );
  }
}
