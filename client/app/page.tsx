"use client"
import { Button } from "@/components/ui/button";

export default function Home() {

  const handlesubmit = () => {
    console.log("Button clicked");
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Button onClick={handlesubmit}>
        Click me
      </Button>
    </div>
  );
}
