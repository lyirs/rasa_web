/*
 * @Author:
 * @Date: 2023-04-09 00:46:29
 * @LastEditTime: 2023-04-09 01:43:55
 * @Description:
 */
import React from "react";

interface StoryContainerProps {
  storyYaml: string;
}

const StoryContainer: React.FC<StoryContainerProps> = ({ storyYaml }) => {
  return (
    <div className="story-container">
      <h4>stories.yml</h4>
      <pre style={{ whiteSpace: "pre-wrap", textAlign: "left" }}>
        {storyYaml}
      </pre>
    </div>
  );
};

export default StoryContainer;
