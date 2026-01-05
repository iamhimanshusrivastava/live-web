---
trigger: always_on
---

# Live-Web - Cursor AI Rules

## Stack
- **Runtime**: Bun | **Frontend**: Vite + React 18 + TypeScript
- **UI**: shadcn/ui (Mira Compact, Zinc/Indigo, Dark mode) + Radix + Tailwind
- **Backend**: Supabase (PostgreSQL + Realtime + Auth)
- **Video**: HLS via hls.js | **Icons**: Lucide | **Font**: Inter

## Code Conventions

### TypeScript
- Explicit types for params/returns | `interface` for objects, `type` for unions
- Never `any`, use `unknown` + type guards | Strict mode enabled

### React
- Functional components only (except ErrorBoundary)
- Props: `ComponentNameProps` interface | Hooks: `use` prefix
- Export default at end | Component order: imports → types → component

### File Structure
```
src/
├── components/ui/    # shadcn (auto-gen)
├── contexts/         # AuthContext
├── hooks/            # useSession, etc.
├── lib/              # supabase.ts, types
├── pages/            # Route components
└── App.tsx
```

### Naming
- Components: PascalCase | Hooks: camelCase with `use`
- Functions: camelCase | Constants: UPPER_SNAKE_CASE
- DB tables: snake_case | Files: match content type

## Bun Commands
```bash
bun install          # Install deps
bun run dev          # Dev server
bun run build        # Production build
bun add <pkg>        # Add dependency
bun add -d <pkg>     # Add dev dependency
```

## Supabase Patterns

### Queries (Always handle errors)
```typescript
const { data, error } = await supabase
  .from('messages')
  .select('*')
  .eq('session_id', sessionId)
if (error) throw error
```

### Realtime (Always cleanup)
```typescript
useEffect(() => {
  const channel = supabase
    .channel(`session:${sessionId}`)
    .on('postgres_changes', { event: 'INSERT', ... })
    .subscribe()
  return () => channel.unsubscribe()
}, [sessionId])
```

### RLS Rules
- Every table has RLS enabled | Use `auth.uid()` for user checks
- Test with different roles | Policies: specific & minimal

## Component Structure
```typescript
// 1. Imports (React → external → internal → types)
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

// 2. Types
interface Props { id: string }

// 3. Component
export default function Component({ id }: Props) {
  // Hooks: router → context → state → refs → custom
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  
  // Effects
  useEffect(() => {}, [])
  
  // Handlers
  function handleClick() {}
  
  // Early returns
  if (loading) return <Spinner />
  
  // JSX
  return <div>...</div>
}
```

## Styling (Mira Compact Style)

### Tailwind
- Group: layout → spacing → typography → colors → effects
- Use CSS variables: `bg-background`, `text-foreground`
- Theme color: `indigo` for primary actions
- Dark mode: `dark:` prefix (system-based)

```typescript
// ✅ Good
<div className="flex items-center justify-between p-4 border-b bg-card">
  <h2 className="text-lg font-semibold text-foreground">Title</h2>
</div>

// ❌ Bad
<div className="text-lg p-4 flex border-b">
  <h2 style={{color: '#333'}}>Title</h2>
</div>
```

### shadcn Components
- Variants: `default | destructive | outline | secondary | ghost | link`
- Sizes: `default | sm | lg | icon`
- Mira = compact spacing, subtle accents
- Don't override unless necessary

### Icons & Typography
```typescript
import { Eye, Users } from 'lucide-react'
<Eye className="h-4 w-4 text-muted-foreground" />
```
- Inter font (auto-loaded) | Sizes: `text-sm/base/lg/xl/2xl`
- Weights: `font-medium` (UI), `font-semibold` (headings)

## Error Handling

### API Calls
```typescript
try {
  const { data, error } = await supabase.from('messages').insert({ content })
  if (error) throw error
  toast({ title: 'Success' })
} catch (error) {
  console.error('Failed:', error)
  toast({ 
    title: 'Error',
    description: error instanceof Error ? error.message : 'Unknown',
    variant: 'destructive'
  })
}
```

### Realtime
```typescript
.subscribe((status) => {
  if (status === 'SUBSCRIBED') console.log('Connected')
  if (status === 'CLOSED') setConnectionStatus('disconnected')
})
```

## Performance

### Memoization
```typescript
// ✅ Memoize expensive calculations
const sorted = useMemo(() => 
  messages.sort((a, b) => a.created_at - b.created_at), 
  [messages]
)

// ✅ Memoize callbacks
const handleClick = useCallback(() => send(content), [content, send])

// ❌ Don't over-optimize
const name = useMemo(() => user?.name, [user]) // Just use user?.name
```

