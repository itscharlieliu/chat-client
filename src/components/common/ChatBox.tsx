import { Progress } from "@aws-sdk/lib-storage";
import { Button, Chip, CircularProgress, TextField, Typography } from "@material-ui/core";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { v4 as uuidv4 } from "uuid";

import { s3upload } from "../../utils/awsUtils";
import createMessage, { Message } from "../../utils/createMessage";
import debouncer from "../../utils/debouncer";
import formatDate from "../../utils/formatDate";

import FileComponent, { FileMetadata } from "./FileComponent";

interface DisplayFile {
    file: File;
    progressPercentage: number; // From 0 to 1
    confirmed: boolean;
    error?: Error;
    id: string; // UUID
}

interface SelectedFilesProps {
    displayFiles: DisplayFile[];
    onDelete: (index: number) => void;
}

const ChatBoxContainer = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) 150px;
    column-gap: 20px;
    row-gap: 20px;

    box-shadow: 0 0 5px 2px rgba(0, 0, 0, 0.3);
    width: 600px;
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

const MessageContainer = styled.div`
    display: flex;
    align-items: flex-start;
    flex-direction: column;
`;

const FileChip = styled(Chip)`
    &::after {
        position: absolute;
        background-color: red;
        width: 50%;
        height: 20px;
    }
`;

const SelectedFilesContainer = styled.div`
    text-align: left;

    & > * {
        margin: 10px;
        max-width: 80%;
    }
`;

const SelectedFiles = (props: SelectedFilesProps): JSX.Element => {
    return (
        <SelectedFilesContainer>
            {props.displayFiles.map((displayFile: DisplayFile, index: number) => (
                <FileChip
                    avatar={<CircularProgress variant={"determinate"} value={displayFile.progressPercentage} />}
                    key={"DisplayFile" + index}
                    label={displayFile.file.name}
                    onDelete={() => props.onDelete(index)}
                />
            ))}
        </SelectedFilesContainer>
    );
};

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

    const addMessage = (message: Message) => {
        setMessages((currMessages: Message[]) => [...currMessages, message]);

        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    const handleConnect = () => {
        try {
            const newWsAdaper = new WebSocket(wsAddress);
            newWsAdaper.onopen = () => {
                addMessage(createMessage(`Connected to ${newWsAdaper.url}`));
                setIsConnected(true);
            };
            newWsAdaper.onerror = () => {
                addMessage(createMessage(`Unable to connect to ${newWsAdaper.url}`));
            };
            newWsAdaper.onmessage = (event: MessageEvent) => {
                if (typeof event.data !== "string") {
                    console.log(event.data);
                    return;
                }

                try {
                    const message: Message = JSON.parse(event.data);
                    addMessage(message);
                } catch (error) {
                    console.warn(error);
                }
            };
            setWsAdapter(newWsAdaper);
        } catch (e) {
            console.warn(e);
            addMessage(createMessage("Invalid server address"));
        }
    };

    const handleDisconnect = () => {
        const url = wsAdapter ? wsAdapter.url : "unknown";
        setWsAdapter(null);
        setIsConnected(false);
        addMessage(createMessage(`Disconnected from ${url}`));
    };

    const handleSend = async () => {
        if (!isConnected || !wsAdapter) {
            addMessage(createMessage("Unable to send message. Not connected to server."));
            return;
        }

        const message: Message = createMessage(chatBoxValue);

        for (let i = 0; i < displayFiles.length; ++i) {
            const file = displayFiles[i].file;

            const debounce = debouncer(1000);

            const onProgress = (progress: Progress) => {
                debounce(() =>
                    setDisplayFiles((curr: DisplayFile[]): DisplayFile[] => {
                        const next = [...curr]; // Shallow copy

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

            const url = await s3upload(`${displayFiles[i].id}/${file.name}`, file, onProgress, onError);

            if (displayFiles[i].error) {
                console.warn(`Error while uploading file: ${file.name}`);
                continue;
            }

            message.files.push({ filename: file.name, url, requiresAuth: true });
        }

        wsAdapter.send(JSON.stringify(message));
        setChatBoxValue("");
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
                selection.push({ file: input.files[i], progressPercentage: 0, confirmed: false, id: uuidv4() });
            }

            setDisplayFiles(selection);
        };
        input.click();
    };

    const handleUnselectFile = (index: number) => {
        setDisplayFiles((currDisplayFiles: DisplayFile[]) => {
            const newDisplayFiles = [...currDisplayFiles];

            newDisplayFiles.splice(index, 1);

            return newDisplayFiles;
        });
    };

    const Messages = () => (
        <>
            {messages.map((message: Message, index: number) => (
                <MessageContainer key={"message" + index}>
                    <Typography>
                        {formatDate(message.isoDate)}: {message.text}
                    </Typography>
                    <FileComponent files={message.files} id={index.toString()} />
                </MessageContainer>
            ))}
        </>
    );

    return (
        <ChatBoxContainer>
            <MessagesContainer>
                <Messages />
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
            <SelectedFiles displayFiles={displayFiles} onDelete={handleUnselectFile}></SelectedFiles>
            <Button variant={"contained"} onClick={handleSelectFile}>
                Test
            </Button>
        </ChatBoxContainer>
    );
};

export default ChatBox;
