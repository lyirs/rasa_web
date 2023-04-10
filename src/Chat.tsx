import React, { useState, useRef, useEffect, useCallback } from "react";
import { Input, Button } from "antd";
import "./chat.css";
import type { InputRef } from "antd";
import ConfidenceRanking from "./Components/ConfidenceRanking";
import SlotDisplay from "./Components/SlotDisplay";
import SessionManagement from "./Components/SessionManagement";
import MessageContainer from "./Components/MessageContainer";
import StoryContainer from "./Components/StoryContainer";
import {
  deleteConversation,
  fetchUserSessions,
  getConversationTracker,
  getNLUModelParse,
  getWebhookResponse,
  resetConversationTracker,
  storeConversation,
  deleteSessions,
} from "./request/api";

export interface Message {
  text: string;
  isUser: boolean;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const inputRef = useRef<InputRef>(null);
  const [topIntents, setTopIntents] = useState<any[]>([]);
  const [storyYaml, setStoryYaml] = useState("");
  const [userId, setUserId] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [filledSlots, setFilledSlots] = useState<{ [key: string]: any }>({});
  const [sessions, setSessions] = useState<{ [key: string]: Message[] }>({});
  const [currentSessionId, setCurrentSessionId] = useState("");

  const fetchSessions = async (userId: string) => {
    try {
      const session = await fetchUserSessions(userId);
      const sessionIds = session.sessions;

      const newSessions: { [key: string]: Message[] } = {};
      sessionIds.forEach((sessionId: string) => {
        newSessions[sessionId] = [];
      });
      setSessions(newSessions);

      // 设置当前会话ID
      if (sessionIds.length > 0) {
        setCurrentSessionId(sessionIds[0]);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const generateUserId = () => {
    return `user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  };

  const fetchPreviousMessages = async (recoveredUserId: string) => {
    try {
      const session = await fetchUserSessions(recoveredUserId);

      const sessionId = session.sessions[0];

      const response = await getConversationTracker(sessionId);

      const events = response.events;
      const previousMessages: Message[] = events
        .filter((event: any) => event.event === "user" || event.event === "bot")
        .map((event: any) => ({
          text: event.text,
          isUser: event.event === "user",
        }));

      setMessages(previousMessages);

      // 设置 stories.yml
      const newStoryYaml = generateStoryYaml(response);
      setStoryYaml(newStoryYaml);
    } catch (error) {
      console.error("Error fetching previous messages:", error);
    }
  };

  useEffect(() => {
    console.log("useEffect");
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

    const storedSessions = localStorage.getItem("sessions");
    if (storedSessions) {
      setSessions(JSON.parse(storedSessions));
    }

    fetchPreviousMessages(storedUserId || userId);

    if (Object.keys(sessions).length > 0) {
      setCurrentSessionId(Object.keys(sessions)[0]);
      setMessages(sessions[Object.keys(sessions)[0]]);
    }
  }, []);

  const generateSessionId = () => {
    return `session-${Date.now()}`;
  };

  const generateStoryYaml = (trackerState: any) => {
    let storyYaml =
      'version: "3.1"\nstories:\n- story: Generated Story\n  steps:';

    trackerState.events.forEach((event: any) => {
      if (event.event === "user") {
        storyYaml += `\n  - intent: ${event.parse_data.intent.name}`;
      } else if (event.event === "action") {
        if (
          event.name !== "action_session_start" &&
          event.name !== "action_listen"
        ) {
          storyYaml += `\n  - action: ${event.name}`;
        }
      }
    });

    return storyYaml;
  };

  const update = async (message: string, sessionId: string) => {
    // 请求对话响应
    const response = await getWebhookResponse(sessionId, message);

    // 请求意图和置信度信息
    const nluResponse = await getNLUModelParse(message);

    // 获取对话跟踪器状态

    const trackerResponse = await getConversationTracker(sessionId);
    const trackerState = trackerResponse;
    const slots = trackerState.slots;
    setFilledSlots(slots);

    // 存储对话session
    const storeSession = await storeConversation(userId, sessionId);

    // 设置stories.yml
    const newStoryYaml = generateStoryYaml(trackerState);
    setStoryYaml(newStoryYaml);

    setTopIntents(
      nluResponse.data.intent_ranking.slice(0, 10).map((intent: any) => ({
        name: intent.name,
        confidence: intent.confidence.toFixed(2),
      }))
    );

    if (response.data && response.data.length > 0) {
      const botMessage = response.data[0].text;

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: botMessage,
          isUser: false,
        },
      ]);

      setSessions((prevSessions) => ({
        ...prevSessions,
        [sessionId]: [
          ...(prevSessions[sessionId] || []),
          {
            text: botMessage,
            isUser: false,
          },
        ],
      }));
    }
  };

  const sendMessage = useCallback(async () => {
    if (inputRef.current) {
      const message = inputRef.current.input?.value + "";

      setMessages([
        ...messages,
        {
          text: message,
          isUser: true,
        },
      ]);

      setInputValue("");

      let sessionId = currentSessionId;

      if (!currentSessionId) {
        sessionId = generateSessionId();
        setCurrentSessionId(sessionId);
      }

      await update(message, sessionId);
    }
  }, [currentSessionId, messages, userId]);
  const resetConversation = async () => {
    try {
      await resetConversationTracker(currentSessionId);
      setMessages([]);
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
    setCurrentSessionId(selectedSession);

    // 从数据库获取之前的消息
    const response = await getConversationTracker(selectedSession);

    const events = response.events;
    const previousMessages: Message[] = events
      .filter((event: any) => event.event === "user" || event.event === "bot")
      .map((event: any) => ({
        text: event.text,
        isUser: event.event === "user",
      }));

    setMessages(previousMessages);

    // 获取对话跟踪器状态
    const trackerState = response;

    // 设置 stories.yml
    const newStoryYaml = generateStoryYaml(trackerState);
    setStoryYaml(newStoryYaml);
  };

  const createNewSession = async () => {
    const newSessionId = generateSessionId();

    const response = await getConversationTracker(newSessionId);

    setCurrentSessionId(newSessionId);
    setSessions((prevSessions) => ({
      ...prevSessions,
      [newSessionId]: [],
    }));
    setMessages([]);
  };

  const deleteSession = async () => {
    try {
      await deleteConversation(currentSessionId);
      await deleteSessions(currentSessionId);

      const updatedSessions = { ...sessions };
      delete updatedSessions[currentSessionId];
      setSessions(updatedSessions);
      setCurrentSessionId("");
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  return (
    <div>
      <SessionManagement
        sessions={sessions}
        currentSessionId={currentSessionId}
        handleSessionChange={handleSessionChange}
        createNewSession={createNewSession}
        deleteSession={deleteSession}
      />
      <div className="chat-container">
        <StoryContainer storyYaml={storyYaml} />
        <div className="chat">
          <h4>聊天</h4>
          <MessageContainer messages={messages} />
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
