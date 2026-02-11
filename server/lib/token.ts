import chalk from "chalk";
import { CONFIG_DIR, TOKEN_FILE } from "../src/cli/commands/auth/login.js";
import fs from "fs/promises";

export async function getStoredToken() {
    try {
        const data = await fs.readFile(TOKEN_FILE, "utf-8");
        const token = JSON.parse(data);
        return token;
    } catch (error) {
        return null;
    }
}

export async function storeToken(token: {
    access_token?: string;
    refresh_token?: string;
    token_type?: string;
    scope?: string;
    expires_in?: number;
}) {
    try {
        await fs.mkdir(CONFIG_DIR,{recursive: true});

        const tokenData={
            access_token: token.access_token,
            refresh_token: token.refresh_token,
            token_type: token.token_type || "Bearer",
            scope: token.scope || "",
            expires_at: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null,
            created_at: new Date().toISOString(),
        };

        await fs.writeFile(TOKEN_FILE, JSON.stringify(tokenData, null, 2),"utf-8");
        return true;
    } catch (error) {
        console.error(chalk.red("Failed to store token:", error instanceof Error ? error.message : String(error)));
        return false;
    }
}

export async function clearStoredToken() {
    try {
        await fs.unlink(TOKEN_FILE);
        return true;
    } catch (error) {
        console.error(chalk.red("Failed to clear token:", error instanceof Error ? error.message : String(error)));
        return false;
    }
}


export async function isTokenExpired(token: {
    expires_at?: string;
}) {
    const storedToken = await getStoredToken();
    if (!storedToken?.expires_at) return true;
    const expiresAt = new Date(storedToken.expires_at);
    const now = new Date();
    return expiresAt.getTime() - now.getTime() < 5*60*1000;
}

export async function requiredAuth() {
    const token= await getStoredToken();

    if(!token){
        console.log(
            chalk.red("Not authenticated. Please run 'coremind auth login --client-id <your-client-id>' to authenticate.")
        );
        process.exit(1);
    }
    if (await isTokenExpired(token)){
        console.log(
            chalk.red("Token expired. Please run 'coremind auth login --client-id <your-client-id>' to authenticate.")
        );
        process.exit(1);
    }
    return token;
}