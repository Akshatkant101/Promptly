#!/usr/bin/env node
import dotenv from "dotenv";
import chalk from "chalk";
import figlet from "figlet";
import { Command } from "commander";
import { login, logout, whoami } from "./commands/auth/login.js";
dotenv.config();
async function main() {
    //display the banner
    console.log(chalk.yellow(figlet.textSync("Coremind CLI", { font: "Standard", horizontalLayout: "default" })));
    console.log(chalk.blue("Welcome to the Coremind CLI"));
    const program = new Command("coremind");
    program.version("1.0.0");
    program.description("A modern developer tool that blends AI assistance directly into your workflow, helping you write, refactor, and understand code faster.");
    program.addCommand(login);
    program.addCommand(logout);
    program.addCommand(whoami);
    program.action(() => {
        program.help();
    });
    program.parse();
}
main().catch((error) => {
    console.error(chalk.red(error));
    process.exit(1);
});
