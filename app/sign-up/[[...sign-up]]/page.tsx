import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-6rem)]">
      <SignUp />
    </div>
  )
}

