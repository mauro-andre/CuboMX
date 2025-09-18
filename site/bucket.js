import {
    S3Client,
    CreateBucketCommand,
    HeadBucketCommand,
    PutBucketPolicyCommand,
    ListObjectsV2Command,
    DeleteObjectsCommand,
    PutBucketWebsiteCommand
} from "@aws-sdk/client-s3";
import dotenv from 'dotenv';

// Load environment variables from .env file in the current directory
dotenv.config();

// --- S3 Client Configuration ---
const { 
    BUCKET_NAME, 
    BUCKET_ENDPOINT_URL, 
    BUCKET_ACCESS_KEY_ID, 
    BUCKET_SECRET_ACCESS_KEY 
} = process.env;

if (!BUCKET_NAME || !BUCKET_ENDPOINT_URL || !BUCKET_ACCESS_KEY_ID || !BUCKET_SECRET_ACCESS_KEY) {
    throw new Error("Missing required environment variables for bucket operations. Check site/.env file.");
}

const s3Client = new S3Client({
    region: "us-east-1", // A default region is required for AWS SDK v3
    endpoint: BUCKET_ENDPOINT_URL,
    credentials: {
        accessKeyId: BUCKET_ACCESS_KEY_ID,
        secretAccessKey: BUCKET_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true, // Crucial for Minio and other S3-compatibles
});

/**
 * Checks if a bucket exists and creates it as public if it does not.
 */
export async function createPublicBucketIfNotExists() {
    console.log(`Checking if bucket "${BUCKET_NAME}" exists...`);
    try {
        // HeadBucket is a lightweight way to check for bucket existence
        await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
        console.log(`Bucket "${BUCKET_NAME}" already exists.`);
    } catch (error) {
        // A 404 error (NotFound) means the bucket doesn't exist
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
            console.log(`Bucket "${BUCKET_NAME}" does not exist. Creating...`);
            try {
                // Create the bucket
                await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
                console.log(`Bucket "${BUCKET_NAME}" created successfully.`);

                // Define the public read policy
                const bucketPolicy = {
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Effect: "Allow",
                            Principal: "*",
                            Action: ["s3:GetObject"],
                            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
                        },
                    ],
                };

                // Apply the policy
                await s3Client.send(new PutBucketPolicyCommand({
                    Bucket: BUCKET_NAME,
                    Policy: JSON.stringify(bucketPolicy),
                }));
                console.log(`Bucket "${BUCKET_NAME}" is now public.`);

            } catch (createError) {
                console.error(`Error creating bucket:`, createError);
                throw createError;
            }
        } else {
            // Re-throw other errors (e.g., credentials error)
            console.error("Error checking for bucket:", error);
            throw error;
        }
    }
}

/**
 * Deletes all objects within the specified bucket.
 */
export async function emptyBucket() {
    console.log(`Starting to empty bucket "${BUCKET_NAME}"...`);
    try {
        let isTruncated = true;
        let continuationToken;

        while (isTruncated) {
            const listParams = {
                Bucket: BUCKET_NAME,
                ContinuationToken: continuationToken,
            };
            const listResponse = await s3Client.send(new ListObjectsV2Command(listParams));

            const { Contents, IsTruncated, NextContinuationToken } = listResponse;

            if (!Contents || Contents.length === 0) {
                console.log(`Bucket "${BUCKET_NAME}" is already empty.`);
                return;
            }

            const deleteParams = {
                Bucket: BUCKET_NAME,
                Delete: {
                    Objects: Contents.map(({ Key }) => ({ Key })),
                },
            };

            await s3Client.send(new DeleteObjectsCommand(deleteParams));
            console.log(`Deleted ${Contents.length} objects.`);

            isTruncated = IsTruncated;
            continuationToken = NextContinuationToken;
        }
        console.log(`Bucket "${BUCKET_NAME}" has been emptied successfully.`);
    } catch (error) {
        console.error(`Error emptying bucket:`, error);
        throw error;
    }
}

/**
 * Configures the bucket for static website hosting.
 */
export async function setBucketWebsiteConfig() {
    console.log(`Configuring bucket "${BUCKET_NAME}" for static website hosting...`);
    try {
        const websiteConfig = {
            IndexDocument: {
                Suffix: "index.html",
            },
        };

        await s3Client.send(new PutBucketWebsiteCommand({
            Bucket: BUCKET_NAME,
            WebsiteConfiguration: websiteConfig,
        }));

        console.log(`Bucket "${BUCKET_NAME}" configured successfully.`);
        console.log(`You should now be able to access the root via: ${BUCKET_ENDPOINT_URL}/${BUCKET_NAME}/`);
    } catch (error) {
        console.error(`Error configuring bucket website:`, error);
        throw error;
    }
}

// --- CLI Runner ---
// This part allows running functions from the command line.
const command = process.argv[2]; // The 3rd argument is our command

if (command === 'create') {
    createPublicBucketIfNotExists();
} else if (command === 'empty') {
    emptyBucket();
} else if (command === 'website') {
    setBucketWebsiteConfig();
}
