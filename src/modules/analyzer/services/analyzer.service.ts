import { zipParser } from './zipParser.service';
import { fileStructureAnalysis, FileAnalysisResult } from './fileStructureAnalysis.service';
import { tarGzParser } from './tarGzParser.service';
import * as path from 'path';
import * as fs from 'fs-extra';
import { promisify } from 'util';
import { exec } from 'child_process';
import os from 'os';

const execAsync = promisify(exec);

// Supported Archive Types //* Desteklenen arşiv türleri
const SUPPORTED_ARCHIVES = {
    ZIP: ['application/zip', 'application/x-zip-compressed'],
    TAR_GZ: ['application/x-gzip', 'application/x-tar', 'application/x-compressed', 'application/gzip'],
    RAR: ['application/x-rar-compressed', 'application/vnd.rar'],
    SEVEN_ZIP: ['application/x-7z-compressed']
};

/**
 * Enhanced file analysis service
 * * Geliştirilmiş dosya analiz servisi
 */
export const analyze = async (file: Express.Multer.File): Promise<FileAnalysisResult> => {
    // 1. Geçici çalışma dizini oluştur //* 1. Geçici çalışma dizini oluştur
    const tempDir = await createTempDir();

    try {
        // 2. Set File Type and Select Appropriate Parser //* 2. Dosya tipini belirle ve uygun parser'ı seç
        const fileType = detectFileType(file);
        console.log(`[Analyzer] Detected file type: ${fileType} for ${file.originalname}`);

        //Work the file 3 //* 3. Dosyayı işle
        let extractedPath: string;

        switch(fileType) {
            case 'ZIP':
                extractedPath = await processZip(file, tempDir);
                break;
            case 'TAR_GZ':
                extractedPath = await processTarGz(file, tempDir);
                break;
            case 'RAR':
                extractedPath = await processRar(file, tempDir);
                break;
            case 'SEVEN_ZIP':
                extractedPath = await process7Zip(file, tempDir);
                break;
            default:
                return await processRegularFile(file, tempDir);
        }

        // 4. Analyze the extracted content //* 4. Çıkarılan içeriği analiz et
        const analysisResult = await analyzeExtractedContent(extractedPath, fileType);

        // 5. Clean temporary files //* 5. Geçici dosyaları temizle
        await cleanupTempDir(tempDir);

        return analysisResult;

    } catch (error) {
        if (error instanceof Error) {
            handleAnalysisError(error, file);
            throw error;
        } else {
            const err = new Error(typeof error === 'string' ? error : 'Unknown error');
            handleAnalysisError(err, file);
            throw err;
        }
    }
};

// Determine File Type //* Dosya tipini tespit eder
const detectFileType = (file: Express.Multer.File): string => {
    //Detection by MIME type //* MIME tipine göre tespit
    if (SUPPORTED_ARCHIVES.ZIP.includes(file.mimetype)) return 'ZIP';
    if (SUPPORTED_ARCHIVES.TAR_GZ.includes(file.mimetype)) return 'TAR_GZ';
    if (SUPPORTED_ARCHIVES.RAR.includes(file.mimetype)) return 'RAR';
    if (SUPPORTED_ARCHIVES.SEVEN_ZIP.includes(file.mimetype)) return 'SEVEN_ZIP';

    //Fallback detection by extension //* Uzantıya göre fallback tespit
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.rar') return 'RAR';
    if (ext === '.7z') return 'SEVEN_ZIP';

    return 'REGULAR';
};

//Jumping files //* ZIP dosyalarını işler
const processZip = async (file: Express.Multer.File, tempDir: string): Promise<string> => {
    console.log(`[ZIP Processor] Extracting: ${file.originalname}`);
    const extractedPath = await zipParser(file);
    console.log(`[ZIP Processor] Extracted to: ${extractedPath}`);
    return extractedPath;
};

// Tar.gz files work//* TAR.GZ dosyalarını işler
const processTarGz = async (file: Express.Multer.File, tempDir: string): Promise<string> => {
    console.log(`[TAR.GZ Processor] Extracting: ${file.originalname}`);
    const extractedPath = await tarGzParser(file);
    console.log(`[TAR.GZ Processor] Extracted to: ${extractedPath}`);
    return extractedPath;
};

