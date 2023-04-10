/*
 * @Author:
 * @Date: 2023-04-10 10:00:58
 * @LastEditTime: 2023-04-10 15:13:29
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

interface GetNLUModelParseResponse {
  intent_ranking: any;
}

interface GetRasaStatusResponse {
  model_id: string;
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

export const getNLUModelParse = (
  message: string
): Promise<GetNLUModelParseResponse> =>
  rasaInstance.post("/model/parse", { text: message });

export const getWebhookResponse = (sessionId: string, message: string): any =>
  rasaInstance.post("/webhooks/rest/webhook", {
    sender: sessionId,
    message: message,
  });

export const resetConversationTracker = (sessionId: string) =>
  rasaInstance.post(`/conversations/${sessionId}/tracker/events`, {
    event: "restart",
  });

export const getRasaStatus = (): Promise<GetRasaStatusResponse> =>
  rasaInstance.get("/status");
