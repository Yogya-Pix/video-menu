import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env, assertS3Configured } from "./env";

export const s3Client = new S3Client({
  region: env.awsRegion,
  credentials: env.awsAccessKeyId
    ? {
        accessKeyId: env.awsAccessKeyId,
        secretAccessKey: env.awsSecretAccessKey,
      }
    : undefined,
});

const PRESIGN_EXPIRY_SECONDS = 5 * 60;

export async function createPresignedUploadUrl(params: {
  key: string;
  contentType: string;
}): Promise<{ uploadUrl: string; key: string }> {
  assertS3Configured();

  const command = new PutObjectCommand({
    Bucket: env.s3BucketName,
    Key: params.key,
    ContentType: params.contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: PRESIGN_EXPIRY_SECONDS,
  });

  return { uploadUrl, key: params.key };
}

export async function putObject(params: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<void> {
  assertS3Configured();

  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.s3BucketName,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    })
  );
}

export async function deleteObject(key: string): Promise<void> {
  assertS3Configured();

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: env.s3BucketName,
      Key: key,
    })
  );
}

export function cdnUrlForKey(key: string): string {
  return `https://${env.cloudfrontDomain}/${key}`;
}
