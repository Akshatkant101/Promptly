#!/usr/bin/env node
import { cancel, confirm, intro, isCancel } from "@clack/prompts";
import { logger } from "better-auth";
import { createAuthClient } from "better-auth/client";
import { deviceAuthorizationClient } from "better-auth/client/plugins";
import chalk from "chalk";
import { Command } from "commander";
import open from "open";
import os from "os";
import path from "path";
import yoctoSpinner from "yocto-spinner";
import * as z from "zod/v4";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { getStoredToken, isTokenExpired, storeToken } from "../../../../lib/token.js";
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
export const CONFIG_DIR = path.join(os.homedir(), ".better-auth");
export const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");
export async function loginAction(opts) {
    const optionsSchema = z.object({
        serverUrl: z.string().optional(),
        clientId: z.string().optional(),
    });
    const options = optionsSchema.parse(opts);
    const serverUrl = options.serverUrl || URL;
    const clientId = options.clientId || CLIENT_ID;
    if (!clientId) {
        logger.error("Client ID is required. Please set GITHUB_CLIENT_ID environment variable or use --client-id option.");
        process.exit(1);
    }
    intro(chalk.blue("🔐Better Auth CLI Login"));
    //   chnage this with token management utils
    const existingToken = await getStoredToken();
    const expired = await isTokenExpired(existingToken);
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
            const errorMessage = error.error_description ??
                error.error ??
                (error.status
                    ? `Status: ${error.status} ${error.statusText || ""}`
                    : JSON.stringify(error));
            logger.error(`Failed to request device authorization: ${errorMessage}`);
            process.exit(1);
        }
        const { device_code, user_code, verification_uri, verification_uri_complete, interval = 5, expires_in, } = data;
        console.log(chalk.yellowBright("Device authorization required"));
        console.log(`Please visit ${chalk.underline.blue(verification_uri_complete || verification_uri)}`);
        console.log(`Enter Code:${chalk.bold.green(user_code)}`);
        const shouldOpen = await confirm({
            message: "Open browser automatically",
            initialValue: true,
        });
        if (!isCancel(shouldOpen) && shouldOpen) {
            const urlToOpen = verification_uri || verification_uri_complete;
            await open(urlToOpen);
        }
        console.log(chalk.yellowBright(`Waiting for authentication...(expires in ${Math.floor(expires_in / 60)}minutes)...`));
        const token = await pollForToken(authClient, device_code, clientId, interval);
        if (token) {
            const savedtoken = await storeToken(token);
            if (!savedtoken) {
                logger.error("Failed to store token");
            }
            console.log(chalk.green("Token stored successfully"));
            // get ueser data
            // const user = await prisma.user.findFirst({
        }
    }
    catch (error) {
        spinner.stop();
        const errorMessage = error instanceof Error
            ? error.message
            : typeof error === "string"
                ? error
                : JSON.stringify(error);
        logger.error(`Unexpected error during device authorization: ${errorMessage}`);
        process.exit(1);
    }
    async function pollForToken(authClient, device_code, clientId, interval) {
        let pollingInterval = interval;
        const spinner = yoctoSpinner({
            text: "Polling for token...",
            color: "cyan",
        });
        let dots = 0;
        return new Promise((resolve, reject) => {
            const poll = async () => {
                dots = (dots + 1) % 4;
                spinner.text = chalk.gray(`Polling for authorization${"."}.repeat(dots)}${""}.repeat(3-dots)}`);
                if (!spinner.isSpinning)
                    spinner.start();
                try {
                    const { data, error } = await authClient.device.token({
                        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
                        device_code: device_code,
                        client_id: clientId,
                        fetchOptions: {
                            headers: {
                                "user-agent": `My CLI`,
                            },
                        },
                    });
                    if (data?.access_token) {
                        console.log(chalk.green(`Your access token is: ${data.access_token}`));
                        spinner.stop();
                        resolve(data);
                        return;
                    }
                    else if (error) {
                        switch (error.error) {
                            case "authorization_pending":
                                // Continue polling
                                break;
                            case "slow_down":
                                pollingInterval += 5;
                                break;
                            case "access_denied":
                                console.error("Access was denied by the user");
                                return;
                            case "expired_token":
                                console.error("The device code has expired. Please try again.");
                                return;
                            default:
                                spinner.stop();
                                logger.error(`Error: ${error.error_description}`);
                                process.exit(1);
                        }
                    }
                }
                catch (error) {
                    spinner.stop();
                    logger.error(`Unexpected error during device authorization: ${error instanceof Error ? error.message : String(error)}`);
                    process.exit(1);
                }
                setTimeout(poll, pollingInterval * 1000);
            };
            setTimeout(poll, pollingInterval * 1000);
        });
    }
}
// -------------Login Command Setup -------------
export const login = new Command("login")
    .description("Login to the Better Auth CLI")
    .option("--server-url <url>", "The URL of the Better Auth server", URL)
    .option("--client-id <id>", "The Client ID of the Better Auth server", CLIENT_ID)
    .action(loginAction);
