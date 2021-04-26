import { Button, TextField } from "@material-ui/core";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import styled from "styled-components";

interface Message {
    data: string;
    timestamp: Date;
}

const ChatBoxContainer = styled.div`
    display: grid;
    grid-template-columns: auto 150px;
    column-gap: 20px;
    row-gap: 20px;

    box-shadow: 0 0 5px 2px rgba(0, 0, 0, 0.3);
    min-width: 600px;
    padding: 20px;
    border-radius: 5px;
`;

const MessagesContainer = styled.div`
    grid-column-start: 1;
    grid-column-end: 3;

    display: flex;
    flex-direction: column;
    align-items: flex-start;

    height: 300px;
    overflow-y: scroll;

    padding: 20px;
    border: rgba(0, 0, 0, 0.3) 1px solid;
`;

const ChatBox = (): JSX.Element => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatBoxValue, setChatBoxValue] = useState<string>("");
    const [wsAddress, setWsAddress] = useState<string>("ws://");
    const [wsAdapter, setWsAdapter] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const addMessage = (data: string) => {
        console.log(`message: ${data}`);

        const newMessage = {
            data,
            timestamp: new Date(),
        };

        setMessages((currMessages: Message[]) => [...currMessages, newMessage]);

        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect((): (() => void) => {
        const currWsAdapter = wsAdapter;

        return () => currWsAdapter && currWsAdapter.close();
    }, [wsAdapter]);

    const handleConnect = () => {
        try {
            const newWsAdaper = new WebSocket(wsAddress);
            newWsAdaper.onopen = () => {
                addMessage(`Connected to ${newWsAdaper.url}`);
                setIsConnected(true);
            };
            newWsAdaper.onerror = () => {
                addMessage(`Unable to connect to ${newWsAdaper.url}`);
            };
            newWsAdaper.onmessage = (event: MessageEvent) => {
                addMessage(event.data);
            };
            setWsAdapter(newWsAdaper);
        } catch (e) {
            console.warn(e);
            addMessage("Invalid server address");
        }
    };

    const handleDisconnect = () => {
        const url = wsAdapter ? wsAdapter.url : "unknown";
        setWsAdapter(null);
        setIsConnected(false);
        addMessage(`Disconnected from ${url}`);
    };

    const handleSend = () => {
        setChatBoxValue("");

        if (!isConnected || !wsAdapter) {
            addMessage("Unable to send message. Not connected to server.");
            return;
        }
        wsAdapter.send(chatBoxValue);
    };

    return (
        <ChatBoxContainer>
            <MessagesContainer>
                {messages.map((message: Message, index: number) => (
                    <span key={"message" + index}>
                        {message.timestamp.toString()}: {message.data}
                    </span>
                ))}
                <div ref={messagesEndRef} />
            </MessagesContainer>
            <TextField
                label={"Server Address"}
                value={wsAddress}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setWsAddress(event.target.value)}
                onKeyUp={(event: React.KeyboardEvent) => {
                    if (event.key === "Enter") {
                        handleConnect();
                    }
                }}
            />
            {isConnected ? (
                <Button variant={"contained"} onClick={handleDisconnect}>
                    Disconnect
                </Button>
            ) : (
                <Button variant={"contained"} onClick={handleConnect}>
                    Connect
                </Button>
            )}
            <TextField
                label={"Message"}
                value={chatBoxValue}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setChatBoxValue(event.target.value)}
                onKeyUp={(event: React.KeyboardEvent) => {
                    if (event.key === "Enter") {
                        handleSend();
                    }
                }}
            />
            <Button variant={"contained"} onClick={handleSend}>
                Send
            </Button>
        </ChatBoxContainer>
    );
};

export default ChatBox;
