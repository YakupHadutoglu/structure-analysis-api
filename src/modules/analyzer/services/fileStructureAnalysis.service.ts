import { zipParser } from './zipParser.service';
import path from 'path';
import { detectArchitecture } from './arthitectureDetector.service';
import { generateTree } from './treeGenerator.service';
import { analyzeComplexity } from './analyzeComplexity.service';
import { checkNaming } from '../helpers/namingChecker';
import { suggestImprovements } from '../helpers/improvementSuggester';

import { FileTree } from '../types/analyzer'; //default FileTree type
import { ArchitectureGuess } from '../types/analyzer'; //detectArchitecture return type
import { ComplexityReport } from './analyzeComplexity.service'; // analyzeComplexity return type

// Return type that includes all analysis results
export interface FileAnalysisResult {
    architecture: ArchitectureGuess;
    fileTree: FileTree;
    complexityReport: ComplexityReport;
    namingProblems: string[];
    suggestions: string[];
}

/**
 * It analyzes the structure of the given file or ZIP file and provides a comprehensive report. //* Verilen dosya veya ZIP dosyasının yapısını analiz eder ve kapsamlı bir rapor sunar.
 *
 * @param file The file object loaded by Multer (if ZIP) or a direct project directory path.  //*Multer tarafından yüklenen dosya objesi (ZIP ise) veya doğrudan bir proje dizini yolu.
 * @returns A comprehensive FileAnalysisResult object.
 * @throws If an error occurs during analysis, it throws an error.
 */
export const fileStructureAnalysis = async (file: string | Express.Multer.File): Promise<FileAnalysisResult> => {
    let projectPath: string;
    let initialFileName: string | undefined;

    //0. Specify the project path and extract the ZIP file //* 0. Proje yolunu belirle ve ZIP dosyası ise çıkar
    if (typeof file === 'string') {
        //If a direct directory path is given //* Eğer doğrudan bir dizin yolu verilmişse
        projectPath = file;
        initialFileName = path.basename(file); //For informational purposes only //* Sadece bilgilendirme amaçlı
    } else {
        // If it is a file uploaded by Multer //*Eğer Multer tarafından yüklenen bir dosya ise
        initialFileName = file.originalname;

        if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
            console.log(`ZIP file detected: ${file.originalname}. being removed...`);
            try {
                //The path to the extracted directory returned by zipParser //* zipParser'dan dönen, çıkarılan dizinin yoludur
                projectPath = await zipParser(file);
                console.log(`ZIP file successfully extracted: ${projectPath}`);
            } catch (error) {
                console.error(`Error occurred while extracting ZIP file: ${error}`);
                throw new Error(`Error occurred while processing the ZIP file: ${initialFileName}`);
            }
        } else {
            projectPath = path.dirname(file.path); //The folder where the file is located //* Dosyanın bulunduğu klasör
            console.warn(`** ZIP olmayan bir dosya (${file.originalname}) alındı. Analiz sadece dosyanın bulunduğu klasör üzerinden yapılacaktır.`);
            console.warn(`A non -jump file (${file.originalname}) was taken. The analysis will only be done through the folder where the file is located.`);
        }
    }

    // Start analysis after the project path is determined //* Proje yolu belirlendikten sonra analize başlanır
    if (!projectPath) {
        throw new Error("The project path to be analyzed could not be determined.");
    }

    let generatedFileTree: FileTree;
    try {
        //1. Folder/File Tree Creating //* 1. Klasör/dosya ağacı oluşturma
        //It creates a tree from the real file system using ProjectPath. //*projectPath'i kullanarak gerçek dosya sisteminden ağacı oluşturur
        generatedFileTree = await generateTree(projectPath); // generateTree async ise await kullanın
        console.log("File Tree created succesfully.");
    } catch (error) {
        console.error(`File tree created has been error: ${error}`);
        throw new Error(`File tree created has been error: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 2. Architectural Analysis //* 2. Mimari analizi
    const architecture = detectArchitecture(generatedFileTree);
    console.log("Architectural analysis completed:", architecture.type);

    // 3. complexity analysis //* 3. Karmaşıklık analizi
    const complexityReport = analyzeComplexity(generatedFileTree);
    console.log("Karmaşıklık analizi tamamlandı. Skor:", complexityReport.complexityScore);

    // 4. NAME CONTROLS //* 4. İsimlendirme kontrolleri
    const namingProblems = checkNaming(generatedFileTree);
    if (namingProblems.length > 0) {
        console.warn(`${namingProblems.length} A naming problem was found.`);
    } else {
        console.log("** İsimlendirme sorunu bulunamadı.");
        console.log("No naming issue found");
    }

    // 5. Improvement Suggestions //* 5. İyileştirme önerileri
    const suggestions = suggestImprovements(generatedFileTree, complexityReport, namingProblems);
    console.log("** adet iyileştirme önerisi oluşturuldu.");
    console.log(`${suggestions.length} Menstrual improvement proposal was created.`);

    // 6. Turn them all in an object //* 6. Hepsini bir nesnede döndür
    return {
        architecture,
        fileTree: generatedFileTree, // We return here
        complexityReport,
        namingProblems,
        suggestions,
    };
};
