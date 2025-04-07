import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-6rem)]">
      <SignIn />
    </div>
  )
}

