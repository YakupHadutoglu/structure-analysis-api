import { FileTree, generateTree } from './treeGenerator.service';

//File Structure Type of complexity report. //*Dosya yapısı karmaşıklık raporu tipi.

export type ComplexityReport = {
    totalFiles: number;
    totalFolders: number;
    maxDepth: number;
    averageFilesPerFolder: number;
    complexityScore: number;
};

/**
 * The given file analyzes the complexity of the tree and reverses a report.
 *
 * @param tree File tree to be analyzed (FileTree).
 * @returns ComplexityReport object.
 */

export const analyzeComplexity = (tree: FileTree): ComplexityReport => {
    let totalFiles = 0;
    let totalFolders = 0;
    let maxDepth = 0;
    let folderSizes: number[] = [];

    /**
     * Strolls in the file tree in depth and collects statistics.
     * @param node Existing Filetree Node.
     * @param depth Existing depth level.
     */

    const traverse = (node: FileTree, depth: number) => {
        //Compare the current depth with the general maximum depth //* Mevcut derinliği genel maksimum derinlikle karşılaştır
        maxDepth = Math.max(maxDepth, depth);

        let filesInCurrentFolder = 0; //Number of files in the existing folder //* Mevcut klasördeki dosya sayısı

        for (const key in node) {
            //KEY, check whether the object's own feature (to skip the features in the prototype chain) //* key, objenin kendi özelliği mi diye kontrol et (prototip zincirindeki özellikleri atlamak için)
            if (Object.prototype.hasOwnProperty.call(node, key)) {
                const value = node[key];

                if (value === null) {
                    //If it is worth Null, this is a file. //* Eğer değer null ise, bu bir dosyadır.
                    totalFiles++;
                    filesInCurrentFolder++;
                } else {
                    //If the value is not null, this is a subfolder. //* Eğer değer null değilse, bu bir alt klasördür.
                    totalFolders++;
                    //Make the subfolder as self -esteem //* Alt klasöre özyinelemeli olarak in
                    traverse(value, depth + 1);
                }
            }
        }
        //Add the number of files in the existing folder to the list (if this is a folder and the number of files in it is > 0) //* Mevcut klasördeki dosya sayısını listeye ekle (eğer bu bir klasörse ve içindeki dosya sayısı > 0 ise)
        if (depth > 0 && (Object.keys(node).length > 0 || filesInCurrentFolder > 0)) {
            folderSizes.push(filesInCurrentFolder);
        }
    };

    //Start navigation from the root knot, start depth 1 (root directory) //* Gezinmeye kök düğümden başla, başlangıç derinliği 1 (kök dizin)
    traverse(tree, 1);

    /**
     * Calculate the average number of files
     * If there is no folder (for example, if there are files in the root) or if no files, turn 0.
     * If the Foldersizes sequence is empty (if there is no folder or file), it should be 0 average.
     */
    /**
     * //* Ortalama dosya sayısını hesapla
     * //* Eğer hiç klasör yoksa (örneğin sadece kökte dosyalar varsa) veya hiç dosya yoksa, 0 döndür.
     * //* folderSizes dizisi boşsa (hiç klasör veya dosya yoksa), ortalama 0 olmalı.
     */

    const averageFilesPerFolder = folderSizes.length > 0
        ? folderSizes.reduce((sum, count) => sum + count, 0) / folderSizes.length
        : 0;

    let score = 0;

    //1. Depth Effect: As the depth increases, the score increases //* 1. Derinlik etkisi: Derinlik arttıkça puan artar
    score += maxDepth * 5;

    //Ortalama dosya sayısı etkisi: Bir klasörde çok fazla dosya karmaşıklığı artırır //* 2. Ortalama dosya sayısı etkisi: Bir klasörde çok fazla dosya karmaşıklığı artırır
    score += averageFilesPerFolder * 2;

    //3. Total number of files: As the project grows, the complexity increases <I can change it in a logarithmic way> //* 3. Toplam dosya sayısı etkisi: Proje büyüdükçe karmaşıklık artar <logaritmik düzen ile değişebilir ileride>
    if (totalFiles > 0) {
        score += Math.log2(totalFiles) * 10; // logarithmic increase
    }

    //4. Total Folders Number Effect: Too much folder increases complexity //* 4. Toplam klasör sayısı etkisi: Çok fazla klasör karmaşıklığı artırır
    if (totalFolders > 0) {
        score += Math.log2(totalFolders) * 8; //As the number of folders increases, the increase in points logarithmic
    }

    // 5. Bonus points on certain thresholds (optional)
    if (maxDepth > 5) score += 10;
    if (totalFiles > 100) score += 15;
    if (totalFolders > 50) score += 10;

    const MAX_EXPECTED_RAW_SCORE = 200; // An example value should be adjusted according to real projects

    let finalComplexityScore = (score / MAX_EXPECTED_RAW_SCORE) * 100;
    finalComplexityScore = Math.min(100, Math.max(0, finalComplexityScore));

    return {
        totalFiles,
        totalFolders,
        maxDepth,
        averageFilesPerFolder: parseFloat(averageFilesPerFolder.toFixed(2)),
        complexityScore: Math.floor(finalComplexityScore)
    };
};
