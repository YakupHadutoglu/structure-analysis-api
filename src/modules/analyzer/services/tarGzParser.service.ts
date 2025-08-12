import path from 'path';
import fs from 'fs';
import fsExtra from 'fs-extra';
import tar from 'tar';
import { v4 as uuidv4 } from 'uuid';
import { pipeline } from 'stream/promises';
import zlib from 'zlib';
import { createHash } from 'crypto';

//configuration constants //* Yapılandırma sabitleri
const MAX_FILE_SIZE = 1024 * 1024 * 1024 * 2; // 2GB
const EXTRACTION_TIMEOUT = 120000;
const UPLOADS_ROOT_DIR_FILES = path.resolve(process.cwd(), 'src/uploads/files');

export const tarGzParser = async (file: Express.Multer.File): Promise<string> => {
    //1. File Size Controls //* 1. Dosya boyutu kontrolleri
    const stats = fs.statSync(file.path);
    if (stats.size > MAX_FILE_SIZE) {
        throw new Error(`Dosya boyutu çok büyük (${formatBytes(stats.size)}). Maksimum izin verilen: ${formatBytes(MAX_FILE_SIZE)}`);
    }

    //2. Security: File Hash Control //* 2. Güvenlik: Dosya hash kontrolü
    const fileHash = await calculateFileHash(file.path);
    console.log(`[TAR.GZ] Dosya hash: ${fileHash} - ${file.originalname}`);

    //3. Create a unique sticker directory//* 3. Benzersiz çıkartma dizini oluştur
    const uniqueSuffix = `${Date.now()}-${uuidv4().slice(0, 8)}`;
    const targetDir = path.join(
        UPLOADS_ROOT_DIR_FILES,
        `${path.parse(file.originalname).name}-${uniqueSuffix}`
    );

    try {
        //4. Knee preparation //* 4. Dizin hazırlığı
        fsExtra.ensureDirSync(targetDir);
        console.log(`[TAR.GZ] Çıkartma dizini oluşturuldu: ${targetDir}`);

        //5. Flow -based separation //* 5. Akış tabanlı ayrıştırma
        const extractStream = tar.x({
            cwd: targetDir,
            preserveOwner: false,
            strip: 1, //Jump your root knee //* Kök dizini atla
            filter: (path) => {
                //Security: PATH Traverse Prevention //* Güvenlik: Path traversal önleme
                if (path.includes('..') || path.startsWith('/')) {
                    console.warn(`[GÜVENLİK] Geçersiz dosya yolu engellendi: ${path}`);
                    return false;
                }
                return true;
            }
        });

        //6. TIME EVENING AND ERROR MANAGEMENT //* 6. Zaman aşımı ve hata yönetimi
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => {
            timeoutController.abort(new Error('Çıkartma işlemi zaman aşımına uğradı'));
        }, EXTRACTION_TIMEOUT);

        try {
            await pipeline(
                fs.createReadStream(file.path),
                zlib.createGunzip(),
                extractStream,
                { signal: timeoutController.signal }
            );
        } finally {
            clearTimeout(timeoutId);
        }

        console.log(`[TAR.GZ] Başarıyla çıkartıldı: ${file.path} -> ${targetDir}`);

        //7. Extracted content verification//* 7. Çıkartılan içerik doğrulama
        validateExtractedContent(targetDir);

        return targetDir;
    } catch (error) {
        console.error(`[TAR.GZ HATA] Çıkartma hatası: ${file.path}`, error);

        //8. Cleaning: Delete the temporary directory in case of error //* 8. Temizlik: Hata durumunda geçici dizini sil
        if (fsExtra.existsSync(targetDir)) {
            fsExtra.removeSync(targetDir);
            console.log(`[TEMİZLİK] Hatalı çıkartma dizini silindi: ${targetDir}`);
        }

        throw new Error(`TAR.GZ çıkartma hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    } finally {
        // 9. Delete the original file //* 9. Orijinal dosyayı sil
        try {
            fsExtra.removeSync(file.path);
            console.log(`[TEMİZLİK] Orijinal dosya silindi: ${file.path}`);
        } catch (cleanupError) {
            console.error(`[TEMİZLİK HATA] ${file.path} silinemedi:`, cleanupError);
        }
    }
};

//Auxiliary Functions //* Yardımcı fonksiyonlar
function formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`;
}

async function calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = createHash('sha256');
        const stream = fs.createReadStream(filePath);

        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}

function validateExtractedContent(dirPath: string): void {
    const files = fs.readdirSync(dirPath);
    if (files.length === 0) {
        throw new Error('Çıkartılan dizin boş - Geçersiz arşiv');
    }

    //Check Dangerous File Types //* Tehlikeli dosya türlerini kontrol et
    const dangerousFiles = files.filter(file =>
        ['.exe', '.sh', '.bat', '.cmd', '.bin'].includes(path.extname(file).toLowerCase())
    );

    if (dangerousFiles.length > 0) {
        console.warn(`[GÜVENLİK UYARI] Tehlikeli dosya türleri tespit edildi: ${dangerousFiles.join(', ')}`);
    }
}
