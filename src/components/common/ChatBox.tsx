import { Button, TextField } from "@material-ui/core";
import React, { ChangeEvent, useEffect, useState } from "react";
import styled from "styled-components";

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

    padding: 20px;
    border: rgba(0, 0, 0, 0.3) 1px solid;
`;

const ChatBox = (): JSX.Element => {
    const [messages, setMessages] = useState<string[]>([]);
    const [message, setMessage] = useState<string>("");
    const [wsAddress, setWsAddress] = useState<string>("ws://");
    const [wsAdapter, setWsAdapter] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);

    const addMessage = (msg: string) => {
        console.log(`message: ${msg}`);
        setMessages([...messages, msg]);
    };

    useEffect((): (() => void) => {
        const currWsAdapter = wsAdapter;

        if (currWsAdapter) {
            currWsAdapter.onopen = () => {
                addMessage(`Connected to ${currWsAdapter.url}`);
                setIsConnected(true);
            };
            currWsAdapter.onerror = () => {
                addMessage(`Unable to connect to ${currWsAdapter.url}`);
            };
        }

        return () => currWsAdapter && currWsAdapter.close();
    }, [wsAdapter]);

    const handleConnect = () => {
        try {
            setWsAdapter(new WebSocket(wsAddress));
        } catch (e) {
            console.warn(e);
        }
    };

    const handleDisconnect = () => {
        const url = wsAdapter ? wsAdapter.url : "unknown";
        setWsAdapter(null);
        setIsConnected(false);
        addMessage(`Disconnected from ${url}`);
    };

    const handleSend = () => {
        setMessage("");
    };

    return (
        <ChatBoxContainer>
            <MessagesContainer>
                {messages.map((message: string, index: number) => (
                    <span key={"message" + index}>{message}</span>
                ))}
            </MessagesContainer>
            <TextField
                label={"Server Address"}
                value={wsAddress}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setWsAddress(event.target.value)}
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
                value={message}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setMessage(event.target.value)}
            />
            <Button variant={"contained"} onClick={handleSend}>
                Test
            </Button>
        </ChatBoxContainer>
    );
};

export default ChatBox;
