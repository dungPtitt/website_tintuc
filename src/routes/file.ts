import express, { Request, Response } from "express";
import { upload } from '@/utils/MulterConfig';
import { FileController } from "@/http/controllers/FileController";

const router = express.Router();

router.post('/upload', upload.single('file'), FileController.uploadFile);

export default router
