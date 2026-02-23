import chalk from "chalk";
import boxen from "boxen";
import { isCancel, cancel, intro, outro, text } from "@clack/prompts";
import yoctoSpinner from "yocto-spinner";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import { AIService } from "../ai/google-service.js";
import { ChatService } from "../../service/chat.service.js";
import { getStoredToken } from "../../../lib/token.js";
import { prisma } from "../../../lib/prisma.js";

marked.use(
  markedTerminal({
    // Styling options for terminal output
    code: chalk.cyan,
    blockquote: chalk.gray.italic,
    heading: chalk.green.bold,
    firstHeading: chalk.magenta.underline.bold,
    hr: chalk.reset,
    listitem: chalk.reset,
    list: chalk.reset,
    paragraph: chalk.reset,
    strong: chalk.bold,
    em: chalk.italic,
    codespan: chalk.yellow.bgBlack,
    del: chalk.dim.gray.strikethrough,
    link: chalk.blue.underline,
    href: chalk.blue.underline,
  }) as any
);

// Initialize services
const aiService = new AIService();
const chatService = new ChatService();

async function getUserFromToken() {
  const token = await getStoredToken();
  if (!token.access_token) {
    throw new Error("No access token found.Please login to your account.");
  }
  const spinner = yoctoSpinner({ text: "Getting user from token..." });
  const session = await prisma.session.findUnique({
    where: {
      token: token.access_token,
    },
    include: {
      user: true,
    },
  });
  if (!session || !session.user) {
    spinner.error("User not found.Please login to your account.");
    throw new Error("User not found.Please login to your account.");
  }
  spinner.success(`Welcome back, ${session.user.name}!`);
  return session.user;
}

