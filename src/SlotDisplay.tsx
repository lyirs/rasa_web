/*
 * @Author:
 * @Date: 2023-04-07 19:06:48
 * @LastEditTime: 2023-04-07 19:13:50
 * @Description:
 */
import React from "react";
import "./SlotDisplay.css";

interface SlotDisplayProps {
  slots: { [key: string]: any };
}

const SlotDisplay: React.FC<SlotDisplayProps> = ({ slots }) => {
  return (
    <div className="slot-display-container">
      <h4>已填充插槽</h4>
      <ul>
        {Object.entries(slots)
          .filter(([_slot, value]) => value !== null && value !== undefined)
          .map(([slot, value]) => (
            <li key={slot}>
              {slot}: {value}
            </li>
          ))}
      </ul>
    </div>
  );
};

export default SlotDisplay;
