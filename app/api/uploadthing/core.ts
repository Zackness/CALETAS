import { auth } from "@/lib/auth";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

const handleAuth = async () => {
    const session = await auth(); // Asegúrate de obtener la sesión de forma asíncrona

    if (!session?.user?.id) {
        throw new UploadThingError("No tienes autorización"); // Lanzar el error específico de UploadThing
    }

    return { userId: session.user.id };
}

export const ourFileRouter = {
    courseImage: f({ image: { maxFileSize: "1MB", maxFileCount: 1 } })
        .middleware(() => handleAuth()) 
        .onUploadComplete(() => {}),

    courseAttachment: f(["text", "image", "video", "audio", "pdf"])
        .middleware(() => handleAuth()) 
        .onUploadComplete(() => {}),
        
    chapterVideo: f({ video: { maxFileSize: "512GB", maxFileCount: 1 } })
        .middleware(() => handleAuth()) 
        .onUploadComplete(() => {}),
        
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

