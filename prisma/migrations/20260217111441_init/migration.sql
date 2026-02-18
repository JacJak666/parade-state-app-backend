-- CreateTable
CREATE TABLE "Recruit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platoon" INTEGER NOT NULL,
    "section" INTEGER NOT NULL,
    "bed" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "StatusRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recruitId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "remark" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StatusRecord_recruitId_fkey" FOREIGN KEY ("recruitId") REFERENCES "Recruit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "StatusRecord_recruitId_idx" ON "StatusRecord"("recruitId");

-- CreateIndex
CREATE INDEX "StatusRecord_startDate_endDate_idx" ON "StatusRecord"("startDate", "endDate");
