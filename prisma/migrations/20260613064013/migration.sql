-- CreateTable
CREATE TABLE "users" (
    "cognito_sub" VARCHAR(36) NOT NULL,
    "user_nickname" TEXT NOT NULL,
    "cognito_id" VARCHAR(55),
    "create_datetime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "create_author" VARCHAR(36) NOT NULL,
    "update_datetime" TIMESTAMPTZ(6) NOT NULL,
    "update_author" VARCHAR(36) NOT NULL,
    "delete_datetime" TIMESTAMPTZ(6),
    "delete_author" VARCHAR(36),

    CONSTRAINT "user_information_pkc" PRIMARY KEY ("cognito_sub")
);
