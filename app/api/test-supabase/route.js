import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET() {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let testResult = null;
  let testError = null;

  if (hasUrl && hasKey) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id')
        .limit(1);

      if (error) {
        testError = error.message;
      } else {
        testResult = 'Connection successful';
      }
    } catch (e) {
      testError = e.message;
    }
  }

  return NextResponse.json({
    envVarsSet: {
      NEXT_PUBLIC_SUPABASE_URL: hasUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: hasKey
    },
    supabaseTest: testResult,
    error: testError
  });
}
