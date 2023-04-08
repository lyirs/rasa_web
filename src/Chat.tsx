import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Input, Button, List } from "antd";
import "./chat.css";
import type { InputRef } from "antd";
import { useTransition, animated } from "react-spring";
import ConfidenceRanking from "./ConfidenceRanking";
import SlotDisplay from "./SlotDisplay";
interface Message {
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
  useEffect(() => {
    const generateUserId = () => {
      return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = generateUserId();
      setUserId(newUserId);
      localStorage.setItem("userId", newUserId);
    }
  }, []);

  const transitions = useTransition<Message, any>(messages, {
    keys: (_item: Message, index: number) => index,
    from: { opacity: 0, transform: "translateY(20px)" },
    enter: { opacity: 1, transform: "translateY(0px)" },
    leave: { opacity: 0, transform: "translateY(-20px)" },
  });

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

      setInputValue("");

      // 请求对话响应
      const response = await axios.post(
        "http://localhost:5005/webhooks/rest/webhook",
        { sender: userId, message: message }
      );

      // 请求意图和置信度信息
      const nluResponse = await axios.post(
        "http://localhost:5005/model/parse",
        { text: message }
      );

      // 获取对话跟踪器状态

      const trackerResponse = await axios.get(
        `http://localhost:5005/conversations/${userId}/tracker`
      );
      const trackerState = trackerResponse.data;
      const slots = trackerState.slots;
      console.log(trackerState);
      setFilledSlots(slots);

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
            id: Math.random().toString(36).substring(2),
            text: botMessage,
            isUser: false,
          },
        ]);
      }
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

  return (
    <div>
      <div className="chat-container">
        <div className="story-container">
          <h4>stories.yml</h4>
          <pre style={{ whiteSpace: "pre-wrap", textAlign: "left" }}>
            {storyYaml}
          </pre>
        </div>
        <div className="chat">
          <h4>聊天</h4>
          <div className="message-container">
            {transitions((style, item) => (
              <animated.div style={style}>
                <List.Item
                  className={item.isUser ? "user-message" : "bot-message"}
                >
                  <div className="message-bubble">{item.text}</div>
                </List.Item>
              </animated.div>
            ))}
          </div>
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
