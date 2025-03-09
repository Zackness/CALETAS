import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { createRouteHandler } from 'uploadthing/next';
import { getSession } from 'next-auth/react'; // Importar la función de autenticación

const f = createUploadthing();

const handleAuth = async (req: any) => {
  const session = await getSession(req);

  if (!session || !session.user) {
    throw new Error('No tienes autorización');
  }

  return { userId: session.user.id };
};

const ourFileRouter = {
  Testigo2: f(['image', 'pdf'])
    .middleware((req) => handleAuth(req))
    .onUploadComplete(({ metadata }) => {
      console.log('Upload complete for Testigo2:', metadata);
    }),
} satisfies FileRouter;

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});