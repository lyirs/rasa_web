import React from "react";
import { List } from "antd";
import type { Message } from "../Chat";
import { useTransition, animated } from "react-spring";

interface MessageContainerProps {
  messages: Message[];
}

const MessageContainer: React.FC<MessageContainerProps> = ({ messages }) => {
  const transitions = useTransition<Message, any>(messages, {
    keys: (_item: Message, index: number) => index,
    from: { opacity: 0, transform: "translateY(20px)" },
    enter: { opacity: 1, transform: "translateY(0px)" },
    leave: { opacity: 0, transform: "translateY(-20px)" },
  });

  return (
    <div className="message-container">
      {transitions((style, item) => (
        <animated.div style={style}>
          <List.Item className={item.isUser ? "user-message" : "bot-message"}>
            <div className="message-bubble">{item.text}</div>
          </List.Item>
        </animated.div>
      ))}
    </div>
  );
};

export default MessageContainer;
