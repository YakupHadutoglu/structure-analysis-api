import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { pipeline } from 'stream/promises';
import { createGunzip } from 'zlib';
import tar from 'tar';

//Configuration constants //* Yapılandırma sabitleri
const MAX_FILE_SIZE = 1024 * 1024 * 1024 * 2; // 2GB
const MAX_EXTRACTED_SIZE = 1024 * 1024 * 1024 * 5; // 5GB
const EXTRACTION_TIMEOUT = 120000;
const UPLOADS_ROOT_DIR_FILES = path.resolve(process.cwd(), 'src/uploads/files');

export const zipParser = async (file: Express.Multer.File): Promise<string> => {
    //1. File Size Control //* 1. Dosya boyutu kontrolü
    const stats = fs.statSync(file.path);
    if (stats.size > MAX_FILE_SIZE) {
        throw new Error(`ZIP dosyası çok büyük (${formatBytes(stats.size)}). Maksimum izin verilen: ${formatBytes(MAX_FILE_SIZE)}`);
    }

    //2. Calculate file hash (security and integrity control) //* 2. Dosya hash'ini hesapla (güvenlik ve bütünlük kontrolü)
    const fileHash = await calculateFileHash(file.path);
    console.log(`[ZIP] Dosya hash: ${fileHash} - ${file.originalname}`);

    //3. Create a unique sticker directory //* 3. Benzersiz çıkartma dizini oluştur
    const uniqueSuffix = `${Date.now()}-${uuidv4().slice(0, 8)}`;
    const baseName = path.parse(file.originalname).name.replace(/[^a-z0-9]/gi, '_');
    const targetDir = path.join(UPLOADS_ROOT_DIR_FILES, `${baseName}-${uniqueSuffix}`);

    try {
        // 4. Preparation of the directory//* 4. Dizin hazırlığı
        fs.mkdirSync(targetDir, { recursive: true });
        console.log(`[ZIP] Çıkartma dizini oluşturuldu: ${targetDir}`);

        //5. Set File Type (ZIP or TAR.GZ) //* 5. Dosya tipini belirle (ZIP veya TAR.GZ)
        const isGzip = file.originalname.endsWith('.tar.gz') ||
            file.originalname.endsWith('.tgz') ||
            (file.mimetype.includes('gzip') && !file.mimetype.includes('zip'));

        if (isGzip) {
            //6. Work Tar.gz files //* 6. TAR.GZ dosyalarını işle
            console.log(`[ZIP] TAR.GZ formatı algılandı, alternatif çıkartma kullanılıyor`);
            await extractTarGz(file.path, targetDir);
        } else {
            // 7. Standard jumping //* 7. Standart ZIP çıkartma
            console.log(`[ZIP] ZIP çıkartma başlıyor: ${file.path}`);
            const zip = new AdmZip(file.path);
            zip.extractAllTo(targetDir, true);
        }

        console.log(`[ZIP] Başarıyla çıkartıldı: ${file.path} -> ${targetDir}`);

        // 8. Extracted content verification //* 8. Çıkartılan içerik doğrulama
        validateExtractedContent(targetDir);

        return targetDir;
    } catch (error) {
        console.error(`[ZIP HATA] Çıkartma hatası: ${file.path}`, error);

        //9. Cleaning: Delete the temporary directory in case of error //* 9. Temizlik: Hata durumunda geçici dizini sil
        if (fs.existsSync(targetDir)) {
            fs.rmSync(targetDir, { recursive: true, force: true });
            console.log(`[TEMİZLİK] Hatalı çıkartma dizini silindi: ${targetDir}`);
        }

        throw new Error(`ZIP çıkartma hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    } finally {
        //10. Delete the original file //* 10. Orijinal dosyayı sil
        try {
            fs.unlinkSync(file.path);
            console.log(`[TEMİZLİK] Orijinal dosya silindi: ${file.path}`);
        } catch (cleanupError) {
            console.error(`[TEMİZLİK HATA] ${file.path} silinemedi:`, cleanupError);
        }
    }
};

async function extractTarGz(filePath: string, targetDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => {
            timeoutController.abort(new Error('TAR.GZ çıkartma işlemi zaman aşımına uğradı'));
        }, EXTRACTION_TIMEOUT);

        try {
            fs.createReadStream(filePath)
                .pipe(createGunzip())
                .pipe(tar.x({
                    C: targetDir,
                    strip: 1,
                    filter: (path) => {
                        if (path.includes('..') || path.startsWith('/')) {
                            console.warn(`[GÜVENLİK] Geçersiz dosya yolu engellendi: ${path}`);
                            return false;
                        }
                        return true;
                    }
                }))
                .on('finish', () => {
                    clearTimeout(timeoutId);
                    resolve();
                })
                .on('error', reject);
        } catch (error) {
            clearTimeout(timeoutId);
            reject(error);
        }
    });
}

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
        ['.exe', '.sh', '.bat', '.cmd', '.bin', '.dll'].includes(path.extname(file).toLowerCase())
    );

    if (dangerousFiles.length > 0) {
        console.warn(`[GÜVENLİK UYARI] Tehlikeli dosya türleri tespit edildi: ${dangerousFiles.join(', ')}`);
    }

    //Maximum decal size control //* Maksimum çıkartma boyutu kontrolü
    const totalSize = calculateDirSize(dirPath);
    if (totalSize > MAX_EXTRACTED_SIZE) {
        throw new Error(`Çıkartılan içerik çok büyük (${formatBytes(totalSize)}). Maksimum izin verilen: ${formatBytes(MAX_EXTRACTED_SIZE)}`);
    }
}

function calculateDirSize(dirPath: string): number {
    const files = fs.readdirSync(dirPath);
    let totalSize = 0;

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            totalSize += calculateDirSize(filePath);
        } else {
            totalSize += stats.size;
        }
    }

    return totalSize;
}
