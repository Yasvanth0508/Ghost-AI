import Image from "next/image";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen w-full bg-[#080809] text-white">
      {/* Left Half: Pure Visual Hero Image (No Wording) */}
      <div className="relative hidden lg:block lg:w-1/2 min-h-screen border-r border-zinc-800/80 bg-black overflow-hidden">
        <Image
          src="/auth-bg.png"
          alt="Ghost AI"
          fill
          priority
          sizes="50vw"
          className="object-cover object-center select-none pointer-events-none"
        />
      </div>

      {/* Right Half: Sign Up Card Container */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12 bg-[#080809]">
        <div className="w-full max-w-md">
          <SignUp />
        </div>
      </div>
    </div>
  );
}
