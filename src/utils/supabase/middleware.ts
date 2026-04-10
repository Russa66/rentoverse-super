import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://menazayzyfjimgfcwqnp.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lbmF6YXl6eWZqaW1nZmN3cW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MDYwMjAsImV4cCI6MjA5MDk4MjAyMH0.27UFkc_enyAbVelrMVJwsIhxAWb7FdOk3xonnC16nkY";
export const createClient = (request: NextRequest) => {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    },
  );

  return supabaseResponse
};
