"use client";
import { LoginForm } from "@/components/LoginForm";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const page = () => {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();

  
  if (isPending) {
    return (
      <div
      style={{
        backgroundImage: "url('/Oops!.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      className="flex items-center justify-center h-screen text-white"
      >
        <Spinner className="h-16 w-auto" />
      </div>
    );
  }
  
  if (data?.session && data.user) {
    router.push("/");
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <LoginForm />
    </div>
  );
};

export default page;
