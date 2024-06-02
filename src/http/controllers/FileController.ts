import { ResponseUtil } from "@/utils/Response"
import { FileService } from "../services/FileService"
import { File } from "@/database/entities/File";
import { AppDataSource } from "@/database/data-source";
export class FileController {
    static async uploadFile(req: any, res: any) {
        try {
            const url = await FileService.uploadFile(req);

            if (!req.file || typeof req.file.originalname !== 'string') {
                throw new Error('Invalid file data');
            }

            // Tạo một bản ghi mới của entity File
            const fileRepository = AppDataSource.getRepository(File);
            const newFile = new File();
            newFile.filename = req.file.originalname;
            newFile.filetype = req.file.mimetype as string;
            newFile.user = req?.user;
            // Kiểm tra đường dẫn có tồn tại và có phải kiểu string không
            if (typeof url !== 'string') {
                throw new Error('Invalid file path');
            }
            newFile.filepath = url;

            // Lưu bản ghi mới vào cơ sở dữ liệu
            await fileRepository.save(newFile);

            // Trả về phản hồi
            return ResponseUtil.sendResponse(res, "Upload file thành công", { filePath: url.replace('/public', '') }, null);
        } catch (error: any) {
            console.error('Error uploading file:', error);
            return ResponseUtil.sendResponse(res, "Lỗi khi upload file", null, error.message);
        }
    }
}
