import { NextRequest, NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    return new NextResponse('NEXT_PUBLIC_API_URL is not configured', {
      status: 500,
    });
  }

  const redirectUrl = new URL('/auth/google', apiUrl);
  const vipToken = request.nextUrl.searchParams.get('vip');

  if (vipToken) {
    redirectUrl.searchParams.set('vip', vipToken);
  }

  return NextResponse.redirect(redirectUrl);
}
