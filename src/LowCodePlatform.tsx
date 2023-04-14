import React, { useState } from "react";
import { Card, Input, Menu } from "antd";

import "./LowCodePlatform.css";

import DraggableCard from "./DraggableCard";
import { useDrop } from "react-dnd";

const LowCodePlatform: React.FC = () => {
  const [components, setComponents] = useState<any[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();

    const x = event.clientX;
    const y = event.clientY;

    setContextMenu({ x, y });
  };

  const handleMenuClick = () => {
    if (contextMenu) {
      setComponents((prevComponents) => [
        ...prevComponents,
        {
          id: prevComponents.length,
          x: contextMenu.x,
          y: contextMenu.y,
          value: "",
        },
      ]);
      setContextMenu(null);
    }
  };

  const handleClickOutside = () => {
    setContextMenu(null);
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    id: number
  ) => {
    const newValue = event.target.value;
    setComponents((prevComponents) =>
      prevComponents.map((component) =>
        component.id === id ? { ...component, value: newValue } : component
      )
    );
  };

  const handleDrop = (id: number, newX: number, newY: number) => {
    setComponents((prevComponents) =>
      prevComponents.map((component) =>
        component.id === id ? { ...component, x: newX, y: newY } : component
      )
    );
  };

  const [, drop] = useDrop({
    accept: "card",
    drop: (item: any, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset() as {
        x: number;
        y: number;
      };
      const index = components.findIndex(
        (component) => component.id === item.id
      );

      if (index !== -1) {
        const newComponents = [...components];
        newComponents[index].x = Math.round(components[index].x + delta.x);
        newComponents[index].y = Math.round(components[index].y + delta.y);
        setComponents(newComponents);
      }
    },
  });

  const menuItem = [
    {
      label: "用户输入",
      key: "userInput",
    },
  ];

  return (
    <div
      ref={drop}
      className="low-code-platform"
      onContextMenu={handleContextMenu}
      onClick={handleClickOutside}
    >
      {contextMenu && (
        <Menu
          onClick={handleMenuClick}
          style={{
            position: "absolute",
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          selectable={false}
          items={menuItem}
        />
      )}
      {components.map((component) => (
        <DraggableCard
          key={component.id}
          id={component.id}
          x={component.x}
          y={component.y}
          value={component.value}
          onChange={handleChange}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
};

export default LowCodePlatform;
