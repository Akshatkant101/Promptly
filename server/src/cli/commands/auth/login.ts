import { cancel, confirm, intro, outro, isCancel } from "@clack/prompts";
import { logger } from "better-auth";
import { createAuthClient } from "better-auth/client";
import { deviceAuthorizationClient } from "better-auth/client/plugins";
import chalk from "chalk";
import { Command } from "commander";
import fs from "fs/promises";
import open from "open";
import os from "os";
import path from "path";
import yoctoSpinner from "yocto-spinner";
import * as z from "zod/v4";
import dotenv from "dotenv";
import { prisma } from "../../../../lib/prisma.js";

dotenv.config();

const URL = "http://localhost:5000";
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CONFIG_DIR = path.join(os.homedir(), ".better-auth");
const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");

export async function loginAction(opts: Record<string, unknown>) {
  const optionsSchema = z.object({
    serverUrl: z.string().optional(),
    clientId: z.string().optional(),
  });

  const options = optionsSchema.parse(opts);

  const serverUrl = options.serverUrl || URL;
  const clientId = options.clientId || CLIENT_ID;

  intro(chalk.blue("🔐Better Auth CLI Login"));

  //   chnage this with token maaagement utils
  const existingToken = false;
  const expired = false;

  if (existingToken && !expired) {
    const shouldReAuth = await confirm({
      message: "You are already logged in. Do you want to re-authenticate?",
      initialValue: false,
    });

    if (isCancel(shouldReAuth) || !shouldReAuth) {
      cancel(chalk.red("Login cancelled"));
      process.exit(0);
    }
  }
}


// -------------Login Command Setup -------------


export const login = new Command("login")
.description("Login to the Better Auth CLI")
.option("--server-url <url>", "The URL of the Better Auth server",URL)
.option("--client-id <id>", "The Client ID of the Better Auth server",CLIENT_ID)
.action(loginAction);