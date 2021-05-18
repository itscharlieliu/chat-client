import { Progress } from "@aws-sdk/lib-storage";
import { Button, TextField } from "@material-ui/core";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import styled from "styled-components";

import { s3upload } from "../../utils/awsUtils";
import debouncer from "../../utils/debouncer";

interface Message {
    data: string;
    timestamp: string;
}

interface DisplayFile {
    file: File;
    progressPercentage: number; // From 0 to 1
    confirmed: boolean;
    error?: Error;
}

interface SelectedFilesProps {
    displayFiles: DisplayFile[];
}

const SelectedFiles = (props: SelectedFilesProps): JSX.Element => {
    let result = "";
    for (let i = 0; i < props.displayFiles.length; ++i) {
        result += `${props.displayFiles[i].file.name} ${props.displayFiles[i].progressPercentage}`;
    }
    return <span>{result}</span>;
};

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
    // TODO Change this address or set up a way to persist addresses
    const [wsAddress, setWsAddress] = useState<string>("ws://127.0.0.1:8080");
    const [wsAdapter, setWsAdapter] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [displayFiles, setDisplayFiles] = useState<DisplayFile[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect((): (() => void) => {
        const currWsAdapter = wsAdapter;

        return () => currWsAdapter && currWsAdapter.close();
    }, [wsAdapter]);

    const addMessage = (data: string) => {
        const date = new Date();

        const timestamp = new Intl.DateTimeFormat("en", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }).format(date);

        const newMessage = {
            data,
            timestamp,
        };

        setMessages((currMessages: Message[]) => [...currMessages, newMessage]);

        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

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
                if (typeof event.data !== "string") {
                    console.log(event.data);
                    return;
                }
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

    const handleSend = async () => {
        setChatBoxValue("");

        if (!isConnected || !wsAdapter) {
            addMessage("Unable to send message. Not connected to server.");
            return;
        }

        for (let i = 0; i < displayFiles.length; ++i) {
            const file = displayFiles[i].file;

            const debounce = debouncer(2000);

            const onProgress = (progress: Progress) => {
                debounce(() =>
                    setDisplayFiles((curr: DisplayFile[]): DisplayFile[] => {
                        const next = [...curr]; // Shallow copy

                        console.log(progress);

                        if (progress.loaded && progress.total) {
                            next[i].progressPercentage = progress.loaded / progress.total;
                        }

                        return next;
                    }),
                );
            };

            const onError = (error: Error) => {
                setDisplayFiles((curr: DisplayFile[]): DisplayFile[] => {
                    const next = [...curr]; // Shallow copy

                    next[i].error = error;

                    return next;
                });
            };

            await s3upload(file, onProgress, onError);
        }

        wsAdapter.send(chatBoxValue);
    };

    const handleSelectFile = () => {
        // We create a "ghost" input to allow us to open the file browser
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.onchange = () => {
            // use this method to get file and perform respective operations

            if (!input.files || !input.files.length) {
                return;
            }

            const selection: DisplayFile[] = [];

            for (let i = 0; i < input.files.length; ++i) {
                selection.push({ file: input.files[i], progressPercentage: 0, confirmed: false });
            }

            setDisplayFiles(selection);
        };
        input.click();
    };

    return (
        <ChatBoxContainer>
            <MessagesContainer>
                {messages.map((message: Message, index: number) => (
                    <span key={"message" + index}>
                        {message.timestamp}: {message.data}
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
            <SelectedFiles displayFiles={displayFiles}></SelectedFiles>
            <Button variant={"contained"} onClick={handleSelectFile}>
                Test
            </Button>
        </ChatBoxContainer>
    );
};

export default ChatBox;
