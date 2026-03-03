-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StatusRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recruitId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "remark" TEXT NOT NULL DEFAULT '',
    "outOfCamp" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StatusRecord_recruitId_fkey" FOREIGN KEY ("recruitId") REFERENCES "Recruit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_StatusRecord" ("createdAt", "endDate", "id", "recruitId", "remark", "startDate", "type") SELECT "createdAt", "endDate", "id", "recruitId", "remark", "startDate", "type" FROM "StatusRecord";
DROP TABLE "StatusRecord";
ALTER TABLE "new_StatusRecord" RENAME TO "StatusRecord";
CREATE INDEX "StatusRecord_recruitId_idx" ON "StatusRecord"("recruitId");
CREATE INDEX "StatusRecord_startDate_endDate_idx" ON "StatusRecord"("startDate", "endDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
