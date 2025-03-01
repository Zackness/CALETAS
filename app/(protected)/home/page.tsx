import { auth } from "@/auth";
import { FaRegClock } from "react-icons/fa6";
import { FaRegCheckCircle } from "react-icons/fa";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect("/");
  }


  return (
    <div className="lg:p-6 p-3 flex flex-col items-center">
      <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-r from-[#4cac27] to-[#EAD70E] text-white/0 bg-clip-text">
        Bienvenido {session.user.name}!
      </h1>
      <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 w-full gap-x-3 mb-7">
        <div className="bg-fm-blue-3 p-3 rounded-xl w-full flex items-center gap-x-2">
          <div className='flex w-150'>
            <div className="bg-fm-green rounded-full py-3 px-3">
              <FaRegClock />
            </div>
          </div>

        </div>
        <div className="bg-fm-blue-3 p-3 rounded-xl w-full flex items-center gap-x-2">
          <div className='flex w-150'>
            <div className="bg-fm-green rounded-full py-3 px-3">
              <FaRegCheckCircle />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}