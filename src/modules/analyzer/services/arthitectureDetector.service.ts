import { FileTree , ArchitectureGuess , ArchitectureIndicator , ArchitectureDefinition } from '../types/analyzer';
import { ARCHITECTURE_INDICATORS, ARCHITECTURES } from '/home/oem/Yedek/projeler/Back-end/structure-analysis-api/src/modules/config/architecture';

/**
 *  It predicts the software architecture of a project based on file tree. //* Dosya ağacına dayalı olarak bir projenin yazılım mimarisini tahmin eder.
 *
 * @param tree //* Analiz edilecek dosya ağacı.
 * @returns The estimated architectural type is an Architectureguess object with reliability and details. //* Tahmin edilen mimari tipi, güvenilirlik ve detayları içeren bir ArchitectureGuess objesi.
 */
export const detectArchitecture = (tree: FileTree): ArchitectureGuess => {
    if (!tree || Object.keys(tree).length === 0) {
        return {
            type: 'unknown',
            confidence: 0,
            details: {},
            matchedIndicators: {},
            suggestions: ['Boş veya geçersiz dosya ağacı. Lütfen geçerli bir proje yapısı sağlayın.']
        };
    }

    //Structures to keep starting scores and matches for each architectural type //* Her mimari tipi için başlangıç puanlarını ve eşleşen göstergeleri tutacak yapılar
    const scores: Record<string, number> = ARCHITECTURES.reduce((acc, arch) => ({ ...acc, [arch.id]: 0 }), {});
    const matchedIndicators: Record<string, string[]> = ARCHITECTURES.reduce((acc, arch) => ({ ...acc, [arch.id]: [] }), {});

    // --- 1. Apply the indicators and calculate the scores //* Göstergeleri Uygula ve Puanları Hesapla ---
    for (const indicator of ARCHITECTURE_INDICATORS) {
        if (indicator.matchFunction(tree)) {
            indicator.architectures.forEach(archId => {
                if (scores[archId] !== undefined) {
                    scores[archId] += indicator.score;
                    if (!matchedIndicators[archId]) {
                        matchedIndicators[archId] = [];
                    }
                    matchedIndicators[archId].push(indicator.id);
                }
            });

            //Apply negative effects //* Negatif etkileri uygula
            if (indicator.negativeImpact) {
                indicator.negativeImpact.architectures.forEach(archId => {
                    if (scores[archId] !== undefined) {
                        scores[archId] -= indicator.negativeImpact!.score;
                    }
                });
            }
        }
    }

    // --- 2. Hybrid architectural perception //* Hibrit Mimari Algılaması ---
    // Find the architectures that score on a particular threshold //* Belirli bir eşiğin üzerinde puan alan mimarileri bul
    const highScoringArchitectures = Object.entries(scores).filter(([, score]) => score > 40);

    if (highScoringArchitectures.length >= 2) {
        //If there are two or more architects with the highest score, add hybrid score//* En yüksek puan alan iki veya daha fazla mimari varsa hibrit puanı ekle
        scores.hybrid += 30; //Bonus for the possibility of being hybrid //* Hibrit olma ihtimaline bonus
        if (!matchedIndicators.hybrid) matchedIndicators.hybrid = [];
        matchedIndicators.hybrid.push('hybrid_multiple_high_scores');
    }

    // --- 3. En Yüksek Puanı ve Güvenilirliği Belirle //* 3. En Yüksek Puanı ve Güvenilirliği Belirle ---
    const sortedEntries = Object.entries(scores).sort((a, b) => b[1] - a[1]);

    const topArchitectureType = sortedEntries[0]?.[0] || 'unknown';
    let rawConfidence = sortedEntries[0]?.[1] || 0;

    /**
     * Normalized trust score calculation
     * It is necessary to predict the maximum possible score approximately.
     * We get the highest score in the scenario where all indicators are triggered.
     */

    /**
     * //* Normalize edilmiş güven skoru hesaplaması
     * //* Maksimum olası puanı yaklaşık olarak tahmin etmek gerekiyor.
     * //* Tüm göstergelerin tetiklendiği senaryoda elde edilebilecek en yüksek puanı alıyoruz.
     */

    const MAX_POSSIBLE_RAW_SCORE = ARCHITECTURE_INDICATORS.reduce((sum, ind) => {
        let maxIndScore = 0;
        if (ind.architectures.length > 0) {
            // Simply: The maximum score of the highest score architecture
            //* Basitçe: en yüksek skorlu mimarinin maksimum puanı
            maxIndScore = ind.score;
        }
        return sum + maxIndScore;
    }, 0);

    let normalizedConfidence = 0;
    if (MAX_POSSIBLE_RAW_SCORE > 0) {
        normalizedConfidence = (rawConfidence / MAX_POSSIBLE_RAW_SCORE) * 100;
    }
    normalizedConfidence = Math.min(100, Math.max(0, normalizedConfidence));
    //Reducing reliability (if the highest and second highest score is close)
    //* Güvenilirlik düşürme (eğer en yüksek ve ikinci en yüksek skor yakınsa)
    if (sortedEntries.length > 1) {
        const secondTopRawConfidence = sortedEntries[1][1];
        const difference = rawConfidence - secondTopRawConfidence;

        if (difference < (MAX_POSSIBLE_RAW_SCORE * 0.15)) { // If the difference is less than 15 %of the maximum score//* Fark, maksimum puanın %15'inden azsa
            // IF The Difference is Less Than 15 %of the Maximum Score  //* Fark ne kadar azsa, o kadar düşür
            normalizedConfidence -= (MAX_POSSIBLE_RAW_SCORE * 0.15 - difference) / MAX_POSSIBLE_RAW_SCORE * 30; // Max 30 puan düşür
            normalizedConfidence = Math.max(0, normalizedConfidence); //Do not fall negative //* Negatife düşmesin
        }
    }

    // --- 4. Create Suggestions //* 4. Öneriler Oluşturuluyor ---
    const suggestions: string[] = [];
    if (normalizedConfidence < 60) {
        suggestions.push("Belirgin mimari desenleri tam olarak algılanamadı. Daha fazla klasörleme veya konfigürasyon dosyası eklemeyi düşünün.");
        suggestions.push("Proje yapısını daha standart mimari prensiplere uygun hale getirin.");
    }
    // Additional Suggestions  //* Ek öneriler
    if (topArchitectureType === 'unknown' && Object.keys(tree).length > 0) {
        suggestions.push("Kök dizinde bilinen mimari gösterge klasörleri (services, modules, functions vb.) bulunamadı.");
    }

    // --- 5. Return the result //* 5. Sonucu Döndür ---
    return {
        type: topArchitectureType,
        confidence: parseFloat(normalizedConfidence.toFixed(2)),
        details: scores,
        matchedIndicators: matchedIndicators,
        suggestions: suggestions
    };
};
