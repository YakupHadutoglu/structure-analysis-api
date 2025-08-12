import { FileTree } from '../types/analyzer';

export type ComplexityReport = {
    totalFiles: number;
    totalFolders: number;
    maxDepth: number;
    averageFilesPerFolder: number;
    complexityScore: number;
    rootLevelFiles: number;
    emptyFolders: number;
    deepNestedFolders: number;
    overcrowdedFolders: number;
    sparseFolders: number;
    folderSizeDistribution: Record<string, number>;
    depthDistribution: Record<string, number>;
    suggestions: string[];
};

/**
 *  complexity analysis service.
 * * karmaşıklık analiz servisi.
 */
export const analyzeComplexity = (tree: FileTree): ComplexityReport => {
    // 1. Advanced error management and invalid input control //* 1. Gelişmiş hata yönetimi ve geçersiz girdi kontrolü
    if (!tree || Object.keys(tree).length === 0) {
        return {
            totalFiles: 0,
            totalFolders: 0,
            maxDepth: 0,
            averageFilesPerFolder: 0,
            complexityScore: 0,
            rootLevelFiles: 0,
            emptyFolders: 0,
            deepNestedFolders: 0,
            overcrowdedFolders: 0,
            sparseFolders: 0,
            folderSizeDistribution: {},
            depthDistribution: {},
            suggestions: ["Dosya ağacı boş veya geçersiz. Lütfen geçerli bir proje yapısı sağlayın."]
        };
    }

    // 2. Advanced logic in the determination of project root //* 2. Proje kökü tespitinde gelişmiş mantık
    const rootKeys = Object.keys(tree);
    let projectRoot: FileTree = tree;
    let rootFolderName = "root";

    //Multiple strategy for root directory detection //* Kök dizin tespiti için çoklu strateji
    const commonRoots = ['src', 'app', 'lib', 'server', 'client'];
    const foundRoot = commonRoots.find(root => rootKeys.includes(root));

    if (foundRoot) {
        projectRoot = tree[foundRoot] as FileTree;
        rootFolderName = foundRoot;
    } else if (rootKeys.length === 1) {
        rootFolderName = rootKeys[0];
        projectRoot = tree[rootKeys[0]] as FileTree;
    }

    // 3. Advanced Data Structures for Analysis Metriks //* 3. Analiz metrikleri için gelişmiş veri yapıları
    let totalFiles = 0;
    let totalFolders = 0;
    let maxDepth = 0;
    let folderSizes: number[] = [];
    let rootLevelFiles = 0;
    let emptyFolders = 0;
    let deepNestedFolders = 0;
    let overcrowdedFolders = 0;
    let sparseFolders = 0;
    const folderSizeDistribution: Record<string, number> = {};
    const depthDistribution: Record<string, number> = {};
    const suggestions: string[] = [];

    // 4. depense road and analysis //* 4. Derinlemesine gezinme ve analiz
    const traverse = (node: FileTree, depth: number, path: string = rootFolderName) => {

        depthDistribution[depth] = (depthDistribution[depth] || 0) + 1;

        let filesInCurrentFolder = 0;
        let foldersInCurrentFolder = 0;
        const currentPath = path;

        for (const key in node) {
            const fullPath = `${currentPath}/${key}`;
            const value = node[key];

            if (value === null || (typeof value === 'string' && value !== null)) {
                totalFiles++;
                filesInCurrentFolder++;
                if (depth === 1) rootLevelFiles++;
            } else if (typeof value === 'object' && !('type' in value)) {
                totalFolders++;
                foldersInCurrentFolder++;
                traverse(value, depth + 1, fullPath);
            }
        }

        if (filesInCurrentFolder === 0 && foldersInCurrentFolder === 0 && depth > 1) {
            emptyFolders++;
        }

        if (depth > 5) {
            deepNestedFolders++;
        }

        if (filesInCurrentFolder > 30) {
            overcrowdedFolders++;
        }

        if (filesInCurrentFolder > 0 && filesInCurrentFolder < 3 && depth > 1) {
            sparseFolders++;
        }

        const sizeCategory = getSizeCategory(filesInCurrentFolder);
        folderSizeDistribution[sizeCategory] = (folderSizeDistribution[sizeCategory] || 0) + 1;

        if (depth > 0 && (filesInCurrentFolder > 0 || foldersInCurrentFolder > 0)) {
            folderSizes.push(filesInCurrentFolder);
        }
    };

    // 5. Gezinmeyi başlat //* 5. Gezinmeyi başlat
    traverse(projectRoot, 1);

    //6. Statistics calculations //* 6. İstatistik hesaplamaları
    const averageFilesPerFolder = folderSizes.length > 0
        ? folderSizes.reduce((sum, count) => sum + count, 0) / folderSizes.length
        : 0;

    // 7. Advanced complexity score calculation //* 7. Gelişmiş karmaşıklık skoru hesaplama
    const complexityScore = calculateComplexityScore({
        totalFiles,
        totalFolders,
        maxDepth,
        averageFilesPerFolder,
        rootLevelFiles,
        emptyFolders,
        deepNestedFolders,
        overcrowdedFolders,
        sparseFolders
    });

    // 8. Creating automatic suggestions //* 8. Otomatik öneri oluşturma
    generateSuggestions({
        totalFiles,
        totalFolders,
        maxDepth,
        rootLevelFiles,
        emptyFolders,
        deepNestedFolders,
        overcrowdedFolders,
        sparseFolders,
        complexityScore,
        suggestions
    });

    return {
        totalFiles,
        totalFolders,
        maxDepth,
        averageFilesPerFolder: parseFloat(averageFilesPerFolder.toFixed(2)),
        complexityScore: parseFloat(complexityScore.toFixed(2)),
        rootLevelFiles,
        emptyFolders,
        deepNestedFolders,
        overcrowdedFolders,
        sparseFolders,
        folderSizeDistribution,
        depthDistribution,
        suggestions
    };
};

