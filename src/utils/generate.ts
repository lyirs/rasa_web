import { getStoryYamlApi } from "../request/api";

const nanoid = (t = 10) =>
  crypto
    .getRandomValues(new Uint8Array(t))
    .reduce(
      (t, e) =>
        (t +=
          (e &= 63) < 36
            ? e.toString(36)
            : e < 62
            ? (e - 26).toString(36).toUpperCase()
            : e > 62
            ? "-"
            : "_"),
      ""
    );

export const generateSessionId = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const uuid = nanoid(10);

  return `session-${year}${month}${day}-${hours}${minutes}${seconds}-${uuid}`;
};
export const generateUserId = () => {
  return `user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

export const generateStoryYaml = async (sessionId: string) => {
  const response = await getStoryYamlApi(sessionId);
  const story = response.data;
  return story;
};
