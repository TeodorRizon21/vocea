import { generateReactHelpers } from "@uploadthing/react";
import { UploadButton, UploadDropzone, Uploader } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();
export { UploadButton, UploadDropzone, Uploader };

