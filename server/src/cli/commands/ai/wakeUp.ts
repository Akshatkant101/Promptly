import chalk from "chalk";
import { Command } from "commander";
import yoctoSpinner from "yocto-spinner";
import { prisma } from "../../../../lib/prisma.js";
import { select } from "@clack/prompts";
import { getStoredToken } from "../../../../lib/token.js";
import { startChat } from "../../chat/chat-with-ai.js";
import { startToolChat } from "../../chat/chat-with-ai-tool.js";
import { startAgentChat } from "../../chat/chat-with-ai-agent.js";

const wakeUpAction = async () => {
  const token = await getStoredToken();
  if (!token?.access_token) {
    console.log(
      chalk.red(
        "Not authenticated. Please run 'coremind auth login --client-id <your-client-id>' to authenticate."
      )
    );
    return;
  }

  // Check if DATABASE_URL is configured
  if (!process.env.DATABASE_URL) {
    console.log(
      chalk.red("Database connection not configured. Please set DATABASE_URL in your .env file.")
    );
    return;
  }

  const spinner = yoctoSpinner({ text: "Wake up the AI..." });
  spinner.start();

  let user;
  try {
    user = await prisma.user.findFirst({
      where: {
        sessions: {
          some: {
            token: token.access_token,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
    });
  } catch (error: any) {
    spinner.stop();
    if (error?.code === "P1001") {
      console.log(
        chalk.red(
          "Cannot connect to database. Please check your DATABASE_URL and ensure the database server is running."
        )
      );
    } else {
      console.log(chalk.red(`Database error: ${error?.message || String(error)}`));
    }
    return;
  }
  spinner.stop();

  if (!user) {
    console.log(chalk.red("User not found"));
    return;
  }
  console.log(chalk.green(`Welcome back, ${user.name}!\n`));

  const choice = await select({
    message: "What would you like to do?",
    options: [
      {
        value: "chat",
        label: "💬 Chat with the AI",
        hint: "Ask questions,get answers,and get help with your code",
      },
      {
        value: "tools",
        label: "🛠️ Use Tools",
        hint: "Access a wide range of AI tools(Google Search,code execution,etc)",
      },
      { value: "agent", label: "🤖 Agent Mode", hint: "Advanced AI agent(coming soon)" },
      { value: "exit", label: "🚪 Exit", hint: "Exit the CLI and go back to your terminal" },
    ],
  });

  switch (choice) {
    case "chat":
      await startChat("chat");
      break;
    case "tools":
      await startToolChat();
      break;
    case "agent":
      await startAgentChat();
      break;
    case "exit":
      console.log(chalk.green("Exiting..."));
      process.exit(0);
  }
};

export const wakeUp = new Command("wakeup").description("Wake up the AI").action(wakeUpAction);
