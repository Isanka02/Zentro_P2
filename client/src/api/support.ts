import { api } from "./axios";

export interface SupportConversation {
  _id: string;
  user: string | { _id: string; name: string; email: string };
  subject: string;
  status: "open" | "closed";
  lastMessageAt: string;
  unreadCountUser: number;
  unreadCountAdmin: number;
  createdAt: string;
}

export interface SupportMessage {
  _id: string;
  conversation: string;
  sender: string | { _id: string; name: string; avatar?: string; role: "customer" | "admin" };
  senderRole: "customer" | "admin";
  content: string;
  isRead: boolean;
  createdAt: string;
}

export const getMyConversations = async (): Promise<SupportConversation[]> => {
  const response = await api.get<{ conversations: SupportConversation[] }>("/support/conversations");
  return response.data.conversations;
};

export const startSupportConversation = async (subject: string, content: string) => {
  const response = await api.post<{ conversation: SupportConversation; message: SupportMessage }>(
    "/support/conversations",
    { subject, content }
  );
  return response.data;
};

export const getSupportMessages = async (conversationId: string): Promise<SupportMessage[]> => {
  const response = await api.get<{ messages: SupportMessage[] }>(`/support/conversations/${conversationId}/messages`);
  return response.data.messages;
};

export const sendSupportMessage = async (conversationId: string, content: string): Promise<SupportMessage> => {
  const response = await api.post<{ message: SupportMessage }>(`/support/conversations/${conversationId}/messages`, { content });
  return response.data.message;
};

export const getAdminConversations = async (status: "open" | "closed" | "all") => {
  const response = await api.get<{ conversations: SupportConversation[] }>("/admin/support/conversations", { params: { status } });
  return response.data.conversations;
};

export const getAdminSupportMessages = async (conversationId: string): Promise<SupportMessage[]> => {
  const response = await api.get<{ messages: SupportMessage[] }>(`/admin/support/conversations/${conversationId}/messages`);
  return response.data.messages;
};

export const sendAdminSupportMessage = async (conversationId: string, content: string): Promise<SupportMessage> => {
  const response = await api.post<{ message: SupportMessage }>(`/admin/support/conversations/${conversationId}/messages`, { content });
  return response.data.message;
};

export const setAdminSupportStatus = async (conversationId: string, status: "open" | "closed"): Promise<SupportConversation> => {
  const response = await api.patch<{ conversation: SupportConversation }>(`/admin/support/conversations/${conversationId}/status`, { status });
  return response.data.conversation;
};
