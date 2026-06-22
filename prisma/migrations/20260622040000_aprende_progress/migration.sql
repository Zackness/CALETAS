-- CreateTable
CREATE TABLE "aprende_pic18_progress" (
    "user_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aprende_pic18_progress_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "aprende_cpp_poo_progress" (
    "user_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aprende_cpp_poo_progress_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "aprende_pic18_progress_updated_at_idx" ON "aprende_pic18_progress"("updated_at");

-- CreateIndex
CREATE INDEX "aprende_cpp_poo_progress_updated_at_idx" ON "aprende_cpp_poo_progress"("updated_at");

-- AddForeignKey
ALTER TABLE "aprende_pic18_progress" ADD CONSTRAINT "aprende_pic18_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aprende_cpp_poo_progress" ADD CONSTRAINT "aprende_cpp_poo_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
