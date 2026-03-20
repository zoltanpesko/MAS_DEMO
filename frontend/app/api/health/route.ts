import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'MAS Vendor Page',
    version: '1.0.0',
    uptime: process.uptime()
  });
}

// Made with Bob
