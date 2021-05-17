import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { CreateMultipartUploadCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { Button, TextField } from "@material-ui/core";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import styled from "styled-components";

const REGION = "us-west-1";
const IDENTITY_POOL_ID = "us-west-1:b5cf5dd2-6da9-4ac9-8f6a-c09707f3d949";
const BUCKET_NAME = "dropper-files";

interface Message {
    data: string;
    timestamp: string;
}

const displayFiles = (files: FileList): string => {
    if (!files) {
        return "";
    }

    let result = "";
    for (let i = 0; i < files.length; ++i) {
        result += files[i].name;
    }
    return result;
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
    const [files, setFiles] = useState<FileList | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const credentials = useRef(
        fromCognitoIdentityPool({
            client: new CognitoIdentityClient({
                region: REGION,
            }),
            identityPoolId: IDENTITY_POOL_ID,
        }),
    );
    const s3client = useRef(new S3Client({ region: REGION, credentials: credentials.current }));

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

        if (files !== null) {
            for (let i = 0; i < files.length; ++i) {
                const file = files[i];
                console.log(file);
                // TODO Upload to s3 and send the link via websocket

                // const uploadId = await s3client.current.send(
                //     new PutObjectCommand({
                //         Body:
                //         Bucket: BUCKET_NAME,
                //         Key: "test-title.txt",
                //     }),
                // );

                // console.log(uploadId);
            }
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

            setFiles(input.files);
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
            <TextField value={files ? displayFiles(files) : ""} />
            <Button variant={"contained"} onClick={handleSelectFile}>
                Test
            </Button>
        </ChatBoxContainer>
    );
};

export default ChatBox;
