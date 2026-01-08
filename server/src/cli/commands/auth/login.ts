#!/usr/bin/env node
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
import { fileURLToPath } from "url";

// Load .env file - try server directory first, then current working directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, "../../../../");
const envPath = path.join(serverDir, ".env");
dotenv.config({ path: envPath });
// Also try current working directory as fallback
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

  if (!clientId) {
    logger.error(
      "Client ID is required. Please set GITHUB_CLIENT_ID environment variable or use --client-id option."
    );
    process.exit(1);
  }

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
  const authClient = createAuthClient({
    baseURL: serverUrl,
    plugins: [deviceAuthorizationClient()],
  });

  const spinner = yoctoSpinner({ text: "Authorizing device..." });
  spinner.start();

  try {
    const { data, error } = await authClient.device.code({
      client_id: clientId,
      scope: "openid profile email",
    });
    spinner.stop();

    if (error && !data) {
      const errorMessage =
        error.error_description ??
        error.error ??
        (error.status
          ? `Status: ${error.status} ${error.statusText || ""}`
          : JSON.stringify(error));
      logger.error(`Failed to request device authorization: ${errorMessage}`);
      process.exit(1);
    }

    const {
      device_code,
      user_code,
      verification_uri,
      verification_uri_complete,
      interval = 5,
      expires_in,
    } = data;
    console.log(chalk.yellowBright("Device authorization required"));
    console.log(
      `Please visit ${chalk.underline.blue(
        verification_uri || verification_uri_complete
      )}`
    );
    console.log(`Enter Code:${chalk.bold.green(user_code)}`);

    const shouldOpen = await confirm({
      message: "Open browser automatically",
      initialValue: true,
    });

    if (!isCancel(shouldOpen) && shouldOpen) {
      const urlToOpen = verification_uri || verification_uri_complete;
      await open(urlToOpen);
    }

    console.log(
      chalk.yellowBright(
        `Waiting for authentication...(expires in ${Math.floor(
          expires_in / 60
        )}minutes)...`
      )
    );
  } catch (error) {
    spinner.stop();
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : JSON.stringify(error);
    logger.error(`Unexpected error during device authorization: ${errorMessage}`);
    process.exit(1);
  }
}

// -------------Login Command Setup -------------

export const login = new Command("login")
  .description("Login to the Better Auth CLI")
  .option("--server-url <url>", "The URL of the Better Auth server", URL)
  .option(
    "--client-id <id>",
    "The Client ID of the Better Auth server",
    CLIENT_ID
  )
  .action(loginAction);
