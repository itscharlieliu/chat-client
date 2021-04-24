import React, { useRef, useState } from "react";
import "./styles/ChatBox.css";

const ChatBox = (): JSX.Element => {
    const [messages, setMessages] = useState<string[]>([]);

    // Use the ref instead of making it a controlled input for performance reasons
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSend = () => {
        if (!inputRef.current) {
            return;
        }
        setMessages([...messages, inputRef.current.value]);
        inputRef.current && (inputRef.current.value = "");
    };

    return (
        <div className={"ChatBox"}>
            <div className={"ChatBox__messagesContainer"}>
                {messages.map((message: string, index: number) => (
                    <span key={"message" + index}>{message}</span>
                ))}
            </div>
            <input ref={inputRef} />
            <button onClick={handleSend}>Test</button>
        </div>
    );
};

export default ChatBox;
