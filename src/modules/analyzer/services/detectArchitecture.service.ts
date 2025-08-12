import { FileTree, ArchitectureGuess, ArchitectureDetails } from '../types/analyzer';
import { ARCHITECTURE_INDICATORS, ARCHITECTURES } from '../../config/architecture';

/**
 * This service predicts the software architecture of a project based on the file tree.
 * Bu servis, dosya ağacına dayanarak bir projenin yazılım mimarisini tahmin eder.
 */
export const detectArchitecture = (tree: FileTree): ArchitectureGuess => {
    if (!tree || Object.keys(tree).length === 0) {
        return {
            type: 'unknown',
            confidence: 0,
            details: {},
            matchedIndicators: {},
            suggestions: [
                'Boş veya geçersiz dosya ağacı. Lütfen geçerli bir proje yapısı sağlayın.',
                'Empty or invalid file tree. Please provide a valid project structure.'
            ]
        };
    }

    //Automatic detection of the project root//* Proje kökünü otomatik tespit etme
    const rootKeys = Object.keys(tree);
    let projectRoot = tree;

    //Possible Root Index Pattern //* Olası kök dizin pattern'leri
    const rootPatterns = ['src', 'app', 'source', 'lib', 'server', 'client'];
    const foundRoot = rootPatterns.find(pattern => pattern in tree);

    if (foundRoot) {
        projectRoot = tree[foundRoot] as FileTree;
    } else if (rootKeys.length === 1) {
        projectRoot = tree[rootKeys[0]] as FileTree;
    }

    //Architectural Points and Matching //* Mimari puanları ve eşleşmeler
    const scores: ArchitectureDetails = ARCHITECTURES.reduce((acc, arch) => ({ ...acc, [arch.id]: 0 }), {} as ArchitectureDetails);
    const matchedIndicators: Record<string, string[]> = ARCHITECTURES.reduce((acc, arch) => ({ ...acc, [arch.id]: [] }), {});
    const maxPossibleScores: Record<string, number> = {};

    //Calculate maximum scores //* Maksimum puanları hesapla
    ARCHITECTURE_INDICATORS.forEach(indicator => {
        indicator.architectures.forEach(archId => {
            maxPossibleScores[archId] = (maxPossibleScores[archId] || 0) + indicator.score;
        });
    });

    //1. Apply basic indicators //* 1. Temel göstergeleri uygula
    for (const indicator of ARCHITECTURE_INDICATORS) {
        if (indicator.matchFunction(projectRoot)) {
            indicator.architectures.forEach((archId) => {
                if (archId in scores && archId in matchedIndicators) {
                    scores[archId as keyof typeof scores] += indicator.score;
                    matchedIndicators[archId as keyof typeof matchedIndicators].push(indicator.id);
                }
            });
        }
    }


    //2. Anti-Pattern detection //* 2. Anti-pattern tespiti
    //Microservis Patterns in Monolithic //* Monolitik yapıda mikroservis pattern'leri
    if (scores.monolithic > 40 && scores.microservices > 30) {
        scores.monolithic -= 15;
        scores.hybrid += 30;
        matchedIndicators.hybrid.push('anti-pattern_mono_with_micro');
    }

    //Central database in microses //* Mikroservislerde merkezi veritabanı
    if (scores.microservices > 40 && hasNestedFolder(projectRoot, 'src/db')) {
        scores.microservices -= 20;
        matchedIndicators.microservices.push('anti-pattern_central_db');
    }

    //3. Hybrid Architectural Analysis //* 3. Hibrit mimari analizi
    const highScoringArchitectures = Object.entries(scores)
        .filter(([archId, score]) => score > maxPossibleScores[archId] * 0.3)
        .sort((a, b) => b[1] - a[1]);

    if (highScoringArchitectures.length >= 2) {
        const [first, second] = highScoringArchitectures;
        const scoreDifference = first[1] - second[1];

        //Strong hybrid indicator //* Güçlü hibrit göstergesi
        if (scoreDifference < 15) {
            scores.hybrid += 40;
            matchedIndicators.hybrid.push('strong_hybrid_indicator');
        }
    }

    //4. Reliability Calculation //* 4. Güvenilirlik hesaplama
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const [topArch, topScore] = sorted[0] || ['unknown', 0];
    const [secondArch, secondScore] = sorted[1] || ['', 0];

    // Normalize confidence (0-100)
    const maxPossibleScore = maxPossibleScores[topArch] || 1;
    let confidence = maxPossibleScore > 0
        ? (topScore / maxPossibleScore) * 100
        : 0;

    //Reduce confidence for close competitors//* Yakın rakipler için güveni düşür
    if (topScore - secondScore < 15) {
        confidence *= 0.7;
    }

    //5. Smart suggestion system //* 5. Akıllı öneri sistemi
    const suggestions: string[] = [];

    //Architectural Suggestions //* Mimariye özel öneriler
    if (confidence < 40) {
        suggestions.push(
            "🔍 Mimari desenler net değil. Yapıyı daha belirgin hale getirmek için:",
            "   - Mimari sınırları netleştirin (ör. modüller, servisler)",
            "   - Standart klasör yapıları kullanın (controllers, services, repositories)",
            "   - Mimari kararları belgeleyin"
        );
    } else {
        suggestions.push(
            `✅ Projeniz güçlü bir ${ARCHITECTURES.find(a => a.id === topArch)?.name} mimarisi gösteriyor.`,
            `   Bu mimariyi güçlendirmek için:`
        );

        switch (topArch) {
            case 'microservices':
                suggestions.push(
                    "   - Servisler arası iletişim için API Gateway kullanın",
                    "   - Servis bağımsızlığını artırmak için domain-driven design uygulayın",
                    "   - Her servis için ayrı veri depoları kullanın"
                );
                break;

            case 'monolithic':
                suggestions.push(
                    "   - Modüler monolitik yapıya geçmek için 'modules' klasörü oluşturun",
                    "   - Sorumlulukları katmanlara ayırın (controllers, services, repositories)",
                    "   - Büyüdükçe mikroservislere geçiş planı yapın"
                );
                break;

            case 'hybrid':
                const topTwo = highScoringArchitectures.slice(0, 2);
                const archNames = topTwo.map(([id]) =>
                    ARCHITECTURES.find(a => a.id === id)?.name
                ).join(' + ');

                suggestions.push(
                    `   - ${archNames} mimarilerinin entegrasyonunu netleştirin`,
                    "   - Mimari sınırları belgeleyin",
                    "   - Karışık pattern'ler için bridge tasarım deseni kullanın"
                );
                break;

            case 'serverless':
                suggestions.push(
                    "   - Fonksiyonları küçük ve odaklı tutun",
                    "   - Soğuk başlangıç süresini optimize edin",
                    "   - Ortam değişkenleriyle konfigürasyon yönetin"
                );
                break;
        }
    }

    //Anti-Pattern warnings //* Anti-pattern uyarıları
    if (matchedIndicators[topArch]?.some(i => i.startsWith('anti-pattern'))) {
        suggestions.push(
            "⚠️ Anti-pattern tespit edildi:",
            "   - Mimari tutarsızlıkları performans ve bakım sorunlarına yol açabilir",
            "   - Mimariyi tutarlı hale getirmek için refactoring önerilir"
        );
    }

    return {
        type: topArch,
        confidence: parseFloat(Math.min(100, Math.max(0, confidence)).toFixed(2)),
        details: scores as Record<string , number>,
        matchedIndicators: matchedIndicators,
        suggestions: suggestions
    };
};

//Is there any folder under a certain road check //* Belirli bir yol altında klasör var mı kontrol eder
const hasNestedFolder = (tree: FileTree, path: string): boolean => {
    const parts = path.split('/');
    let current = tree;

    for (const part of parts) {
        if (!current[part] || typeof current[part] !== 'object') return false;
        current = current[part] as FileTree;
    }

    return true;
};
