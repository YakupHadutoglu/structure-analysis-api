import { FileTree } from '../types/analyzer';
import { ComplexityReport } from '../services/analyzeComplexity.service';
import { detectArchitecture } from '../services/detectArchitecture.service';

/**
 * Interface for a rule used to generate improvement suggestions based on a specific condition.
 * * Belirli bir koşula dayalı olarak iyileştirme önerileri oluşturmak için kullanılan kural arayüzü.
 */

interface SuggestionRule {
    //Unique identifier for the rule. //* Kuralın benzersiz tanımlayıcısı.
    id: string;
    //Unique identifier for the rule. //* Önerinin ana başlığı ve açıklaması.
    description: string;
    //The condition that triggers the suggestion. //* Öneriyi tetikleyen koşul.
    condition: (tree: FileTree, complexityReport: ComplexityReport, namingProblems: string[]) => boolean;
    //List of suggestion texts to be presented when the condition is met. //* Koşul karşılandığında sunulacak öneri metinlerinin listesi.
    suggestions: (tree: FileTree, complexityReport: ComplexityReport, namingProblems: string[]) => string[];
}

/**
 * Provides improvement suggestions based on the results of the project structure analysis.
 * * Proje yapısı analiz sonuçlarına göre iyileştirme önerileri sunar.
 *
 * @param tree  The project's file tree. //*Projenin dosya ağacı.
 * @param complexityReport The detailed complexity report returned from the AnalyzeComplexity service. //* AnalyzeComplexity servisinden dönen detaylı karmaşıklık raporu.
 * @param namingProblems The list of naming problems returned from the checkNaming service. //* checkNaming servisinden dönen isimlendirme sorunları listesi.
 * @returns İyileştirme önerilerini içeren bir string dizisi. / An array of strings containing improvement suggestions.
 */

