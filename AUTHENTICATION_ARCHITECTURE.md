 # Authentication Architecture

## Overview

This application uses a **middleware-based authentication system** that centralizes authentication logic and eliminates the need for redundant authentication checks on individual pages and API routes.

## Architecture Components

### 1. Middleware (`middleware.ts`)

The middleware is the **single source of truth** for authentication. It:

- Runs on every request before reaching pages or API routes
- Handles session management and cookie updates
- Redirects unauthenticated users to login
- Redirects authenticated users away from auth pages
- Returns 401 for unauthenticated API requests

```typescript
// middleware.ts
export const config = {
  matcher: [
    // Excludes static files, auth routes, and public assets
    "/((?!_next/static|_next/image|favicon.ico|auth|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### 2. Supabase Middleware Utility (`utils/supabase/middleware.ts`)

Enhanced middleware utility that:

- **Manages authentication state** securely
- **Handles redirects** based on authentication status
- **Differentiates between page and API routes** for appropriate responses
- **Prevents authenticated users** from accessing auth pages
- **Supports redirect parameters** for post-login navigation

Key features:
- Public routes: `/auth/login`, `/auth/signup`, `/auth/callback`, etc.
- API route protection with 401 responses
- Automatic redirect to login with `redirectTo` parameter
- Session cookie management

### 3. Server Utility (`utils/supabase/server.ts`)

Provides utilities for server components:

```typescript
// Get authenticated user (assumes middleware verification)
export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  
  return user;
}
```

## Benefits of This Architecture

### ✅ **Centralized Authentication Logic**
- Single place to manage authentication rules
- Consistent behavior across the entire application
- Easier to maintain and update

### ✅ **Performance Optimization**
- No redundant authentication checks on pages
- Faster page loads
- Reduced server-side processing

### ✅ **Security Enhancement**
- Middleware runs before any page logic
- Prevents unauthorized access at the routing level
- Consistent security policies

### ✅ **Developer Experience**
- Pages can assume user is authenticated
- Cleaner, more readable code
- Less boilerplate in components

### ✅ **Error Handling**
- Automatic redirects for unauthenticated users
- Proper HTTP status codes for API routes
- Graceful handling of auth errors

## Implementation Examples

### Server Pages (No Auth Checks Needed)

```typescript
// app/reports/page.tsx
export default async function ReportsPage() {
  // User is guaranteed to be authenticated by middleware
  const user = await getAuthenticatedUser();
  
  // Fetch data using user.id
  const data = await fetchUserData(user.id);
  
  return <ReportsComponent data={data} user={user} />;
}
```

### API Routes (No Auth Checks Needed)

```typescript
// app/api/data/route.ts
export async function GET(request: NextRequest) {
  // User is guaranteed to be authenticated by middleware
  const user = await getAuthenticatedUser();
  
  // Process request with authenticated user
  return NextResponse.json({ data: userData });
}
```

### Client Components (Session Passed from Server)

```typescript
// Server component passes session to client
const session = { user, access_token: "", ... };
return <ClientComponent initialSession={session} />;
```

## Route Protection Matrix

| Route Type | Authentication | Behavior |
|------------|---------------|----------|
| `/auth/*` | Not required | Redirects authenticated users to `/` |
| `/api/auth/*` | Not required | Public API endpoints |
| All other pages | Required | Redirects to `/auth/login?redirectTo=<current-path>` |
| All other APIs | Required | Returns 401 Unauthorized |

## Migration Benefits

### Before (Redundant Checks)
```typescript
// Every page had this boilerplate
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  redirect("/auth/login");
}
```

### After (Clean & Simple)
```typescript
// Pages assume authentication
const user = await getAuthenticatedUser();
```

## Security Considerations

1. **Middleware First**: Authentication is verified before any page logic runs
2. **Session Management**: Proper cookie handling and session updates
3. **Route Isolation**: Public routes are clearly defined and isolated
4. **API Protection**: API routes return proper HTTP status codes
5. **Redirect Safety**: Prevents open redirect vulnerabilities

## Troubleshooting

### Common Issues

1. **Infinite Redirects**: Check middleware matcher patterns
2. **API 401 Errors**: Ensure API routes are not in public routes list
3. **Session Issues**: Verify cookie settings and domain configuration

### Debug Tips

1. Check middleware logs for authentication flow
2. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Test with browser dev tools network tab
4. Ensure cookies are being set correctly

## Best Practices

1. **Trust the Middleware**: Don't add redundant auth checks in pages
2. **Use Utilities**: Leverage `getAuthenticatedUser()` for clean code
3. **Handle Errors**: Implement proper error boundaries for auth failures
4. **Test Thoroughly**: Test both authenticated and unauthenticated flows
5. **Monitor Performance**: Middleware should be lightweight and fast

## Future Enhancements

- Role-based access control (RBAC)
- Rate limiting integration
- Advanced session management
- Multi-factor authentication support
- OAuth provider integration