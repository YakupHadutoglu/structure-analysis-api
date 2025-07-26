import { FileTree } from '../types/analyzer';
import { ComplexityReport } from '../services/analyzeComplexity.service';

/**
 * Provide improvement suggestions according to the results of the project structure analysis.
 *
 * @param tree The project's file tree.
 * @param complexityReport Detailed complexity report returning from the AnalyzeComplexity service.
 * @param namingProblems List of Naming Problems Returning from Checknameing Service.
 * @returns A string sequence containing improvement suggestions.
 */
export const suggestImprovements = (
    tree: FileTree,
    complexityReport: ComplexityReport,
    namingProblems: string[]
): string[] => {
    const suggestions: string[] = [];

    // --- 1. Recommendations according to the complexity report ---

    const generalComplexity = complexityReport.complexityScore;

    //Suggestions according to the general complex score thresholds //* Genel karmaşıklık skoru eşiklerine göre öneriler
    if (generalComplexity >= 75) {
        suggestions.push(`🔥 Proje genel olarak çok yüksek karmaşıklığa sahip (${generalComplexity}/100). Acilen refactoring düşünülmeli, modülerizasyon ve sorumluluk ayrılığı prensiplerine odaklanılmalı.`);
    } else if (generalComplexity >= 50) {
        suggestions.push(`⚠️ Proje karmaşıklığı (${generalComplexity}/100) yüksek seviyede. Gelecekteki bakımı kolaylaştırmak için modüler yapılandırmaya ve sorumluluk ayrılığına daha fazla özen gösterilebilir.`);
    } else if (generalComplexity >= 30) {
        suggestions.push(`📈 Proje karmaşıklığı (${generalComplexity}/100) orta seviyede. Yapısal düzenlemeler ve kod kalitesi kontrolleriyle daha iyi hale getirilebilir.`);
    }

    // According to the maximum depth //* Maksimum derinliğe göre öneri
    if (complexityReport.maxDepth >= 7) {
        suggestions.push(`🌲 Dosya ağacı çok derin (${complexityReport.maxDepth} seviye). Daha düz bir hiyerarşi veya farklı bir modülleme yaklaşımı düşünülebilir.`);
    } else if (complexityReport.maxDepth >= 4) {
        suggestions.push(`🌳 Dosya ağacında derinlik (${complexityReport.maxDepth} seviye) orta seviyede. Gerekirse bazı klasörler birleştirilerek veya yeniden düzenlenerek derinlik azaltılabilir.`);
    }

    //Suggestion by the average number of files per folder //* Klasör başına ortalama dosya sayısına göre öneri
    if (complexityReport.averageFilesPerFolder >= 15) {
        suggestions.push(`📚 Klasör başına ortalama dosya sayısı yüksek (${complexityReport.averageFilesPerFolder.toFixed(2)}). Bu, klasörlerin çok fazla sorumluluk aldığını veya çok genel olduğunu gösterebilir. Daha spesifik klasörlere bölmeyi düşünebilirsin.`);
    } else if (complexityReport.averageFilesPerFolder >= 8) {
        suggestions.push(`📖 Klasör başına ortalama dosya sayısı (${complexityReport.averageFilesPerFolder.toFixed(2)}) biraz yüksek. Bazı klasörlerinizdeki dosya sayısını azaltmak okunabilirliği artırabilir.`);
    }

    //Recommendation by Total Number of Files //* Toplam dosya sayısına göre öneri
    if (complexityReport.totalFiles >= 200) {
        suggestions.push(`📁 Projede ${complexityReport.totalFiles} adet dosya bulunuyor. Bu büyüklükte bir projede, mimari desenleri (modüler monolitik, mikroservisler) daha belirgin uygulamak bakım kolaylığı sağlar.`);
    } else if (complexityReport.totalFiles >= 50) {
        suggestions.push(`📄 Projede ${complexityReport.totalFiles} adet dosya var. Yapıyı modüllere veya özelliklere ayırmak, projenin büyümesiyle birlikte bakım kolaylığını artıracaktır.`);
    }

    // --- 2. Suggestions by Naming Problems //* 2. İsimlendirme Sorunlarına Göre Öneriler ---
    if (namingProblems.length > 0) {
        suggestions.push(`🧠 Projenizde ${namingProblems.length} adet isimlendirme sorunu tespit edildi.`);
        namingProblems.slice(0, namingProblems.length).forEach((problem) => {
            suggestions.push(`   → Sorunlu yol: ${problem}. Daha tutarlı bir isimlendirme standardı (örn: kebab-case) kullanmayı düşünebilirsin.`);
        });
        if (namingProblems.length > 3) {
            suggestions.push(`   ...ve ${namingProblems.length - 3} adet daha isimlendirme sorunu.`);
        }
        suggestions.push(`💡 İsimlendirme standartlarına uymak, kod okunabilirliğini ve anlaşılırlığını önemli ölçüde artırır.`);
    }

    // --- 3. General Structural Suggestions //* 3. Genel Yapısal Öneriler ---
    //It is just a root folder (root/my-project/...)
    const rootKeys = Object.keys(tree);
    if (rootKeys.length === 1 && tree[rootKeys[0]] !== null && Object.keys(tree[rootKeys[0]] as FileTree).length > 0) {
        suggestions.push(`📦 Projenin kök dizininde sadece tek bir ana klasör (${rootKeys[0]}) bulunuyor. Bu yapı, gereksiz bir kapsülleme katmanı oluşturabilir. İstersen bu klasörü kaldırıp içeriğini doğrudan kök dizine taşıyarak dosya yapısını sadeleştirebilirsin.`);
    }

    //Very few files/folders (ie the initial level project) //* Çok az dosya/klasör olması durumu (yani henüz başlangıç seviyesi proje)
    if (complexityReport.totalFiles < 5 && complexityReport.totalFolders < 2) {
        suggestions.push(`🌱 Proje henüz başlangıç aşamasında görünüyor. Temel dosya yapısını belirlerken gelecekteki ölçeklenebilirliği düşünmek iyi olacaktır.`);
    }

    if ('node_modules' in tree) {
        suggestions.push('⛔ "node_modules" klasörünü git repolarına dahil etmemeyi unutmayın. `.gitignore` kullanın.');
    }
    if ('package.json' in tree && !('src' in tree || 'app' in tree)) {
        suggestions.push('📁 Projenin kaynak kodlarını "src" veya "app" gibi bir klasör altında toplamak, daha düzenli bir yapı sağlar.');
    }

    return suggestions;
};
