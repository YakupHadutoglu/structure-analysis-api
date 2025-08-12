import * as fs from 'fs/promises';
import { Dirent } from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

/**
*Advanced File Tree Type
 *-Indexes: {[Name]: Filetree}
 *-Files: {[Name]: {Type: 'File', you: Number, Modified: Date}}
 *-Symbolic links: {[Name]: {type: 'symlink', target: string}}
 */
export type FileTree = {
    [key: string]: FileTree | FileMeta | SymlinkMeta;
};

type FileMeta = {
    type: 'file';
    size: number;
    modified: Date;
};

type SymlinkMeta = {
    type: 'symlink';
    target: string;
};

//Folders and patterns to be ignored //* Yoksayılacak klasörler ve pattern'ler
const EXCLUDED_PATTERNS = [
    'node_modules', '.git', 'logs', 'dist', 'build', 'temp', 'tmp',
    '.DS_Store', 'Thumbs.db', '*.log', '*.tmp', '*.bak'
];

//maximum depth limit //* Maksimum derinlik sınırı
const MAX_DEPTH = 20;
//Parallel transaction limit //* Paralel işlem sınırı
const CONCURRENCY_LIMIT = 50;

export const generateTree = async (dirPath: string, depth = 0): Promise<FileTree> => {
    // 1. Depth Limit Control //* 1. Derinlik sınırı kontrolü
    if (depth > MAX_DEPTH) {
        console.warn(`[TREE] Maximum derinlik aşıldı: ${dirPath}`);
        return {};
    }

    //2. The presence of directory and access control //* 2. Dizin varlığı ve erişim kontrolü
    try {
        const stats = await fs.stat(dirPath);
        if (!stats.isDirectory()) {
            return {
                [path.basename(dirPath)]: {
                    type: 'file',
                    size: stats.size,
                    modified: stats.mtime
                }
            };
        }
    } catch (error) {
        console.error(`[TREE] Erişim hatası: ${dirPath}`, error);
        return {};
    }

    const tree: FileTree = {};
    const processingQueue: Promise<void>[] = [];
    let activeProcesses = 0;

    //3. Reading the content of the directory //* 3. Dizin içeriğini okuma
    let entries;
    try {
        entries = await fs.readdir(dirPath, { withFileTypes: true });
    } catch (error) {
        console.error(`[TREE] Okuma hatası: ${dirPath}`, error);
        return tree;
    }

    //4. Auxiliary Function for Parallel Processing //* 4. Paralel işleme için yardımcı fonksiyon
    const processEntry = async (entry: Dirent) => {
        const entryPath = path.join(dirPath, entry.name);

        //5. Check exclusion rules //* 5. Dışlama kurallarını kontrol et
        if (isExcluded(entry.name)) return;

        try {
            //6. Symbolic link control //* 6. Sembolik link kontrolü
            if (entry.isSymbolicLink()) {
                const target = await fs.readlink(entryPath);
                tree[entry.name] = { type: 'symlink', target };
                return;
            }

            //7. Directory processing //* 7. Dizin işleme
            if (entry.isDirectory()) {
                const subTree = await generateTree(entryPath, depth + 1);
                tree[entry.name] = subTree;
                return;
            }

            //8. File Meta Data //* 8. Dosya meta verileri
            if (entry.isFile()) {
                const stats = await fs.stat(entryPath);
                tree[entry.name] = {
                    type: 'file',
                    size: stats.size,
                    modified: stats.mtime
                };
            }
        } catch (error) {
            console.warn(`[TREE] Giriş işlenemedi: ${entryPath}`, error);
        }
    };

    // 9. Controlled parallel processing //* 9. Kontrollü paralel işleme
    for (const entry of entries) {
        //Check the active transaction limit //* Aktif işlem sınırını kontrol et
        if (activeProcesses >= CONCURRENCY_LIMIT) {
            await Promise.race(processingQueue);
        }

        const processPromise = processEntry(entry).finally(() => {
            activeProcesses--;
            processingQueue.splice(processingQueue.indexOf(processPromise), 1);
        });

        processingQueue.push(processPromise);
        activeProcesses++;
    }

    //10. Wait for all transactions to be completed //* 10. Tüm işlemlerin tamamlanmasını bekle
    await Promise.all(processingQueue);
    return tree;
};

//File/Controls whether the name of the directory complies with the exclusion rules//*Dosya/dizin adının dışlama kurallarına uyup uymadığını kontrol eder
function isExcluded(name: string): boolean {
    return EXCLUDED_PATTERNS.some(pattern => {
        if (pattern.includes('*')) {
            const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
            return regex.test(name);
        }
        return pattern === name;
    });
}

//The file records the file in the file in JSON format (for debug) //* Dosya ağacını dosyaya JSON formatında kaydeder (debug için)
export const saveTreeToFile = async (tree: FileTree, outputPath: string) => {
    try {
        await fs.writeFile(outputPath, JSON.stringify(tree, null, 2));
        console.log(`[TREE] Ağaç yapısı kaydedildi: ${outputPath}`);
    } catch (error) {
        console.error(`[TREE] Kaydetme hatası: ${outputPath}`, error);
    }
};

//Performance Test Assistant //* Performans testi yardımcısı
export const benchmarkTreeGeneration = async (dirPath: string) => {
    const start = performance.now();
    const tree = await generateTree(dirPath);
    const duration = performance.now() - start;

    const fileCount = countFiles(tree);
    const dirCount = countDirectories(tree);

    console.log(`[BENCHMARK] Oluşturulan: ${fileCount} dosya, ${dirCount} klasör`);
    console.log(`[BENCHMARK] Süre: ${duration.toFixed(2)}ms`);
    console.log(`[BENCHMARK] Hız: ${(fileCount / (duration / 1000)).toFixed(2)} dosya/saniye`);

    return duration;
};

//Auxiliary Functions //* Yardımcı fonksiyonlar
function countFiles(tree: FileTree): number {
    return Object.values(tree).reduce((count, entry) => {
        if (typeof entry === 'object' && 'type' in entry) {
            return entry.type === 'file' ? count + 1 : count;
        }
        return count + countFiles(entry as FileTree);
    }, 0);
}

function countDirectories(tree: FileTree): number {
    return Object.values(tree).reduce((count, entry) => {
        if (typeof entry === 'object' && 'type' in entry) {
            return count;
        }
        return count + 1 + countDirectories(entry as FileTree);
    }, 0);
}
