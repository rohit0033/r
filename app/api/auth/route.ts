import { NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';
import { hash, compare } from 'bcryptjs';

// Mock user database
const users: { [key: string]: { id: string; password: string } } = {};

export async function POST(request: Request) {
  try {
    const { action, username, password } = await request.json();

    if (!action || !username || !password) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'register') {
      if (users[username]) {
        return NextResponse.json({ message: 'User already exists' }, { status: 400 });
      }
      const hashedPassword = await hash(password, 10);
      users[username] = { id: username, password: hashedPassword };
      console.log(`User registered: ${username}`);
      return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
    }

    if (action === 'login') {
      const user = users[username];
      if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 400 });
      }
      const isValid = await compare(password, user.password);
      if (!isValid) {
        return NextResponse.json({ message: 'Invalid password' }, { status: 400 });
      }
      const token = sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
      console.log(`User logged in: ${username}`);
      return NextResponse.json({ token });
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error handling request:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
