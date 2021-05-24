import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { S3Client } from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { Hash } from "@aws-sdk/hash-node";
import { Progress, Upload } from "@aws-sdk/lib-storage";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { parseUrl } from "@aws-sdk/url-parser";
import { formatUrl } from "@aws-sdk/util-format-url";

// TODO Get these values from env
const REGION = "us-west-1";
const IDENTITY_POOL_ID = "us-west-1:b5cf5dd2-6da9-4ac9-8f6a-c09707f3d949";
const BUCKET_NAME = "dropper-files";

const s3uploader = () => {
    const credentials = fromCognitoIdentityPool({
        client: new CognitoIdentityClient({
            region: REGION,
        }),
        identityPoolId: IDENTITY_POOL_ID,
    });

    const s3client = new S3Client({ region: REGION, credentials });

    return async (
        key: string,
        file: File,
        onProgress?: (progress: Progress) => void,
        onError?: (error: Error) => void,
    ): Promise<string> => {
        try {
            const parallelUpload = new Upload({
                client: s3client,
                params: {
                    Bucket: BUCKET_NAME,
                    Key: key,
                    Body: file,
                },
            });

            onProgress &&
                parallelUpload.on("httpUploadProgress", (progress: Progress) => {
                    onProgress(progress);
                });

            await parallelUpload.done();

            return `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
        } catch (e) {
            console.warn(e);
            onError && onError(e);
        }

        return "";
    };
};

const S3UrlSigner = () => {
    const credentials = fromCognitoIdentityPool({
        client: new CognitoIdentityClient({
            region: REGION,
        }),
        identityPoolId: IDENTITY_POOL_ID,
    });

    return async (url: string): Promise<string> => {
        const s3ObjectUrl = parseUrl(url);
        const presigner = new S3RequestPresigner({
            credentials,
            region: REGION,
            sha256: Hash.bind(null, "sha256"), // In Node.js
            //sha256: Sha256 // In browsers
        });
        // Create a GET request from S3 url.
        const signedUrl = await presigner.presign(new HttpRequest(s3ObjectUrl));
        return formatUrl(signedUrl);
    };
};

export const s3upload = s3uploader();
export const s3SignUrl = S3UrlSigner();
