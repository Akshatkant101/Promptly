import { prisma } from "../../lib/prisma.js";

export class ChatService {
  /**
   * Create a new conversation
   * @param {string} userId-User ID
   * @param {string} mode-chat,tool or agent
   * @param {string} title-Optional conversation title
   */

  async createConversation(userId: string, mode: "chat" | "tool" | "agent", title: null) {
    return prisma.conversation.create({
      data: {
        userId,
        mode,
        title: title || `New ${mode} conversation`,
      },
    });
  }

  /**
   * Get a  create a conversation for user
   * @param {string} userId -User ID
   * @param {string} conversationId -Optional Conversation ID
   * @param {string} mode -chat,tool or agent
   */

  async getOrCreateConversation(
    userId: string,
    conversationId: null,
    mode: "chat" | "tool" | "agent"
  ) {
    if (conversationId) {
      const conversation = await prisma.conversation.findUnique({
        where: {
          id: conversationId,
          userId,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });
      if (conversation) {
        return conversation;
      }
      return await this.createConversation(userId, mode, null);
    }
  }

  /**
   * Add a new message to a conversation
   * @param {string} conversationId -Conversation ID
   * @param {string} role -user or assistant
   * @param {string} content -Message content
   */

  async addMessage(conversationId: string, role: "user" | "assistant" | "system", content: string) {
    //convert content to Json string if it's an object
    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    return await prisma.message.create({
      data: {
        conversationId,
        role,
        content: contentStr,
      },
    });
  }

  /**
   * Get conversation messages
   * @param {string} conversationId -Conversation ID
   */

  async getMessages(conversationId: string) {
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    return messages.map((message) => ({
      ...message,
      content: this.parseContent(message.content),
    }));
  }

  /**
   * Helper to parse content
   */
  private parseContent(content: string): string | object {
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  }

  /**
   * Get all conversations for a user
   * @param {string} userId -User ID
   */

  async getUserConversations(userId: string) {
    return await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  /**
   * Delete a conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID (for security)
   */
  async deleteConversation(conversationId: string, userId: string) {
    return await prisma.conversation.deleteMany({
      where: {
        id: conversationId,
        userId,
      },
    });
  }

  /**
   * Update conversation title
   * @param {string} conversationId - Conversation ID
   * @param {string} title - New title
   */
  async updateTitle(conversationId: string, title: string) {
    return await prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }

  /**
   * Format messages for AI SDK
   * @param {Array} messages - Database messages
   */
  formatMessagesForAI(messages: Array<{ role: string; content: string | object }>) {
    return messages.map((msg) => ({
      role: msg.role,
      content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
    }));
  }
}
