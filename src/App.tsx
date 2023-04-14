/*
 * @Author:
 * @Date: 2023-04-06 15:56:45
 * @LastEditTime: 2023-04-14 15:21:13
 * @Description:
 */
import React from "react";
import "./App.css";
import Chat from "./Chat";
import LowCodePlatform from "./LowCodePlatform";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        {/* <Chat /> */}
        <DndProvider backend={HTML5Backend}>
          <LowCodePlatform />
        </DndProvider>
      </header>
    </div>
  );
};

export default App;
