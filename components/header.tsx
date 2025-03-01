"use client";

import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
import { Button } from './ui/button';
import { useSession } from 'next-auth/react';
import Link from "next/link";
import { UserButton } from './auth/user-button';

export const Header = () => {

    const { data: session } = useSession();
    
    return (
        <header className="flex flex-row w-full 
                        lg:justify-center lg:items-center lg:content-center lg:mx-11 px-2 sticky top-4
                        md:rounded-full">

                        <input
                        type="text"
                        placeholder="Buscar..."
                        className="lg:block hidden w-full py-2 pl-10 pr-4 text-sm text-white bg-fm-blue-1 rounded-full focus:outline-none focus:ring-2 focus:ring-fm-green"
                        />

                        <div className='lg:hidden w-full pl-10 pr-4'>
                        </div>

                    <div className='mb-2 lg:ml-[300px]'>
                    {session ? (
                        <UserButton/>
                    ) : (
                        <Button asChild variant="outline4" className="px-4 py-2 mt-4 ml-[-10px]">
                        <Link href="/auth/login">Entrar</Link>
                        </Button>
                    )}
                    </div>

        </header>
    );
};