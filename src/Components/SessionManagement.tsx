import React from "react";
import { Select, Button, Space } from "antd";
const { Option } = Select;

interface SessionManagementProps {
  sessions: { [key: string]: any[] };
  currentSessionId: string;
  handleSessionChange: (selectedSession: string) => void;
  createNewSession: () => void;
  deleteSession: () => void;
}

const SessionManagement: React.FC<SessionManagementProps> = ({
  sessions,
  currentSessionId,
  handleSessionChange,
  createNewSession,
  deleteSession,
}) => {
  return (
    <div className="session-management">
      <div className="space-container">
        <Space>
          <Select
            value={currentSessionId}
            onChange={handleSessionChange}
            style={{ width: 200 }}
          >
            {Object.keys(sessions).map((session) => (
              <Option key={session} value={session}>
                {session}
              </Option>
            ))}
          </Select>
          <Button onClick={createNewSession}>新建会话</Button>
          <Button onClick={deleteSession} danger>
            删除会话
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default SessionManagement;