export const suggestImprovements = (
    tree: FileTree,
    complexityReport: ComplexityReport,
    namingProblems: string[]
): string[] => {
    const suggestions: string[] = [];

    //Detect the architecture. //* Mimariyi tespit etme
    const arch = detectArchitecture(tree);

    /**
     * This structure makes it easy to add new rules and manage existing ones.
     * List of improvement rules.
     * * İyileştirme kurallarının listesi.
     * * Bu yapı, yeni kuralların eklenmesini ve mevcut kuralların yönetilmesini kolaylaştırır.
     */
    const suggestionRules: SuggestionRule[] = [
        // Suggestions specific to monolithic architecture. //* Monolitik mimariye özel öneriler.
        {
            id: 'arch_monolithic_suggestions',
            description: 'Monolitik mimari için öneriler:',
            condition: () => arch.type === 'monolithic' && arch.confidence > 70,
            suggestions: () => [
                "Projeniz güçlü bir monolitik mimari gösteriyor. Büyüme potansiyeli için:",
                "   - Modüler monolitik yapıya geçiş için 'modules' veya 'features' klasör yapısını düşünün.",
                "   - Kritik servisleri mikroservislere ayırmayı değerlendirin."
            ]
        },
        // Suggestions specific to hybrid architecture. //* Hibrit mimariye özel öneriler.
        {
            id: 'arch_hybrid_suggestions',
            description: 'Hibrit mimari için öneriler:',
            condition: () => arch.type === 'hybrid',
            suggestions: () => [
                "Hibrit mimari tespit edildi. İyileştirmeler için:",
                "   - Mimari sınırlarını netleştirin (örneğin, mikroservisler arası iletişim protokolleri).",
                "   - Ortak bileşenler için 'shared' veya 'common' klasörü oluşturun."
            ]
        },
        // Suggestions for a high general complexity score. //* Yüksek genel karmaşıklık skoru için öneriler.
        {
            id: 'complexity_high',
            description: 'Yüksek karmaşıklık uyarısı:',
            condition: () => complexityReport.complexityScore >= 75,
            suggestions: (t, c) => [`Proje genel olarak çok yüksek karmaşıklığa sahip (${c.complexityScore}/100). Acilen refactoring düşünülmeli, modülerizasyon ve sorumluluk ayrılığı prensiplerine odaklanılmalı.`]
        },
        // Suggestions for a medium general complexity score. //* Orta seviye genel karmaşıklık skoru için öneriler.
        {
            id: 'complexity_medium',
            description: 'Orta seviye karmaşıklık uyarısı:',
            condition: () => complexityReport.complexityScore >= 50,
            suggestions: (t, c) => [`Proje karmaşıklığı (${c.complexityScore}/100) yüksek seviyede. Gelecekteki bakımı kolaylaştırmak için modüler yapılandırmaya ve sorumluluk ayrılığına daha fazla özen gösterilebilir.`]
        },
        // Suggestions for file tree depth. //* Dosya ağacı derinliği için öneriler.
        {
            id: 'depth_deep',
            description: 'Dosya ağacı derinliği önerileri:',
            condition: () => complexityReport.maxDepth >= 7,
            suggestions: (t, c) => [`Dosya ağacı çok derin (${c.maxDepth} seviye). Daha düz bir hiyerarşi veya farklı bir modülleme yaklaşımı düşünülebilir.`]
        },
        {
            id: 'depth_medium',
            description: 'Dosya ağacı derinliği önerileri:',
            condition: () => complexityReport.maxDepth >= 4,
            suggestions: (t, c) => [`Dosya ağacında derinlik (${c.maxDepth} seviye) orta seviyede. Gerekirse bazı klasörler birleştirilerek veya yeniden düzenlenerek derinlik azaltılabilir.`]
        },
        // Suggestions for average number of files per folder. //* Klasör başına ortalama dosya sayısı için öneriler.
        {
            id: 'files_per_folder_high',
            description: 'Klasör başına dosya sayısı önerileri:',
            condition: () => complexityReport.averageFilesPerFolder >= 15,
            suggestions: (t, c) => [`Klasör başına ortalama dosya sayısı yüksek (${c.averageFilesPerFolder.toFixed(2)}). Bu, klasörlerin çok fazla sorumluluk aldığını gösterebilir. Daha spesifik klasörlere bölmeyi düşünebilirsiniz.`]
        },
        // Suggestions for naming problems. //* İsimlendirme sorunları için öneriler.
        {
            id: 'naming_problems_found',
            description: 'İsimlendirme sorunları:',
            condition: (t, c, n) => n.length > 0,
            suggestions: (t, c, n) => {
                const namingSuggestions = [`Projenizde ${n.length} adet isimlendirme sorunu tespit edildi.`, `İsimlendirme standartlarına uymak, kod okunabilirliğini ve anlaşılırlığını önemli ölçüde artırır.`];
                n.forEach((problem) => {
                    namingSuggestions.push(`   → Sorunlu yol: ${problem}. Daha tutarlı bir isimlendirme standardı (örn: kebab-case) kullanmayı düşünebilirsiniz.`);
                });
                return namingSuggestions;
            }
        },
        // General structural suggestions. //* Genel yapısal öneriler.
        {
            id: 'general_single_root_folder',
            description: 'Yapısal sadelik önerisi:',
            condition: (t) => {
                const rootKeys = Object.keys(t);
                return rootKeys.length === 1 && t[rootKeys[0]] !== null && Object.keys(t[rootKeys[0]] as FileTree).length > 0;
            },
            suggestions: (t) => {
                const rootKeys = Object.keys(t);
                return [`Projenin kök dizininde sadece tek bir ana klasör (${rootKeys[0]}) bulunuyor. İsterseniz bu klasörü kaldırıp içeriğini doğrudan kök dizine taşıyarak dosya yapısını sadeleştirebilirsiniz.`];
            }
        },
        {
            id: 'general_initial_project',
            description: 'Başlangıç aşaması önerisi:',
            condition: (t, c) => c.totalFiles < 5 && c.totalFolders < 2,
            suggestions: () => [`Proje henüz başlangıç aşamasında görünüyor. Temel dosya yapısını belirlerken gelecekteki ölçeklenebilirliği düşünmek iyi olacaktır.`]
        },
        // Suggestion for .gitignore file. //* .gitignore dosyası için öneri.
        {
            id: 'general_gitignore_missing',
            description: '.gitignore uyarısı:',
            condition: (t) => !('.gitignore' in t),
            suggestions: () => [`Git depolarına gereksiz dosyaları (örn: node_modules, dist) eklememek için bir ".gitignore" dosyası oluşturun.`]
        },
        // Suggestion for README.md file. //* README.md dosyası için öneri.
        {
            id: 'general_readme_missing',
            description: 'README.md uyarısı:',
            condition: (t) => !('README.md' in t),
            suggestions: () => [`Projenizin amacını, kurulumunu ve kullanımını açıklayan bir "README.md" dosyası ekleyin.`]
        },
        // Suggestion to consolidate source code in a single folder. //* Kaynak kodunun bir klasörde toplanması için öneri.
        {
            id: 'general_src_folder_missing',
            description: 'Klasör yapısı önerisi:',
            condition: (t) => ('package.json' in t) && !('src' in t || 'app' in t),
            suggestions: () => [`Projenin kaynak kodlarını "src" veya "app" gibi bir klasör altında toplamak, daha düzenli bir yapı sağlar.`]
        }
    ];

    // Iterate over the defined rules, check conditions, and collect suggestions. //* Tanımlanan kurallar üzerinde dönerek koşulları kontrol et ve önerileri topla.
    suggestionRules.forEach(rule => {
        if (rule.condition(tree, complexityReport, namingProblems)) {
            suggestions.push(...rule.suggestions(tree, complexityReport, namingProblems));
        }
    });

    return suggestions;
};