// Jobs Rar files (new feature) //* RAR dosyalarını işler (yeni özellik)
const processRar = async (file: Express.Multer.File, tempDir: string): Promise<string> => {
    console.log(`[RAR Processor] Extracting: ${file.originalname}`);

    // Rar subtraction command //* RAR çıkarma komutu
    const outputDir = path.join(tempDir, 'rar_extracted');
    await fs.ensureDir(outputDir);

    try {
        //UNRAr use (must be installed in the system) //* unrar kullanımı (sistemde kurulu olmalı)
        await execAsync(`unrar x "${file.path}" "${outputDir}"`);
        console.log(`[RAR Processor] Successfully extracted to: ${outputDir}`);
        return outputDir;
    } catch (error) {
        console.error(`[RAR Processor] Extraction failed:`, error);
        throw new Error(`RAR extraction failed for ${file.originalname}`);
    }
};

// 7-Jobs the zip files //* 7-Zip dosyalarını işler
const process7Zip = async (file: Express.Multer.File, tempDir: string): Promise<string> => {
    console.log(`[7-Zip Processor] Extracting: ${file.originalname}`);

    // 7z subtraction command //* 7z çıkarma komutu
    const outputDir = path.join(tempDir, '7z_extracted');
    await fs.ensureDir(outputDir);

    try {
        // 7z use (must be installed in the system) //* 7z kullanımı (sistemde kurulu olmalı)
        await execAsync(`7z x "${file.path}" -o"${outputDir}"`);
        console.log(`[7-Zip Processor] Successfully extracted to: ${outputDir}`);
        return outputDir;
    } catch (error) {
        console.error(`[7-Zip Processor] Extraction failed:`, error);
        throw new Error(`7-Zip extraction failed for ${file.originalname}`);
    }
};

//works of normal frıends //* Normal dosyaları işler
const processRegularFile = async (file: Express.Multer.File, tempDir: string): Promise<FileAnalysisResult> => {
    console.log(`[Regular File Processor] Analyzing: ${file.originalname}`);

    //Copy the file to the temporary directory //* Dosyayı geçici dizine kopyala
    const tempFilePath = path.join(tempDir, file.originalname);
    await fs.copy(file.path, tempFilePath);

    // Make Analysis //* Analizi yap
    const result = await fileStructureAnalysis({
        ...file,
        path: tempFilePath
    });

    console.log('[Regular File Processor] Analysis completed');
    return result;
};

// Analysis //* Çıkarılan içeriği analiz eder
const analyzeExtractedContent = async (extractedPath: string, fileType: string): Promise<FileAnalysisResult> => {
    console.log(`[Content Analyzer] Analyzing extracted content at: ${extractedPath}`);

    const stats = await fs.stat(extractedPath);
    if (!stats.isDirectory()) {
        throw new Error(`Extracted path is not a directory: ${extractedPath}`);
    }

    const result = await fileStructureAnalysis(extractedPath);

    console.log(`[Content Analyzer] ${fileType} analysis completed successfully`);
    return result;
};

//Creates a temporary directory //* Geçici dizin oluşturur
const createTempDir = async (): Promise<string> => {
    const tempDir = path.join(os.tmpdir(), `file-analyzer-${Date.now()}`);
    await fs.ensureDir(tempDir);
    console.log(`[Temp Manager] Temporary directory created: ${tempDir}`);
    return tempDir;
};

//Cleans the temporary knee //* Geçici dizini temizler
const cleanupTempDir = async (tempDir: string): Promise<void> => {
    try {
        await fs.remove(tempDir);
        console.log(`[Temp Manager] Temporary directory cleaned: ${tempDir}`);
    } catch (error) {
        if (error instanceof Error) {
            console.warn(`[Temp Manager] Failed to clean temp directory: ${error.message}`);
        }
    }
};

//Direct errors //* Hataları yönetir
const handleAnalysisError = (error: Error, file: Express.Multer.File): void => {
    const errorInfo = {
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        error: error.message,
        stack: error.stack
    };

    console.error('[Error Handler] Analysis failed:', errorInfo);

    logErrorToFile(errorInfo);
};

const logErrorToFile = (errorInfo: Record<string, any>): void => {
    const logPath = path.join(__dirname, '../../logs/analysis_errors.log');
    const logEntry = `${new Date().toISOString()} - ${JSON.stringify(errorInfo)}\n`;

    fs.appendFile(logPath, logEntry, (err) => {
        if (err) console.error('[Logger] Failed to write error log:', err);
    });
};

// Additional security measures //* Ek güvenlik önlemleri
const validateFilePath = (filePath: string): void => {
    //Protection against directory transition attacks //* Dizin geçiş saldırılarına karşı koruma
    if (filePath.includes('../') || filePath.includes('..\\')) {
        throw new Error('Invalid file path: directory traversal detected');
    }

    // Maximum road length //* Maksimum yol uzunluğu
    if (filePath.length > 4096) {
        throw new Error('File path exceeds maximum allowed length');
    }
};
