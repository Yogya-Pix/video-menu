function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const corsOrigin = required("CORS_ORIGIN");

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  corsOrigin,
  webPublicUrl: process.env.WEB_PUBLIC_URL ?? corsOrigin,
  cookieCrossSite: process.env.COOKIE_CROSS_SITE === "true",

  awsRegion: process.env.AWS_REGION ?? "us-east-1",
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  s3BucketName: process.env.S3_BUCKET_NAME ?? "",
  cloudfrontDomain: process.env.CLOUDFRONT_DOMAIN ?? "",
};

export function assertS3Configured() {
  if (!env.s3BucketName || !env.cloudfrontDomain || !env.awsAccessKeyId) {
    throw new Error(
      "S3/CloudFront is not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME and CLOUDFRONT_DOMAIN in apps/api/.env"
    );
  }
}
