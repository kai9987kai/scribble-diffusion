import packageData from "../package.json";
import { Configuration, UploadManager } from "upload-js-full";

const UPLOAD_IO_ACCOUNT_ID = "FW25b4F";
const UPLOAD_IO_PUBLIC_API_KEY = "public_FW25b4FAzSgqxpyPhtmMePN3hSFg";

export default async function uploadFile(scribbleDataURI) {
  if (!scribbleDataURI) {
    throw new Error("Draw something before generating an image.");
  }

  const uploadManager = new UploadManager(
    new Configuration({
      apiKey: UPLOAD_IO_PUBLIC_API_KEY,
    })
  );
  const scribbleBlob = await fetch(scribbleDataURI).then((response) =>
    response.blob()
  );

  const { fileUrl } = await uploadManager.upload({
    accountId: UPLOAD_IO_ACCOUNT_ID,
    data: scribbleBlob,
    mime: "image/png",
    originalFileName: "scribble_input.png",
    path: {
      // See path variables: https://upload.io/docs/path-variables
      folderPath: `/uploads/${packageData.name}/${packageData.version}/{UTC_DATE}`,
      fileName: "{ORIGINAL_FILE_NAME}_{UNIQUE_DIGITS_8}{ORIGINAL_FILE_EXT}",
    },
    metadata: {
      userAgent: navigator.userAgent,
    },
  });

  return fileUrl;
}
