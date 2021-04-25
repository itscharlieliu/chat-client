import { Button, TextField } from "@material-ui/core";
import React, { ChangeEvent, useEffect, useState } from "react";
import "./styles/ChatBox.css";

const ChatBox = (): JSX.Element => {
    const [messages, setMessages] = useState<string[]>([]);
    const [message, setMessage] = useState<string>("");
    const [wsAddress, setWsAddress] = useState<string>("ws://");
    const [wsAdapter, setWsAdapter] = useState<WebSocket | null>(null);

    useEffect((): (() => void) => {
        const currWsAdapter = wsAdapter;

        if (currWsAdapter) {
            currWsAdapter.onopen = () => {
                console.log(`Connected to ${currWsAdapter.url}`);
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

    const handleSend = () => {
        setMessages([...messages, message]);
        setMessage("");
    };

    return (
        <div className={"ChatBox"}>
            <div className={"ChatBox__messagesContainer"}>
                {messages.map((message: string, index: number) => (
                    <span key={"message" + index}>{message}</span>
                ))}
            </div>
            <TextField
                label={"Server Address"}
                value={wsAddress}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setWsAddress(event.target.value)}
            />
            <Button variant={"contained"} onClick={handleConnect}>
                Connect
            </Button>
            <TextField
                label={"Message"}
                value={message}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setMessage(event.target.value)}
            />
            <Button variant={"contained"} onClick={handleSend}>
                Test
            </Button>
        </div>
    );
};

export default ChatBox;
