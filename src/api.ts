/*
 * @Author:
 * @Date: 2023-04-09 12:07:59
 * @LastEditTime: 2023-04-09 12:08:10
 * @Description:
 */
import axios from "axios";

export const createSession = async (userId: string, sessionId: string) => {
  try {
    await axios.post("http://localhost:5001/create_session", {
      user_id: userId,
      session_id: sessionId,
    });
  } catch (error) {
    console.error("Error creating session:", error);
  }
};

export const getSessionIdsForUser = async (userId: string) => {
  try {
    const response = await axios.get(
      `http://localhost:5001/sessions/${userId}`
    );
    return response.data.sessionIds;
  } catch (error) {
    console.error("Error fetching sessionIds for user:", error);
    throw error;
  }
};

export const deleteSession = async (userId: string, sessionId: string) => {
  try {
    await axios.delete(
      `http://localhost:5001/delete_conversation/${userId}/${sessionId}`
    );
  } catch (error) {
    console.error("Error deleting session:", error);
    throw error;
  }
};
