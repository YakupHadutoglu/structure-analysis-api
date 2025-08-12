import { zipParser } from './zipParser.service';
import { tarGzParser } from './tarGzParser.service';
import path from 'path';
import { detectArchitecture } from './arthitectureDetector.service';
import { generateTree } from './treeGenerator.service';
import { analyzeComplexity } from './analyzeComplexity.service';
import { checkNaming , NamingCheckResult } from '../helpers/namingChecker';
import { suggestImprovements } from '../helpers/improvementSuggester';
import { analyzeDependencies, DependencyReport } from './dependencyAnalyzer.service';
import { FileTree, ArchitectureGuess } from '../types/analyzer';
import { ComplexityReport } from './analyzeComplexity.service';
import { performance } from 'perf_hooks';
import fs from 'fs-extra';

/**
 * Defines the comprehensive results of the file analysis.
 * * Dosya analizinin kapsamlı sonuçlarını tanımlar.
 */
export interface FileAnalysisResult {
    architecture: ArchitectureGuess;
    fileTree: FileTree;
    complexityReport: ComplexityReport;
    namingProblems: NamingCheckResult;
    suggestions: string[];
    dependencyReport: DependencyReport;
    performanceMetrics: {
        totalTime: number;
        steps: Record<string, number>;
    };
}

console.log('[ANALYSIS] Performing naming checks...');

export const fileStructureAnalysis = async (input: string | Express.Multer.File): Promise<FileAnalysisResult> => {
    const startTime = performance.now();
    const metrics: Record<string, number> = {};
    let stepStart: number;
    let tempDirs: string[] = [];

    try {
        let projectPath: string;
        let fileName: string | undefined;

        //1. Set the type of input and set the project path //* 1. Girdi türünü belirle ve proje yolunu ayarla
        stepStart = performance.now();
        if (typeof input === 'string') {
            projectPath = input;
            fileName = path.basename(input);
            console.log(`[ANALYSIS] Direct directory path detected: ${projectPath}`);
        } else {
            fileName = input.originalname;
            console.log(`[ANALYSIS] File detected: ${fileName}`);

            //Expanded MIME type control//* Genişletilmiş MIME tipi kontrolü
            const archiveTypes = {
                zip: ['application/zip', 'application/x-zip-compressed'],
                tar: ['application/x-tar'],
                gz: ['application/gzip', 'application/x-gzip'],
                rar: ['application/vnd.rar', 'application/x-rar-compressed']
            };

            if (archiveTypes.zip.includes(input.mimetype)) {
                console.log(`[ANALYSIS] Extracting ZIP file: ${fileName}`);
                projectPath = await zipParser(input);
                tempDirs.push(projectPath);
            }
            else if (archiveTypes.tar.includes(input.mimetype) || archiveTypes.gz.includes(input.mimetype)) {
                console.log(`[ANALYSIS] Extracting TAR.GZ file: ${fileName}`);
                projectPath = await tarGzParser(input);
                tempDirs.push(projectPath);
            }
            else {
                projectPath = path.dirname(input.path);
                console.log(`[ANALYSIS] Non-archive file. Analysis folder: ${projectPath}`);
            }
        }

        if (!projectPath || !fs.existsSync(projectPath)) {
            throw new Error("Project path could not be determined or does not exist");
        }

        metrics.inputProcessing = performance.now() - stepStart;

        //2. Create File Tree //* 2. Dosya ağacı oluştur
        stepStart = performance.now();
        console.log('[ANALYSIS] Generating file tree...');
        const fileTree = await generateTree(projectPath);
        console.log('[ANALYSIS] File tree successfully generated.');
        metrics.treeGeneration = performance.now() - stepStart;

        //3. Architectural Analysis //* 3. Mimari analizi
        stepStart = performance.now();
        console.log('[ANALYSIS] Starting architecture analysis...');
        const architecture = detectArchitecture(fileTree);
        console.log(`[ANALYSIS] Architecture analysis completed. Type: ${architecture.type}`);
        metrics.architectureAnalysis = performance.now() - stepStart;

        //4. complexity analysis //* 4. Karmaşıklık analizi
        stepStart = performance.now();
        console.log('[ANALYSIS] Starting complexity analysis...');
        const complexityReport = analyzeComplexity(fileTree);
        console.log(`[ANALYSIS] Complexity analysis completed. Score: ${complexityReport.complexityScore}`);
        metrics.complexityAnalysis = performance.now() - stepStart;

        //5. Addiction Analysis //* 5. Bağımlılık analizi
        stepStart = performance.now();
        console.log('[ANALYSIS] Starting dependency analysis...');
        const dependencyReport = await analyzeDependencies(projectPath);
        console.log('[ANALYSIS] Dependency analysis completed.');
        metrics.dependencyAnalysis = performance.now() - stepStart;

        //6. NAME PROBLEMS //* 6. İsimlendirme problemleri
        stepStart = performance.now();
        console.log('[ANALYSIS] Performing naming checks...');
        const namingProblems:FileAnalysisResult['namingProblems'] = checkNaming(fileTree);
        console.log(`[ANALYSIS] Found ${namingProblems.errors.length} naming problems.`);
        metrics.namingCheck = performance.now() - stepStart;

        //7. Improvement Suggestions //* 7. İyileştirme önerileri
        stepStart = performance.now();
        console.log('[ANALYSIS] Generating improvement suggestions...');
        const suggestions = suggestImprovements(fileTree, complexityReport, namingProblems.errors);
        console.log(`[ANALYSIS] ${suggestions.length} suggestions created.`);
        metrics.suggestionGeneration = performance.now() - stepStart;

        //8. Calculate performance metrics //* 8. Performans metriklerini hesapla
        const totalTime = performance.now() - startTime;

        return {
            architecture,
            fileTree,
            complexityReport,
            namingProblems,
            suggestions,
            dependencyReport,
            performanceMetrics: {
                totalTime,
                steps: metrics
            } as FileAnalysisResult['performanceMetrics']
        };

    } catch (error) {
        console.error('[ANALYSIS ERROR] Process failed:', error);

        //Clean temporary files //* Geçici dosyaları temizle
        tempDirs.forEach(dir => {
            try {
                fs.removeSync(dir);
                console.log(`[CLEANUP] Removed temp directory: ${dir}`);
            } catch (cleanupError) {
                console.error('[CLEANUP ERROR] Failed to remove temp directory:', cleanupError);
            }
        });

        throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
        //Release resources //* Kaynakları serbest bırak
        if (typeof input !== 'string' && 'path' in input) {
            try {
                await fs.remove(input.path);
                console.log(`[CLEANUP] Removed uploaded file: ${input.path}`);
            } catch (cleanupError) {
                console.error('[CLEANUP ERROR] Failed to remove uploaded file:', cleanupError);
            }
        }
    }
};
