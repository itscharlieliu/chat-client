// import { S3Client } from "@aws-sdk/client-s3";

// const REGION = "us-west-1";
// const IDENTITY_POOL_ID = "us-west-1:b5cf5dd2-6da9-4ac9-8f6a-c09707f3d949";
// const BUCKET_NAME = "dropper-files";

// const s3upload = () => {
//     const s3client = new S3Client({ region: REGION });

//     return (fileBytes: ArrayBuffer) => {
//         const awsCommand = new AbortMultipartUploadCommand({
//             Bucket: BUCKET_NAME,
//             Key: "test",
//             UploadId: uuidv4(),
//         });

//         s3client.current.send(awsCommand);
//     };
// };

export {};
