import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useReducer,
} from "react";
import { Input, Button } from "antd";
import "./Chat.css";
import type { InputRef } from "antd";
import ConfidenceRanking from "./Components/ConfidenceRanking";
import SlotDisplay from "./Components/SlotDisplay";
import SessionManagement from "./Components/SessionManagement";
import MessageContainer from "./Components/MessageContainer";
import StoryContainer from "./Components/StoryContainer";
import {
  deleteConversationApi,
  fetchUserSessionsApi,
  getConversationTrackerApi,
  getNLUModelParseApi,
  getWebhookResponseApi,
  resetConversationTrackerApi,
  storeConversationApi,
  deleteSessionsApi,
  sendButtonPayloadApi,
  getStoryYamlApi,
  getModelApi,
  changeModelApi,
} from "./request/api";
import { reducer, initialState } from "./router/reducer";
import { generateSessionId, generateUserId } from "./utils/generate";

export interface Message {
  text?: string;
  isUser: boolean;
  image?: string;
  buttons?: { title: string; payload: string }[];
}

const Chat: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const inputRef = useRef<InputRef>(null);
  const [topIntents, setTopIntents] = useState<any[]>([]);
  const [storyYaml, setStoryYaml] = useState("");
  const [userId, setUserId] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [filledSlots, setFilledSlots] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      fetchSessions(storedUserId);
    } else {
      const newUserId = generateUserId();
      setUserId(newUserId);
      localStorage.setItem("userId", newUserId);
      fetchSessions(newUserId);
    }
    fetchModels();
    fetchPreviousMessages(storedUserId || userId);

    if (Object.keys(state.sessions).length > 0) {
      dispatch({
        type: "SET_CURRENT_SESSION",
        payload: Object.keys(state.sessions)[0],
      });
      dispatch({
        type: "SET_MESSAGES",
        payload: state.sessions[Object.keys(state.sessions)[0]],
      });
    }
  }, []);

  const fetchModels = async () => {
    try {
      const models = await getModelApi();
      const modelList = models.models;
      console.log(modelList);
      dispatch({ type: "SET_MODELS", payload: modelList });
      if (modelList.length > 0) {
        dispatch({ type: "SET_ACTIVE_MODEL", payload: modelList[0] });
      }
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  };

  const fetchSessions = async (userId: string) => {
    try {
      const session = await fetchUserSessionsApi(userId);
      const sessionIds = session.sessions;

      const newSessions: { [key: string]: Message[] } = {};
      sessionIds.forEach((sessionId: string) => {
        newSessions[sessionId] = [];
      });
      dispatch({ type: "SET_SESSIONS", payload: newSessions });

      // 设置当前会话ID
      if (sessionIds.length > 0) {
        dispatch({ type: "SET_CURRENT_SESSION", payload: sessionIds[0] });
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const fetchPreviousMessages = async (recoveredUserId: string) => {
    try {
      const session = await fetchUserSessionsApi(recoveredUserId);

      const sessionId = session.sessions[0];

      const response = await getConversationTrackerApi(sessionId);

      const events = response.events;
      // console.log("fetchPreviousMessages");
      // console.log(events);
      const previousMessages: Message[] = events
        .filter((event: any) => event.event === "user" || event.event === "bot")
        .map((event: any) => ({
          text: event.text,
          isUser: event.event === "user",
          image: event.data?.image,
        }));

      dispatch({ type: "SET_MESSAGES", payload: previousMessages });

      // 设置 stories.yml
      const newStoryYaml = await generateStoryYaml(response, sessionId);

      setStoryYaml(newStoryYaml);
    } catch (error) {
      console.error("Error fetching previous messages:", error);
    }
  };

  const generateStoryYaml = async (trackerState: any, sessionId: string) => {
    const story = await getStoryYamlApi(sessionId);
    return story;
  };

  const update = async (message: string, sessionId: string) => {
    // 请求对话响应
    const response = await getWebhookResponseApi(sessionId, message);
    // 请求意图和置信度信息
    const nluResponse = await getNLUModelParseApi(message);

    // 获取对话跟踪器状态

    const trackerResponse = await getConversationTrackerApi(sessionId);
    const trackerState = trackerResponse;
    const slots = trackerState.slots;
    setFilledSlots(slots);
    // 存储对话session
    const storeSession = await storeConversationApi(userId, sessionId);

    // 设置stories.yml
    const newStoryYaml = await generateStoryYaml(trackerState, sessionId);
    setStoryYaml(newStoryYaml);

    setTopIntents(
      nluResponse.intent_ranking.slice(0, 10).map((intent: any) => ({
        name: intent.name,
        confidence: intent.confidence.toFixed(2),
      }))
    );

    // console.log("update");
    // console.log(response);

    if (response && response.length > 0) {
      response.forEach((res: any) => {
        const botMessage = res.text;
        const botImage = res.image;
        const botButtons = res.buttons;
        let newMessage: Message;

        if (botMessage || botImage || botButtons) {
          newMessage = {
            text: botMessage || "",
            image: botImage,
            buttons: botButtons,
            isUser: false,
          };
        } else {
          return;
        }

        dispatch({
          type: "ADD_MESSAGE",
          payload: newMessage,
        });

        const newSessions = {
          ...state.sessions,
          [sessionId]: [...(state.sessions[sessionId] || []), newMessage],
        };
        dispatch({ type: "SET_SESSIONS", payload: newSessions });
      });
    }
  };

  const sendMessage = useCallback(async () => {
    if (inputRef.current) {
      const message = inputRef.current.input?.value + "";

      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          text: message,
          isUser: true,
        },
      });

      setInputValue("");

      let sessionId = state.currentSessionId;

      if (!state.currentSessionId) {
        sessionId = generateSessionId();
        dispatch({ type: "SET_CURRENT_SESSION", payload: sessionId });
      }

      await update(message, sessionId);
    }
  }, [state.currentSessionId, state.sessions, userId]);

  const resetConversation = async () => {
    try {
      await resetConversationTrackerApi(state.currentSessionId);
      dispatch({ type: "CLEAR_MESSAGES" });
    } catch (error) {
      console.error("Error resetting conversation:", error);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  const handleSessionChange = async (selectedSession: string) => {
    dispatch({ type: "SET_CURRENT_SESSION", payload: selectedSession });

    // 从数据库获取之前的消息
    const response = await getConversationTrackerApi(selectedSession);

    const events = response.events;
    const previousMessages: Message[] = events
      .filter((event: any) => event.event === "user" || event.event === "bot")
      .map((event: any) => ({
        text: event.text,
        isUser: event.event === "user",
      }));

    dispatch({ type: "SET_MESSAGES", payload: previousMessages });

    // 获取对话跟踪器状态
    const trackerState = response;

    // 设置 stories.yml
    const newStoryYaml = await generateStoryYaml(trackerState, selectedSession);
    setStoryYaml(newStoryYaml);
  };

  const createNewSession = async () => {
    const newSessionId = generateSessionId();

    const response = await getConversationTrackerApi(newSessionId);

    dispatch({ type: "SET_CURRENT_SESSION", payload: newSessionId });
    const newSessions = { ...state.sessions, [newSessionId]: [] };
    dispatch({ type: "SET_SESSIONS", payload: newSessions });
    dispatch({ type: "CLEAR_MESSAGES" });
  };

  const deleteSession = async () => {
    try {
      await deleteConversationApi(state.currentSessionId);
      await deleteSessionsApi(state.currentSessionId);

      const updatedSessions = { ...state.sessions };
      delete updatedSessions[state.currentSessionId];
      dispatch({ type: "SET_SESSIONS", payload: updatedSessions });
      dispatch({ type: "SET_CURRENT_SESSION", payload: "" });
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const handleButtonClick = async (payload: any) => {
    const response = await sendButtonPayloadApi(
      state.currentSessionId,
      payload
    );

    response.forEach((res: any) => {
      const botMessage = res.text;
      const botImage = res.image;
      const botButtons = res.buttons;
      let newMessage: Message;

      if (botMessage || botImage || botButtons) {
        newMessage = {
          text: botMessage || "",
          image: botImage,
          buttons: botButtons,
          isUser: false,
        };
      } else {
        return;
      }
      dispatch({
        type: "ADD_MESSAGE",
        payload: newMessage,
      });
      const newSessions = {
        ...state.sessions,
        [state.currentSessionId]: [
          ...(state.sessions[state.currentSessionId] || []),
          newMessage,
        ],
      };
      dispatch({ type: "SET_SESSIONS", payload: newSessions });
    });
  };

  const handleModelChange = async (selectdModel: string) => {
    console.log(state.activeModel);
    const response = await changeModelApi(selectdModel);
    console.log(response);
  };

  const refreshModel = async () => {
    await fetchModels();
  };

  return (
    <div>
      <SessionManagement
        sessions={state.sessions}
        currentSessionId={state.currentSessionId}
        handleSessionChange={handleSessionChange}
        createNewSession={createNewSession}
        deleteSession={deleteSession}
        models={state.models}
        activeModel={state.activeModel}
        handleModelChange={handleModelChange}
        refreshModel={refreshModel}
      />
      <div className="chat-container">
        <StoryContainer storyYaml={storyYaml} />
        <div className="chat">
          <h4>聊天</h4>
          <MessageContainer
            messages={state.messages}
            onButtonClick={handleButtonClick}
          />
          <div className="input-area">
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button onClick={sendMessage} type="primary">
              发送
            </Button>
            <Button onClick={resetConversation}>重置会话</Button>
          </div>
        </div>
        <div className="confidence-container">
          <h4>置信度</h4>
          <ConfidenceRanking intents={topIntents} />
        </div>
      </div>
      <div className="slot-display-wrapper">
        <SlotDisplay slots={filledSlots} />
      </div>
    </div>
  );
};

export default Chat;
