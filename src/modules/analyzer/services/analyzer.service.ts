import { zipParser } from './zipParser.service'; // return zipParser'Promise<string>'
import { fileStructureAnalysis, FileAnalysisResult } from './fileStructureAnalysis.service'; // We import the return type of fileStructureAnalytics

/**
 * It analyzes the incoming file. If it is a ZIP file, it opens it and sends it for file structure analysis.
 * If ZIP is not available, it is sent directly to file structure analysis.
 *
 * @param file Express.Multer.File object loaded by Multer.
 * @returns Promise containing a scoped FileAnalysisResult object.
 * @throws If an error occurs during analysis, it throws an error.
 */

export const analyze = async (file: Express.Multer.File): Promise<FileAnalysisResult> => {

    let analysisResult: FileAnalysisResult;

    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
        try {
            console.log(`[Analyzer] ZIP file perceived: ${file.originalname}.`);

            // We send zipParser the path to the file that Multer saved.
            // zipParser will return the path of the extracted directory as a string.
            
            const extractedDirPath = await zipParser(file);
            console.log(`[Analyzer] ZIP files succesfully extracted: ${extractedDirPath}`);
            console.log(`[Analyzer] ZIP files succesfully was removed: ${extractedDirPath}`)

            analysisResult = await fileStructureAnalysis(extractedDirPath); //extractedDirPath type of string
            console.log("** [Analyzer] ZIP çözümü üzerinden dosya yapısı analizi tamamlandı.");
            console.log("[Analyzer] File structure analysis completed via ZIP solution.");
        } catch (error) {
            console.error(`[Analyzer] Fİle structure analysis create erorr (${file.originalname}):`, error);
            if (error instanceof Error) {
                throw new Error(`ZIP files (${file.originalname}) while proessing error: ${error.message}`);
            } else {
                throw new Error(`ZIP files (${file.originalname}) while processing undefined a error create.`);
            }
        }
    } else {
        // If the incoming file is not a ZIP file (e.g. a single code file, image, etc.) //* Gelen dosya bir ZIP dosyası değilse (örn: tek bir kod dosyası, resim vb.)
        try {
            console.log(`** [Analyzer] ZIP olmayan dosya algılandı: ${file.originalname}. Doğrudan dosya yapısı analizi başlatılıyor.`);
            console.log(`[Analyzer] Non-ZIP file detected: ${file.originalname}. Starting direct file analysis.`);

            //We send the Multer file object to the fileStructureAnalysis function. //* fileStructureAnalysis fonksiyonuna Multer file objesini gönderiyoruz.
            //fileStructureAnalysis will process this object (use its path). //* fileStructureAnalysis bu objeyi işleyecek (path'ini kullanacak).

            analysisResult = await fileStructureAnalysis(file);
            console.log("** [Analyzer] Doğrudan dosya analizi tamamlandı.");
            console.log("[Analyzer] Direct file analysis completed.");
        } catch (error) {
            console.error(`** [Analyzer] ZIP olmayan dosyayı işlerken hata oluştu (${file.originalname}):`, error);
            console.error(`[Analyzer] Error occurred while processing non-ZIP file (${file.originalname}):`, error);

            //We make the error more specific and throw it up //* Hatayı daha spesifik hale getirip yukarıya fırlatıyoruz

            if (error instanceof Error) {
                throw new Error(`File (${file.originalname}) while processing error: ${error.message}`);
            } else {
                throw new Error(`File (${file.originalname}) while processing undefined a error create.`);
            }
        }
    }
    return analysisResult;
};
