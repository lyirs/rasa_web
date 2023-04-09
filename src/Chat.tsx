import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Input, Button } from "antd";
import "./chat.css";
import type { InputRef } from "antd";
import ConfidenceRanking from "./ConfidenceRanking";
import SlotDisplay from "./SlotDisplay";
import SessionManagement from "./SessionManagement";
import MessageContainer from "./MessageContainer";
import StoryContainer from "./StoryContainer";

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
      const session = await axios.get(
        `http://localhost:5001/user_sessions/${userId}`
      );
      console.log("fetchSessions");
      console.log(userId);
      console.log(session);
      const sessionIds = session.data.sessions;

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
    return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

    const fetchPreviousMessages = async (recoveredUserId: string) => {
      try {
        const session = await axios.get(
          `http://localhost:5001/user_sessions/${recoveredUserId}`
        );

        console.log("session");
        console.log(session.data.sessions);
        const sessionId = session.data.sessions[0];

        const response = await axios.get(
          `http://localhost:5005/conversations/${sessionId}/tracker`
        );

        console.log(response.data.events);

        const events = response.data.events;
        const previousMessages: Message[] = events
          .filter(
            (event: any) => event.event === "user" || event.event === "bot"
          )
          .map((event: any) => ({
            text: event.text,
            isUser: event.event === "user",
          }));

        setMessages(previousMessages);

        // 设置 stories.yml
        const newStoryYaml = generateStoryYaml(response.data);
        setStoryYaml(newStoryYaml);
      } catch (error) {
        console.error("Error fetching previous messages:", error);
      }
    };

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

  const sendMessage = async () => {
    if (inputRef.current) {
      const message = inputRef.current.input?.value + "";
      setMessages([
        ...messages,
        {
          text: message,
          isUser: true,
        },
      ]);

      const update = async (sessionId: string) => {
        // 请求对话响应
        const response = await axios.post(
          "http://localhost:5005/webhooks/rest/webhook",
          { sender: sessionId, message: message }
        );

        // 请求意图和置信度信息
        const nluResponse = await axios.post(
          "http://localhost:5005/model/parse",
          { text: message }
        );

        // 获取对话跟踪器状态

        const trackerResponse = await axios.get(
          `http://localhost:5005/conversations/${sessionId}/tracker`
        );
        const trackerState = trackerResponse.data;
        const slots = trackerState.slots;
        setFilledSlots(slots);

        // 存储对话session
        const storeSession = await axios.get(
          `http://localhost:5001/new_conversation/${userId}/${sessionId}`
        );

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

      if (!currentSessionId) {
        const newSessionId = generateSessionId();
        setCurrentSessionId(newSessionId);
        setSessions((prevSessions) => ({
          ...prevSessions,
          [newSessionId]: [
            {
              text: message,
              isUser: true,
            },
          ],
        }));
        setInputValue("");
        update(newSessionId);
        return;
      }

      setSessions((prevSessions) => ({
        ...prevSessions,
        [currentSessionId]: [
          ...(prevSessions[currentSessionId] || []),
          {
            text: message,
            isUser: true,
          },
        ],
      }));

      setInputValue("");
      update(currentSessionId);
    }
  };

  const resetConversation = async () => {
    try {
      await axios.post(
        `http://localhost:5005/conversations/${userId}/tracker/events`,
        {
          event: "restart",
        }
      );
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
    const response = await axios.get(
      `http://localhost:5005/conversations/${selectedSession}/tracker`
    );

    const events = response.data.events;
    const previousMessages: Message[] = events
      .filter((event: any) => event.event === "user" || event.event === "bot")
      .map((event: any) => ({
        text: event.text,
        isUser: event.event === "user",
      }));

    setMessages(previousMessages);

    // 获取对话跟踪器状态
    const trackerState = response.data;

    // 设置 stories.yml
    const newStoryYaml = generateStoryYaml(trackerState);
    setStoryYaml(newStoryYaml);
  };

  const createNewSession = async () => {
    const newSessionId = generateSessionId();

    const response = await axios.get(
      `http://localhost:5005/conversations/${newSessionId}/tracker`
    );

    setCurrentSessionId(newSessionId);
    setSessions((prevSessions) => ({
      ...prevSessions,
      [newSessionId]: [],
    }));
    setMessages([]);
  };

  const deleteSession = async () => {
    try {
      await axios.delete(
        `http://localhost:5001/delete_conversation/${currentSessionId}`
      );
      await axios.delete(
        `http://localhost:5001/delete_session/session-1681051825122`
      );
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
