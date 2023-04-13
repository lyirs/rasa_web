export interface MessageContainerProps {
  messages: Message[];
  onButtonClick: (button: messageButtion) => void;
}

export interface messageButtion {
  title: string;
  payload: string;
}

export interface Message {
  text?: string;
  isUser: boolean;
  image?: string;
  buttons?: { title: string; payload: string }[];
}
