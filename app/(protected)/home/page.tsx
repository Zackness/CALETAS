import { getDashboardCourses } from "@/actions/get-dashboard-courses";
import { auth } from "@/auth";
import { CoursesList } from "@/components/courses-list";
import { FaRegClock } from "react-icons/fa6";
import { FaRegCheckCircle } from "react-icons/fa";
import { redirect } from "next/navigation";
import { InfoCard } from "../creator/_components/info-card";

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect("/");
  }

  const { completedCourses, coursesInProgress } = await getDashboardCourses(session.user.id);

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
          <InfoCard
            label="Cursos en progreso"
            numberOfItems={coursesInProgress.length}
          />
        </div>
        <div className="bg-fm-blue-3 p-3 rounded-xl w-full flex items-center gap-x-2">
          <div className='flex w-150'>
            <div className="bg-fm-green rounded-full py-3 px-3">
              <FaRegCheckCircle />
            </div>
          </div>
          <InfoCard
            label="Cursos completados"
            numberOfItems={completedCourses.length}
          />
        </div>
      </div>
      <CoursesList
        items={[...coursesInProgress, ...completedCourses]}
      />
    </div>
  );
}