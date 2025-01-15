/*
  Warnings:

  - Added the required column `precio` to the `ListaPrecio` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ListaPrecio" ADD COLUMN     "precio" DECIMAL(10,2) NOT NULL;
