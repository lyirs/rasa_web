/*
 * @Author:
 * @Date: 2023-04-09 01:29:10
 * @LastEditTime: 2023-04-10 19:04:19
 * @Description:
 */
import React from "react";
import { List } from "antd";
import type { Message } from "../Chat";
import { useTransition, animated } from "react-spring";

interface MessageContainerProps {
  messages: Message[];
  onButtonClick: (payload: string) => void;
}

const MessageContainer: React.FC<MessageContainerProps> = ({
  messages,
  onButtonClick,
}) => {
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
            <div className="message-bubble">
              {item.text}
              {item.image && (
                <img
                  src={item.image}
                  alt="message_image"
                  style={{ maxWidth: "100%" }}
                />
              )}
              {item.buttons && (
                <div className="message-buttons">
                  {item.buttons.map((button) => (
                    <button
                      key={button.title}
                      className="message-button"
                      onClick={() => onButtonClick(button.payload)}
                    >
                      {button.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </List.Item>
        </animated.div>
      ))}
    </div>
  );
};

export default MessageContainer;
