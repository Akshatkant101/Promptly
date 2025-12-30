"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Card, CardContent} from "./ui/card"
import { authClient } from "@/lib/auth-client"
import { useState } from "react"

export const LoginForm = () => {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    
    return(
        <div  className="flex flex-col gap-6 justify-center items-center ">
      <div className="flex flex-col items-center justify-center space-y-4">
        <Image src={"/login.svg"} alt="Login" height={500} width={500}/>
        <h1 className="text-6xl font-extrabold text-indigo-400">Welcome Back! to Coremind Cli</h1>
        <p className="text-base font-medium text-zinc-400">Login to your account for allowing device flow</p>
      </div>
      <Card className="border-none shadow-none">
        <CardContent>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4 text-white">
              <Button
                variant={"outline"}
                className="w-full cursor-pointer h-14 text-lg px-6 py-6"
                type="button"
                onClick={() => authClient.signIn.social({
                  provider: "github",
                  callbackURL: "http://localhost:3000"
                })}
               
              >
                <Image src={"/github.svg"} alt="Github" height={20} width={20} className="size-5 dark:invert" />
                Continue With GitHub
              </Button>

            </div>

          </div>

        </CardContent>
      </Card>
    </div>
    )
} 