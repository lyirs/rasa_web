/*
 * @Author:
 * @Date: 2023-04-10 15:03:02
 * @LastEditTime: 2023-04-10 15:13:12
 * @Description:
 */
import React, { useState, useEffect } from "react";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { getRasaStatusApi } from "../request/api";
import "./RasaStatus.css";

const RasaStatus: React.FC = () => {
  const [status, setStatus] = useState(false);

  const checkRasaStatus = async () => {
    try {
      const response = (await getRasaStatusApi()).data;
      if (response.model_id) {
        setStatus(true);
      } else {
        setStatus(false);
      }
    } catch (error) {
      setStatus(false);
    }
  };

  useEffect(() => {
    checkRasaStatus();
    const interval = setInterval(() => {
      checkRasaStatus();
    }, 10000); // 每 10 秒检查一次

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="rasa_status">
      <span>RASA 服务: </span>
      {status ? (
        <CheckOutlined style={{ color: "green" }} />
      ) : (
        <CloseOutlined style={{ color: "red" }} />
      )}
    </div>
  );
};

export default RasaStatus;
