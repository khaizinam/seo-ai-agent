import { signIn } from "@/auth"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10 text-foreground">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-6">
          <form
            action={async (formData) => {
              "use server"
              formData.append("redirectTo", "/admin")
              await signIn("credentials", formData)
            }}
          >
            <div className="flex flex-col gap-6 bg-card p-8 rounded-xl border border-border shadow-xl">
              <div className="flex flex-col items-center gap-2">
                <a
                  href="#"
                  className="flex flex-col items-center gap-2 font-medium"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
                   SEO
                  </div>
                  <span className="sr-only">SEO Admin</span>
                </a>
                <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
                <div className="text-center text-sm text-muted-foreground">
                  Sign in to your admin account
                </div>
              </div>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground/80">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@seo.local"
                    required
                    className="flex h-10 w-full rounded-md border border-border bg-muted/30 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="password" dangerouslySetInnerHTML={{__html: 'Password'}} className="text-sm font-medium text-foreground/80" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="flex h-10 w-full rounded-md border border-border bg-muted/30 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                  />
                </div>
                <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2 w-full">
                  Sign In
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

  )
}