async function initConversation(
  userId: string,
  conversationId: null,
  mode: "chat" | "tool" | "agent"
) {
  const spinner = yoctoSpinner({ text: "Initializing conversation..." }).start();
  let tempConversation = await chatService.getOrCreateConversation(userId, conversationId, mode);
  let conversationIdToFetch: string;
  if (!tempConversation) {
    const newConversation = await chatService.createConversation(userId, mode, null);
    conversationIdToFetch = newConversation.id;
  } else {
    conversationIdToFetch = tempConversation.id;
  }
  // Always fetch the conversation with messages included for consistent typing
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationIdToFetch },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
  if (!conversation) {
    spinner.error("Failed to initialize conversation");
    throw new Error("Failed to initialize conversation");
  }
  spinner.success(`Conversation initialized successfully`);

  //  display conversation info in a box
  const conversationInfo = boxen(
    `${chalk.bold("Conversation")}: ${conversation.title}\n${chalk.gray("ID: " + conversation.id)}\n${chalk.gray("Mode: " + conversation.mode)}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "cyan",
      title: "💬 Chat Session",
      titleAlignment: "center",
    }
  );
  console.log(conversationInfo);

  // Display existing messages if any
  if (conversation.messages?.length > 0) {
    console.log(chalk.yellow("📜 Previous messages:\n"));
    await displayMessages(conversation.messages);
  }

  return conversation;
}

async function displayMessages(messages: Array<{ role: string; content: string }>) {
  for (const msg of messages) {
    if (msg.role === "user") {
      const userBox = boxen(chalk.white(msg.content), {
        padding: 1,
        margin: { left: 2, bottom: 1 },
        borderStyle: "round",
        borderColor: "blue",
        title: "👤 You",
        titleAlignment: "left",
      });
      console.log(userBox);
    } else {
      // Render markdown for assistant messages
      const renderedContent = await marked.parse(msg.content);
      const assistantBox = boxen(renderedContent.trim(), {
        padding: 1,
        margin: { left: 2, bottom: 1 },
        borderStyle: "round",
        borderColor: "green",
        title: "🤖 Assistant",
        titleAlignment: "left",
      });
      console.log(assistantBox);
    }
  }
}

async function saveMessage(
  conversationId: string,
  role: "user" | "assistant" | "system",
  content: string
) {
  return await chatService.addMessage(conversationId, role, content);
}

async function getAIResponse(conversationId: string) {
  const spinner = yoctoSpinner({
    text: "AI is thinking...",
    color: "cyan",
  }).start();

  const dbMessages = await chatService.getMessages(conversationId);
  const aiMessages = chatService.formatMessagesForAI(dbMessages) as Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>;

  let fullResponse = "";
  let isFirstChunk = true;

  try {
    const result = await aiService.sendMessage(aiMessages, (chunk) => {
      // Stop spinner on first chunk and show header
      if (isFirstChunk) {
        spinner.stop();
        console.log("\n");
        const header = chalk.green.bold("🤖 Assistant:");
        console.log(header);
        console.log(chalk.gray("─".repeat(60)));
        isFirstChunk = false;
      }
      fullResponse += chunk;
    });

    // Now render the complete markdown response
    console.log("\n");
    const renderedMarkdown = await marked.parse(fullResponse);
    console.log(renderedMarkdown);
    console.log(chalk.gray("─".repeat(60)));
    console.log("\n");

    return result.content;
  } catch (error) {
    spinner.error("Failed to get AI response");
    throw error;
  }
}

async function updateConversationTitle(
  conversationId: string,
  userInput: string,
  messageCount: number
) {
  if (messageCount === 1) {
    const title = userInput.slice(0, 50) + (userInput.length > 50 ? "..." : "");
    await chatService.updateTitle(conversationId, title);
  }
}


async function chatLoops(conversation: {
  id: string;
  userId: string;
  title: string | null;
  mode: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Array<{ role: string; content: string }>;
}) {
  const helpBox = boxen(
    `${chalk.gray("• Type your message and press Enter")}\n${chalk.gray("• Markdown formatting is supported in responses")}\n${chalk.gray('• Type "exit" to end conversation')}\n${chalk.gray("• Press Ctrl+C to quit anytime")}`,
    {
      padding: 1,
      margin: { bottom: 1 },
      borderStyle: "round",
      borderColor: "gray",
      dimBorder: true,
    }
  );

  console.log(helpBox);

  while (true) {
    const userInput = await text({
      message: chalk.blue("💬 Your message"),
      placeholder: "Type your message...",
      validate(value) {
        if (!value || value.trim().length === 0) {
          return "Message cannot be empty";
        }
      },
    });

    // Handle cancellation (Ctrl+C)
    if (isCancel(userInput)) {
      const exitBox = boxen(chalk.yellow("Chat session ended. Goodbye! 👋"), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
      });
      console.log(exitBox);
      process.exit(0);
    }

    // Handle exit command
    if (userInput.toLowerCase() === "exit") {
      const exitBox = boxen(chalk.yellow("Chat session ended. Goodbye! 👋"), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
      });
      console.log(exitBox);
      break;
    }

    // Save user message
    await saveMessage(conversation.id, "user", userInput);

    // Get messages count before AI response
    const messages = await chatService.getMessages(conversation.id);

    // Get AI response with streaming and markdown rendering
    const aiResponse = await getAIResponse(conversation.id);

    // Save AI response
    await saveMessage(conversation.id, "assistant", aiResponse);

    // Update title if first exchange
    await updateConversationTitle(conversation.id, userInput, messages.length);
  }
}

export async function startChat(mode = "chat", conversationId = null) {
  try {
    // Display intro banner
    intro(
      boxen(chalk.bold.cyan("🚀 Coremind AI Chat"), {
        padding: 1,
        borderStyle: "double",
        borderColor: "cyan",
      })
    );

    const user = await getUserFromToken();
    const conversation = await initConversation(
      user.id,
      conversationId,
      mode as "chat" | "tool" | "agent"
    );
    await chatLoops(conversation);
    outro(chalk.green("Chat completed successfully"));
  } catch (error) {
    const errorBox = boxen(chalk.red("Error starting chat:"), {
      padding: 1,
      borderStyle: "double",
      borderColor: "red",
    });
    console.error(errorBox);
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}
