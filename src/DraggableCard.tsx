import React, { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { Card, Input } from "antd";

interface DraggableCardProps {
  id: number;
  x: number;
  y: number;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>, id: number) => void;
  onDrop: (id: number, x: number, y: number) => void;
}

const DraggableCard: React.FC<DraggableCardProps> = ({
  id,
  x,
  y,
  value,
  onChange,
  onDrop,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "card",
    item: { id, type: "card" },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const style: React.CSSProperties = {
    position: "absolute",
    left: x,
    top: y,
    opacity: isDragging ? 0.5 : 1,
  };

  drag(ref);

  return (
    <div ref={ref} style={style}>
      <Card
        bodyStyle={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Input
          style={{ width: "80%" }}
          value={value}
          onChange={(event) => onChange(event, id)}
          placeholder="请输入自然语言"
        />
      </Card>
    </div>
  );
};

export default DraggableCard;
