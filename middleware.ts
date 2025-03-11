import { createClient } from '@supabase/supabase-js'
import type { Database } from './lib/supabase/types'

export async function middleware(request: Request) {
  const supabase = createClient<Database>(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Get the pathname from the URL
  const url = new URL(request.url)
  const pathname = url.pathname

  // Protect all routes except auth and public routes
  if (!session && !pathname.startsWith('/auth')) {
    return Response.redirect(new URL('/auth/login', request.url))
  }

  return new Response(null, {
    status: 200,
    headers: new Headers(request.headers)
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
