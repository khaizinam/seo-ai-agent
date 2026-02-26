import { auth } from "@/auth.edge"
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnAdminPanel = req.nextUrl.pathname.startsWith('/admin');
  
  if (isOnAdminPanel) {
    if (isLoggedIn) return NextResponse.next();
    return Response.redirect(new URL('/login', req.nextUrl));
  }
  
  return NextResponse.next();
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
