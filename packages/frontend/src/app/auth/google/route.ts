import { NextResponse } from 'next/server';

export function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    return new NextResponse('NEXT_PUBLIC_API_URL is not configured', {
      status: 500,
    });
  }

  return NextResponse.redirect(new URL('/auth/google', apiUrl));
}
