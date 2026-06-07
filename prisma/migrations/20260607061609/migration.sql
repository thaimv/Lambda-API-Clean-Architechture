-- CreateTable
CREATE TABLE "users" (
    "gigya_uuid" VARCHAR(32) NOT NULL,
    "user_nickname" TEXT NOT NULL,
    "cognito_id" VARCHAR(46),
    "create_datetime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "create_author" VARCHAR(32) NOT NULL,
    "update_datetime" TIMESTAMPTZ(6) NOT NULL,
    "update_author" VARCHAR(32) NOT NULL,
    "delete_datetime" TIMESTAMPTZ(6),
    "delete_author" VARCHAR(32),

    CONSTRAINT "user_information_pkc" PRIMARY KEY ("gigya_uuid")
);
