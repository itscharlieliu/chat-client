import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { s3SignUrl } from "../../utils/awsUtils";

export interface FileMetadata {
    filename: string;
    url: string;
    requiresAuth?: boolean;
}

interface FileComponentProps {
    files: FileMetadata[];
    id: string;
}

const FilesContainer = styled.div`
    text-align: left;

    & > * {
        margin: 10px;
    }
`;

const FileComponent = (props: FileComponentProps): JSX.Element => {
    const [signedUrls, setSignedUrls] = useState<string[]>([]);

    useEffect(() => {
        (async () => {
            const urls = [];
            for (const file of props.files) {
                urls.push(await s3SignUrl(file.url));
            }
            setSignedUrls(urls);
        })();
    }, [props.files]);

    return (
        <FilesContainer>
            {props.files.map((file: FileMetadata, fileIndex: number) => (
                <a key={"message" + props.id + "file" + fileIndex} href={signedUrls[fileIndex]}>
                    {file.filename}
                </a>
            ))}
        </FilesContainer>
    );
};

export default FileComponent;
