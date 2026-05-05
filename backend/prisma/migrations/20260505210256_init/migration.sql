-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('admin', 'gestor', 'colaborador');

-- CreateEnum
CREATE TYPE "TipoAvaliacao" AS ENUM ('gestor_para_colaborador', 'colaborador_para_gestor', 'avaliacao_360', 'avaliacao_180');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "ra" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "tipo" "UserType" NOT NULL,
    "foto" TEXT,
    "cargo" TEXT,
    "departamento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL,
    "tipoAvaliacao" "TipoAvaliacao" NOT NULL,
    "avaliadorId" TEXT NOT NULL,
    "avaliadoId" TEXT NOT NULL,
    "criterios" JSONB NOT NULL,
    "media" DOUBLE PRECISION,
    "comentario" TEXT,
    "anonima" BOOLEAN NOT NULL DEFAULT true,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nine_box" (
    "id" TEXT NOT NULL,
    "pessoaId" TEXT NOT NULL,
    "performance" INTEGER NOT NULL,
    "potential" INTEGER NOT NULL,
    "categoria" TEXT NOT NULL,
    "comentario" TEXT,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nine_box_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competencies" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "competenciaDe" TEXT NOT NULL,
    "criterios" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_ra_key" ON "users"("ra");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_ra_idx" ON "users"("ra");

-- CreateIndex
CREATE INDEX "evaluations_avaliadoId_idx" ON "evaluations"("avaliadoId");

-- CreateIndex
CREATE INDEX "evaluations_avaliadorId_idx" ON "evaluations"("avaliadorId");

-- CreateIndex
CREATE INDEX "evaluations_data_idx" ON "evaluations"("data");

-- CreateIndex
CREATE INDEX "evaluations_tipoAvaliacao_idx" ON "evaluations"("tipoAvaliacao");

-- CreateIndex
CREATE INDEX "evaluations_anonima_idx" ON "evaluations"("anonima");

-- CreateIndex
CREATE INDEX "nine_box_pessoaId_idx" ON "nine_box"("pessoaId");

-- CreateIndex
CREATE INDEX "nine_box_data_idx" ON "nine_box"("data");

-- CreateIndex
CREATE INDEX "competencies_tipo_idx" ON "competencies"("tipo");

-- CreateIndex
CREATE INDEX "competencies_competenciaDe_idx" ON "competencies"("competenciaDe");

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_avaliadorId_fkey" FOREIGN KEY ("avaliadorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_avaliadoId_fkey" FOREIGN KEY ("avaliadoId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nine_box" ADD CONSTRAINT "nine_box_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
