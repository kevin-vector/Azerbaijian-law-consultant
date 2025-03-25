import { NextRequest, NextResponse } from 'next/server';
import { manualInput } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    const { title, content } = await req.json();
    if (!title || !content) {
        return NextResponse.json({ error: 'title and content invalid' }, { status: 400 });
    }
    const res = await manualInput(title, content);
    return res ? NextResponse.json({ res }) : NextResponse.json({ error: 'Error creating manual input' }, { status: 500 });
}