/*
 * @Author:
 * @Date: 2023-04-10 10:00:58
 * @LastEditTime: 2023-04-10 10:33:27
 * @Description:
 */
import { backendInstance, rasaInstance } from "./request";

interface FetchUserSessionsResponse {
  sessions: string[];
}

interface GetConversationTrackerResponse {
  events: any[];
  slots: any;
}

// 后端 API
export const fetchUserSessions = (
  userId: string
): Promise<FetchUserSessionsResponse> =>
  backendInstance.get(`/user_sessions/${userId}`);

export const storeConversation = (userId: string, sessionId: string) =>
  backendInstance.get(`/new_conversation/${userId}/${sessionId}`);

export const deleteConversation = (sessionId: string) =>
  backendInstance.delete(`/delete_conversation/${sessionId}`);

export const deleteSessions = (sessionId: string) =>
  backendInstance.delete(`/delete_session/${sessionId}`);

// Rasa API
export const getConversationTracker = (
  sessionId: string
): Promise<GetConversationTrackerResponse> =>
  rasaInstance.get(`/conversations/${sessionId}/tracker`);

export const getNLUModelParse = (message: string) =>
  rasaInstance.post("/model/parse", { text: message });

export const getWebhookResponse = (sessionId: string, message: string) =>
  rasaInstance.post("/webhooks/rest/webhook", {
    sender: sessionId,
    message: message,
  });

export const resetConversationTracker = (sessionId: string) =>
  rasaInstance.post(`/conversations/${sessionId}/tracker/events`, {
    event: "restart",
  });