// 9. Auxiliary Functions //* 9. Yardımcı fonksiyonlar
const getSizeCategory = (fileCount: number): string => {
    if (fileCount === 0) return "empty";
    if (fileCount <= 5) return "small (1-5)";
    if (fileCount <= 15) return "medium (6-15)";
    if (fileCount <= 30) return "large (16-30)";
    return "x-large (31+)";
};

const calculateComplexityScore = (metrics: {
    totalFiles: number;
    totalFolders: number;
    maxDepth: number;
    averageFilesPerFolder: number;
    rootLevelFiles: number;
    emptyFolders: number;
    deepNestedFolders: number;
    overcrowdedFolders: number;
    sparseFolders: number;
}): number => {
    const weights = {
        maxDepth: 0.18,
        averageFiles: 0.22,
        totalFiles: 0.15,
        totalFolders: 0.12,
        rootFiles: 0.08,
        emptyFolders: 0.07,
        deepNested: 0.06,
        overcrowded: 0.07,
        sparse: 0.05
    };

    const normalize = (value: number, max: number) => Math.min(value / max * 100, 100);

    // Component scores //* Bileşen skorları
    const depthScore = Math.log2(metrics.maxDepth + 1) * 40;
    const avgFilesScore = Math.log2(metrics.averageFilesPerFolder + 1) * 50;
    const fileCountScore = Math.log10(metrics.totalFiles + 1) * 35;
    const folderCountScore = Math.log10(metrics.totalFolders + 1) * 30;

    //Normalized score //* Normalize edilmiş skor
    let score = (
        depthScore * weights.maxDepth +
        avgFilesScore * weights.averageFiles +
        fileCountScore * weights.totalFiles +
        folderCountScore * weights.totalFolders
    );

    // Ceza puanları //* Ceza puanları
    const penalties = (
        metrics.rootLevelFiles * 2 +
        metrics.emptyFolders * 5 +
        metrics.deepNestedFolders * 7 +
        metrics.overcrowdedFolders * 8 +
        metrics.sparseFolders * 3
    );

    score = normalize(score + penalties, 125);

    return Math.min(100, Math.max(0, score));
};

const generateSuggestions = (metrics: {
    totalFiles: number;
    totalFolders: number;
    maxDepth: number;
    rootLevelFiles: number;
    emptyFolders: number;
    deepNestedFolders: number;
    overcrowdedFolders: number;
    sparseFolders: number;
    complexityScore: number;
    suggestions: string[];
}) => {
    const { suggestions } = metrics;

    if (metrics.rootLevelFiles > 5) {
        suggestions.push(
            `Kök dizinde ${metrics.rootLevelFiles} dosya bulunuyor. ` +
            `Yapıyı düzenlemek için ilgili dosyaları uygun alt dizinlere taşıyın.`
        );
    }

    if (metrics.emptyFolders > 0) {
        suggestions.push(
            `${metrics.emptyFolders} adet boş klasör tespit edildi. ` +
            `Bunları kaldırarak proje yapısını basitleştirebilirsiniz.`
        );
    }

    if (metrics.deepNestedFolders > 0) {
        suggestions.push(
            `${metrics.deepNestedFolders} adet çok derin klasör (6+ seviye) tespit edildi. ` +
            `Derin hiyerarşileri düzleştirmek için modüler yapıyı yeniden düşünün.`
        );
    }

    if (metrics.overcrowdedFolders > 0) {
        suggestions.push(
            `${metrics.overcrowdedFolders} adet aşırı kalabalık klasör (>30 dosya) tespit edildi. ` +
            `Bunları alt dizinlere bölerek daha iyi organize edin.`
        );
    }

    if (metrics.sparseFolders > 0) {
        suggestions.push(
            `${metrics.sparseFolders} adet seyrek klasör (<3 dosya) tespit edildi. ` +
            `İlgili dosyaları daha üst dizinlere veya benzer içerikli klasörlere taşıyın.`
        );
    }

    if (metrics.complexityScore > 70) {
        suggestions.push(
            `Yüksek karmaşıklık skoru (${metrics.complexityScore.toFixed(2)}/100) proje bakımını zorlaştırabilir. ` +
            `Modülerleştirme ve soyutlama seviyelerini artırmayı düşünün.`
        );
    }

    // İngilizce öneriler
    if (metrics.rootLevelFiles > 5) {
        suggestions.push(
            `There are ${metrics.rootLevelFiles} files in the root directory. ` +
            `Consider moving related files to appropriate subdirectories to organize the structure.`
        );
    }

    if (metrics.complexityScore > 70) {
        suggestions.push(
            `High complexity score (${metrics.complexityScore.toFixed(2)}/100) may impact maintainability. ` +
            `Consider increasing modularization and abstraction levels.`
        );
    }
};
