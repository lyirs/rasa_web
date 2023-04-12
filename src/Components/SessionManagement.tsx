/*
 * @Author:
 * @Date: 2023-04-09 01:21:12
 * @LastEditTime: 2023-04-12 21:54:18
 * @Description:
 */
import React from "react";
import { Select, Button, Space } from "antd";
import RasaStatus from "./RasaStatus";

const { Option } = Select;

interface SessionManagementProps {
  sessions: { [key: string]: any[] };
  currentSessionId: string;
  handleSessionChange: (selectedSession: string) => void;
  createNewSession: () => void;
  deleteSession: () => void;
  models: string[];
  activeModel: string;
  handleModelChange: (selectedModel: string) => void;
  refreshModel: () => void;
}

const SessionManagement: React.FC<SessionManagementProps> = ({
  sessions,
  currentSessionId,
  handleSessionChange,
  createNewSession,
  deleteSession,
  models,
  activeModel,
  handleModelChange,
  refreshModel,
}) => {
  return (
    <div className="session-management">
      <RasaStatus />
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
          <Select
            value={activeModel}
            onChange={handleModelChange}
            style={{ width: 200 }}
            className="model-select"
          >
            {models.map((model) => (
              <Option key={model} value={model}>
                {model}
              </Option>
            ))}
          </Select>
          <Button onClick={refreshModel} type="primary" ghost>
            刷新模型
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default SessionManagement;
