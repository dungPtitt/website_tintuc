import { upload } from "@/utils/MulterConfig";
import multer from "multer";

export class FileService {
    static async uploadFile(req: any) {
        return new Promise((resolve, reject) => {
            upload.single('file')(req, {} as any, function (err: any) {
                if (err instanceof multer.MulterError) {
                    reject(err);
                } else if (err) {
                    reject(err);
                } else if (!req.file) {
                    reject(new Error('No file uploaded'));
                } else {
                    const url = req.protocol + '://' + req.get('host') + '/public/uploads/' + req.file.filename;
                    resolve(url);
                }
            });
        });
    }
}