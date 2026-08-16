import QRCode from "qrcode";
import { putObject, cdnUrlForKey } from "./s3";

export async function generateAndUploadQrCode(params: {
  restaurantId: string;
  targetUrl: string;
}): Promise<{ key: string; url: string }> {
  const buffer = await QRCode.toBuffer(params.targetUrl, {
    type: "png",
    width: 1024,
    margin: 2,
  });

  const key = `restaurants/${params.restaurantId}/qrcode-${Date.now()}.png`;
  await putObject({ key, body: buffer, contentType: "image/png" });

  return { key, url: cdnUrlForKey(key) };
}
