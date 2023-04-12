/*
 * @Author:
 * @Date: 2023-04-10 12:39:20
 * @LastEditTime: 2023-04-12 19:06:19
 * @Description:
 */
interface ChatAction {
  type: string;
  payload?: any;
}

export const initialState = {
  sessions: {},
  currentSessionId: "",
  messages: [],
  models: [],
  activeModel: "",
};

export const reducer = (state: any, action: ChatAction) => {
  switch (action.type) {
    case "SET_SESSIONS":
      return { ...state, sessions: action.payload };
    case "SET_CURRENT_SESSION":
      return { ...state, currentSessionId: action.payload };
    case "SET_MESSAGES":
      return { ...state, messages: action.payload };
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case "CLEAR_MESSAGES":
      return {
        ...state,
        messages: [],
      };
    case "SET_MODELS":
      return { ...state, models: action.payload };
    case "SET_ACTIVE_MODEL":
      return { ...state, activeModel: action.payload };

    default:
      return state;
  }
};
