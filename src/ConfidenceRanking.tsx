import React from "react";
import { Table } from "antd";

interface IntentConfidence {
  name: string;
  confidence: number;
}

interface ConfidenceRankingProps {
  intents: IntentConfidence[];
}

const columns = [
  {
    title: "Intent",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Confidence",
    dataIndex: "confidence",
    key: "confidence",
  },
];

const ConfidenceRanking: React.FC<ConfidenceRankingProps> = ({ intents }) => {
  // Add a unique key for each data item
  const dataWithKey = intents.map((intent, index) => ({
    key: index,
    ...intent,
  }));

  return (
    <Table dataSource={dataWithKey} columns={columns} pagination={false} />
  );
};

export default ConfidenceRanking;
