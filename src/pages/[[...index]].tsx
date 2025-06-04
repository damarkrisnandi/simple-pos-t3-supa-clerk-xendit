import { Button } from "@/components/ui/button";
import { SignIn, SignInButton, useUser } from "@clerk/nextjs";
import { Lock } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn && isLoaded) {
      router.replace("/dashboard");
    } else {
      // router.replace("/sign-in");
    }
  }, [isSignedIn, isLoaded]);

  return (
    <div className="flex flex-col gap-2 h-screen w-screen items-center justify-center">
      <h1 className="text-2xl font-bold tracking-tight">Welcome to Simple POS</h1>
      <Button asChild>
        <div>
          <Lock />
          <SignInButton></SignInButton>
        </div>
      </Button>
    </div>
  );
}
