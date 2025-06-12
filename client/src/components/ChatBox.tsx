import type { Room } from "colyseus.js";
import { useEffect, useState, useRef } from "react";
import { useGameStore } from "../utils/store";

export function ChatBox({ room }: { room: Room }) {
  const [messages, setMessages] = useState<
    { id: string; name: string; text: string }[]
  >([]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const eventRegistered = useRef(false);

  useEffect(() => {
    const handleMessage = (payload: {
      id: string;
      name: string;
      text: string;
    }) => {
      setMessages((prev) => [...prev, payload]);
    };

    !eventRegistered.current && room.onMessage("chat", handleMessage);
    eventRegistered.current = true;
  }, [room]);

  const sendMessage = () => {
    if (!input.trim()) return;
    room.send("chat", { text: input });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div
      style={{
        position: "absolute",
        zIndex: 1000,
        bottom: "20px",
        left: "20px",
        width: "320px",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        padding: "12px",
        borderRadius: "6px",
        color: "white",
        fontFamily: "sans-serif",
        fontSize: "14px",
      }}
    >
      <div
        style={{
          maxHeight: "160px",
          lineHeight: "1.4",
          overflowY: "auto",
          marginBottom: "10px",
        }}
      >
        {messages.map((msg, i) => (
          <div key={i}>
            <strong
              style={{ color: useGameStore.getState().players[msg.id].color }}
            >
              {msg.name}:
            </strong>{" "}
            {msg.text}
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        style={{
          width: "95%",
          padding: "6px 8px",
          border: "none",
          borderRadius: "4px",
          fontSize: "14px",
          outline: "none",
          color: "white",
          backgroundColor: "rgba(100, 100, 100, 0.2)",
        }}
        placeholder="Type a message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
