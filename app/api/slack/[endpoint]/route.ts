import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ endpoint: string }> }
) {
  const { endpoint } = await params;
  const body = await request.json();
  const { token, ...slackParams } = body;

  if (!token) {
    return NextResponse.json(
      { ok: false, error: 'Token is required' },
      { status: 400 }
    );
  }

  const formData = new URLSearchParams();
  formData.append('token', token);

  Object.entries(slackParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value.toString());
    }
  });

  try {
    const response = await fetch(`https://slack.com/api/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message || 'Failed to call Slack API'
      },
      { status: 500 }
    );
  }
}