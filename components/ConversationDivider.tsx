import React from "react";

interface ConversationDividerProps {
  type: "operator_joined" | "operator_left" | "system";
  message?: string;
}

const ConversationDivider: React.FC<ConversationDividerProps> = ({
  type,
  message,
}) => {
  const getContent = () => {
    switch (type) {
      case "operator_joined":
        return {
          icon: "✨",
          text: "Erhan joined the conversation",
          color: "text-[#00FF41]",
          borderColor: "border-[#00FF41]",
          bgColor: "bg-[#00FF41]/5",
        };
      case "operator_left":
        return {
          icon: "👋",
          text: "Erhan left the conversation",
          color: "text-[#008F11]",
          borderColor: "border-[#008F11]",
          bgColor: "bg-[#008F11]/5",
        };
      case "system":
      default:
        return {
          icon: "⚡",
          text: message || "System message",
          color: "text-[#008F11]",
          borderColor: "border-[#003B00]",
          bgColor: "bg-transparent",
        };
    }
  };

  const content = getContent();

  return (
    <div className="flex items-center justify-center my-4 px-4">
      <div className={`flex-1 h-px ${content.borderColor} opacity-50`} />
      <div
        className={`
          flex items-center gap-2 px-4 py-1.5 mx-4
          ${content.bgColor} ${content.borderColor} border
          text-[10px] sm:text-xs font-medium tracking-wide
          ${content.color}
        `}
      >
        <span>{content.icon}</span>
        <span className="uppercase">{content.text}</span>
      </div>
      <div className={`flex-1 h-px ${content.borderColor} opacity-50`} />
    </div>
  );
};

export default ConversationDivider;
