-- CreateTable
CREATE TABLE "public"."Record" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "debt" DOUBLE PRECISION NOT NULL,
    "credit" DOUBLE PRECISION NOT NULL,
    "rawData" JSONB NOT NULL,

    CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Record_externalId_key" ON "public"."Record"("externalId");
