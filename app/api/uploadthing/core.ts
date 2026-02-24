import { auth } from "@/lib/auth";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

const handleAuth = async (req: Request) => {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user?.id) {
    throw new UploadThingError("No tienes autorización"); // Lanzar el error específico de UploadThing
  }

  return { userId: session.user.id };
};

export const ourFileRouter = {
  Testigo1: f(["image", "pdf"])
    .middleware(async ({ req }) => handleAuth(req))
    .onUploadComplete(({ metadata }) => {
      console.log("Upload complete for Testigo1:", metadata);
    }),
  Testigo2: f(["image", "pdf"])
    .middleware(async ({ req }) => handleAuth(req))
    .onUploadComplete(({ metadata }) => {
      console.log("Upload complete for Testigo2:", metadata);
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;