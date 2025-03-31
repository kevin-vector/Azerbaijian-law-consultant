import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(req: NextRequest) {
    // console.log("Scrape status request")
    try {
      const { data: law } = await supabase
        .from('Scrape')
        .select('status, created_at')
        .eq('source', 'law')
        .order("id", { ascending: false })

      const { data: post } = await supabase
        .from('Scrape')
        .select('status, created_at')
        .eq('source', 'post')
        .order("id", { ascending: false })

      // console.log('scrape status', law, post)

      return NextResponse.json({
        law: law?.length ? law[0] : {status:"finished", created_at:"abcd"},
        post: post?.length ? post[0] : {status:"finished", created_at:"abcd"},
      });
    } catch (error) {
      console.log('Scraping error:', error);
      return NextResponse.json({ error: 'Failed to scrape data' }, { status: 500 });
    }
  }
  