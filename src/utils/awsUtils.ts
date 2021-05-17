import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";

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

    return async (file: File) => {
        try {
            await s3client.send(
                new PutObjectCommand({
                    Body: file,
                    Bucket: BUCKET_NAME,
                    Key: "test",
                }),
            );
        } catch (e) {
            console.warn(e);
        }
    };
};

export const s3upload = s3uploader();
