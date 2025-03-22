import LoginForm from "@/components/login-form"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Legal Database</h1>
          <p className="text-muted-foreground mt-2">Sign in to access the legal information</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}

