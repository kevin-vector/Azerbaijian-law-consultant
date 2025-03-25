import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createUser, verifyCredentials } from '../../../lib/supabase';

export async function POST(req: NextRequest) {
  const { action, email, username, password, firstName, lastName } = await req.json();

  try {
    switch (action) {
      case 'login':
        if (!email || !password) {
          return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }
        const user = await verifyCredentials(email, password);
        if (!user) {
          return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }
        return NextResponse.json({ user });

      case 'register':
        if (!email || !password || !username) {
          return NextResponse.json({ error: 'Email, password, and username are required' }, { status: 400 });
        }
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
          return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
        }
        const newUser = await createUser(username, email, password);
        const displayName = `${firstName || ''} ${lastName || ''}`.trim() || username;
        return NextResponse.json({ user: { ...newUser, displayName } });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Auth API error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}