### Lists
```typescript
// ✅ Stable keys
{messages.map(msg => <Message key={msg.id} {...msg} />)}

// ❌ Index keys
{messages.map((msg, i) => <Message key={i} {...msg} />)}
```

## Security

### Auth & Validation
- Never expose `service_role` key | Use `anon` key client-side
- Validate inputs before DB operations:
```typescript
function sendMessage(content: string) {
  if (!content.trim()) throw new Error('Empty message')
  if (content.length > 500) throw new Error('Too long')
  return supabase.from('messages').insert({ 
    content: content.trim().slice(0, 500) 
  })
}
```

## Common Patterns

### Loading States
```typescript
const [dataLoading, setDataLoading] = useState(true)
const [submitLoading, setSubmitLoading] = useState(false)

if (dataLoading) return <Spinner />

return (
  <Button disabled={submitLoading}>
    {submitLoading ? 'Sending...' : 'Send'}
  </Button>
)
```

### Forms
```typescript
const [email, setEmail] = useState('')
const [error, setError] = useState('')

function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  if (!email.includes('@')) {
    setError('Invalid email')
    return
  }
  // Submit...
}

return (
  <form onSubmit={handleSubmit}>
    <Input value={email} onChange={(e) => setEmail(e.target.value)} />
    {error && <p className="text-destructive">{error}</p>}
  </form>
)
```

### Custom Hooks
```typescript
export function useSession(sessionId: string) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => { loadSession() }, [sessionId])
  
  async function loadSession() { /* ... */ }
  
  return { session, loading, loadSession }
}
```

## Anti-Patterns (Never Do This)

```typescript
// ❌ Nested ternaries
{loading ? <Spinner /> : error ? <Error /> : <Content />}

// ❌ Magic numbers
if (messages.length > 100) // Use const MAX_MESSAGES = 100

// ❌ useEffect for derived state
useEffect(() => setFullName(first + last), [first, last])
// Use: const fullName = `${first} ${last}`

// ❌ Mutating state
messages.push(newMessage); setMessages(messages)
// Use: setMessages([...messages, newMessage])

// ❌ Inline objects in props (causes re-renders)
<Component data={{ id: 1 }} onClick={() => fn()} />

// ❌ localStorage/sessionStorage
localStorage.setItem('token', token) // Use Supabase Auth

// ❌ Multiple channels for same data
channel1.subscribe(); channel2.subscribe()
// Use: One channel with multiple .on() listeners
```

## Database (SQL)

### Migrations
- One file per change: `001_core_tables.sql`
- Always add comments | Test locally first

### Functions
```sql
-- ✅ Clear with comments
CREATE OR REPLACE FUNCTION get_current_viewers(p_session_id UUID)
RETURNS INT AS $$
  -- Returns active viewer count
  SELECT COUNT(*)::INT FROM viewer_sessions
  WHERE session_id = p_session_id AND left_at IS NULL;
$$ LANGUAGE SQL STABLE;
```

## Git Commits
```
type(scope): brief description

Types: feat|fix|refactor|style|docs|test|chore

Examples:
feat(auth): add email verification
fix(chat): prevent duplicate messages on reconnect
refactor(session): extract message list component
```

## Testing Checklist
- [ ] Auth/unauth users | [ ] Missing data | [ ] Mobile (375px)
- [ ] Light/dark mode | [ ] Slow network | [ ] Console errors
- [ ] Multi-window real-time | [ ] Network reconnection

## Environment & Deployment

### Build
```bash
bun run tsc --noEmit  # Type check
bun run build         # Build
bun run preview       # Test locally
```

### Pre-Deploy
- [ ] All TS errors fixed | [ ] No console.log (except logging)
- [ ] Env vars in Vercel | [ ] Supabase redirect URLs updated
- [ ] RLS tested | [ ] Mobile + dark mode verified

## AI Prompts

### ✅ Good
- "Add error handling to sendMessage in useSession.ts"
- "Create Loading component with Mira compact style"
- "Update RLS for instructors to delete any message"

### ❌ Bad
- "Fix the code" (too vague)
- "Make it better" (no goal)
- "Add everything for chat" (too broad)

## Key Principles
- **Functionality > Cleverness**: Readable beats clever
- **Shipping > Performance**: Optimize after it works
- **Type Safety**: Fight TypeScript = probably wrong
- **Security First**: RLS before features
- **Real-time = Feature**: App works if WebSocket fails
- **Dark Mode First**: Design for system preference
- **Compact & Clean**: Mira emphasizes efficiency

**References**: Supabase docs | shadcn/ui docs | React docs | Bun docs

**Remember**: Code is read more than written. Write for humans first.