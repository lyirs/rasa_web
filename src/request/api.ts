/*
 * @Author:
 * @Date: 2023-04-10 10:00:58
 * @LastEditTime: 2023-04-13 14:23:15
 * @Description:
 */
import { backendInstance, rasaInstance } from "./request";

interface Response {
  data: any;
  status: number;
}

interface FetchUserSessionsResponse extends Response {
  data: {
    sessions: string[];
  };
}

interface GetConversationTrackerResponse extends Response {
  data: {
    events: any[];
    slots: any;
  };
}

interface GetNLUModelParseResponse extends Response {
  data: {
    intent_ranking: any;
  };
}

interface GetRasaStatusResponse extends Response {
  data: {
    model_id: string;
    model_file: string;
  };
}

interface GetModelResponse extends Response {
  data: {
    models: string[];
  };
}

// 后端 API
export const fetchUserSessionsApi = (
  userId: string
): Promise<FetchUserSessionsResponse> =>
  backendInstance.get(`/user_sessions/${userId}`);

export const storeConversationApi = (userId: string, sessionId: string) =>
  backendInstance.get(`/new_conversation/${userId}/${sessionId}`);

export const deleteConversationApi = (sessionId: string) =>
  backendInstance.delete(`/delete_conversation/${sessionId}`);

export const deleteSessionsApi = (sessionId: string) =>
  backendInstance.delete(`/delete_session/${sessionId}`);

export const getModelApi = (): Promise<GetModelResponse> =>
  backendInstance.get("/models");

// Rasa API
export const getConversationTrackerApi = (
  sessionId: string
): Promise<GetConversationTrackerResponse> =>
  rasaInstance.get(`/conversations/${sessionId}/tracker`);

export const getNLUModelParseApi = (
  message: string
): Promise<GetNLUModelParseResponse> =>
  rasaInstance.post("/model/parse", { text: message });

export const getWebhookResponseApi = (
  sessionId: string,
  message: string
): any =>
  rasaInstance.post("/webhooks/rest/webhook", {
    sender: sessionId,
    message: message,
  });

export const sendButtonPayloadApi = (sessionId: string, payload: string): any =>
  rasaInstance.post("/webhooks/rest/webhook", {
    sender: sessionId,
    message: payload,
  });

export const resetConversationTrackerApi = (sessionId: string) =>
  rasaInstance.post(`/conversations/${sessionId}/tracker/events`, {
    event: "restart",
  });

export const getRasaStatusApi = (): Promise<GetRasaStatusResponse> =>
  rasaInstance.get("/status");

export const getStoryYamlApi = (sessionId: string) =>
  rasaInstance.get(`/conversations/${sessionId}/story`);

export const changeModelApi = (model_name: string) =>
  rasaInstance.put(
    `/model`,
    {
      model_file: `models/${model_name}`,
    },
    {
      timeout: 60000,
    }
  );
