import { FileTree, ArchitectureGuess } from '../types/analyzer';
import { ARCHITECTURE_INDICATORS, ARCHITECTURES } from '../../config/architecture';

//Is there a file/folder under a certain road check //* Belirli bir yol altında dosya/klasör var mı kontrol eder
const hasPath = (tree: FileTree, path: string): boolean => {
    const parts = path.split('/');
    let current = tree;

    for (const part of parts) {
        if (!current[part] || typeof current[part] !== 'object') return false;
        current = current[part] as FileTree;
    }

    return true;
};

export const countFilesByPattern = (tree: FileTree, pattern: RegExp): number => {
    let count = 0;

    const traverse = (node: FileTree) => {
        for (const key in node) {
            const value = node[key];

            if (value === null) {
                if (pattern.test(key)) count++;
            } else if (typeof value === 'object' && !('type' in value)) {
                traverse(value as FileTree);
            }
        }
    };

    traverse(tree);
    return count;
};

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

    //Automatic detection of the project root //* Proje kökünü otomatik tespit etme
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
    const scores: Record<string, number> = ARCHITECTURES.reduce((acc, arch) => ({ ...acc, [arch.id]: 0 }), {});
    const matchedIndicators: Record<string, string[]> = ARCHITECTURES.reduce((acc, arch) => ({ ...acc, [arch.id]: [] }), {});

    //Architectural Addiction Points //* Mimari bağımlılık puanları
    const dependencyScores: Record<string, number> = {
        monolithic: 0,
        microservices: 0,
        serverless: 0,
        eventDriven: 0
    };

    //1. Apply basic indicators //* 1. Temel göstergeleri uygula
    for (const indicator of ARCHITECTURE_INDICATORS) {
        if (indicator.matchFunction(projectRoot)) {
            indicator.architectures.forEach(archId => {
                scores[archId] += indicator.score;
                matchedIndicators[archId].push(indicator.id);
            });
        }
    }

    //2. Advanced Analysis: File Patterns//* 2. Gelişmiş analiz: Dosya pattern'leri
    // Mikroservis pattern'leri
    const serviceFiles = countFilesByPattern(projectRoot, /-service\./);
    if (serviceFiles > 2) {
        scores.microservices += 20 + (serviceFiles * 5);
        matchedIndicators.microservices.push('multiple_service_files');
    }

    // Serverless Patterns
    const lambdaFiles = countFilesByPattern(projectRoot, /(handler|lambda)\./);
    if (lambdaFiles > 0) {
        scores.serverless += 15 + (lambdaFiles * 10);
        matchedIndicators.serverless.push('lambda_handler_files');
    }

    //3. Negative indicators (anti-Pattern) //* 3. Negatif göstergeler (anti-pattern)
    // Microservis Patterns in Monolithic
    if (scores.monolithic > 40 && serviceFiles > 0) {
        scores.monolithic -= 15;
        scores.hybrid += 20;
        matchedIndicators.hybrid.push('monolithic_with_microservices_patterns');
    }

    //Central database in microServis structure
    if (scores.microservices > 40 && hasPath(projectRoot, 'src/db')) {
        scores.microservices -= 20;
        matchedIndicators.microservices.push('central_database_penalty');
    }

    //4. Addiction Analysis //* 4. Bağımlılık analizi
    //Docker and Kubernetes files
    const dockerFiles = countFilesByPattern(projectRoot, /(Dockerfile|docker-compose|\.k8s\.)/);
    if (dockerFiles > 0) {
        scores.microservices += 15;
        scores.serverless += 10;
        matchedIndicators.microservices.push('docker_files');
        matchedIndicators.serverless.push('docker_files');
    }

    //Message tail configurations //* Mesaj kuyruğu konfigürasyonları
    const queueConfigs = countFilesByPattern(projectRoot, /(kafka|rabbitmq|sqs)\./);
    if (queueConfigs > 0) {
        scores.eventDriven += 20;
        scores.microservices += 10;
        matchedIndicators.eventDriven.push('queue_config_files');
    }

    //5. Hybrid Architectural Analysis //* 5. Hibrit mimari analizi
    const highScoringArchitectures = Object.entries(scores)
        .filter(([, score]) => score > 25)
        .sort((a, b) => b[1] - a[1]);

    if (highScoringArchitectures.length >= 2) {
        const [first, second] = highScoringArchitectures;
        const scoreDifference = first[1] - second[1];

        // Strong hybrid indicator //* Güçlü hibrit göstergesi
        if (scoreDifference < 15) {
            scores.hybrid = (scores.hybrid || 0) + 40;
            matchedIndicators.hybrid.push('strong_hybrid_indicator');

            //Increase your addiction score //* Bağımlılık puanını artır
            dependencyScores[first[0]] += 10;
            dependencyScores[second[0]] += 10;
        }
        // Weak hybrid indicator //* Zayıf hibrit göstergesi
        else if (scoreDifference < 30) {
            scores.hybrid = (scores.hybrid || 0) + 25;
            matchedIndicators.hybrid.push('weak_hybrid_indicator');
        }
    }

    //6. Reliability Calculation //* 6. Güvenilirlik hesaplama
    const sortedEntries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const [topArch, topScore] = sortedEntries[0] || ['unknown', 0];
    const secondScore = sortedEntries.length > 1 ? sortedEntries[1][1] : 0;

    //Basic reliability //* Temel güvenilirlik
    let confidence = topScore > 0
        ? Math.min(100, (topScore / 100) * 80)
        : 0;

    //Adjustment by Point Difference //* Puan farkına göre ayarlama
    const scoreDifference = topScore - secondScore;
    if (scoreDifference > 30) {
        confidence += 15;
    } else if (scoreDifference < 15) {
        confidence -= 10;
    }

    // Addictive score effect//* Bağımlılık puanı etkisi
    const dependencyBoost = dependencyScores[topArch] || 0;
    confidence = Math.min(100, confidence + dependencyBoost);

    // 7. Smart suggestion system //* 7. Akıllı öneri sistemi
    const suggestions: string[] = [];
    const archDefinition = ARCHITECTURES.find(a => a.id === topArch);

    //General Suggestions //* Genel öneriler
    if (confidence < 50) {
        suggestions.push(
            "🔍 Mimari desenler net değil. Yapıyı daha belirgin hale getirmek için:",
            "   - Mimari sınırları netleştirin (ör. modüller, servisler)",
            "   - Standart klasör yapıları kullanın (controllers, services, repositories)",
            "   - Mimari kararları belgeleyin"
        );
    } else {
        suggestions.push(
            `✅ Projeniz güçlü bir ${archDefinition?.name} mimarisi gösteriyor.`,
            `   "Bu mimariyi güçlendirmek için:`
        );
    }

    //Architectural Suggestions //* Mimariye özel öneriler
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

    //Addiction Management Suggestions //* Bağımlılık yönetimi önerileri
    if (dockerFiles > 0) {
        suggestions.push(
            "🐳 Docker desteği tespit edildi:",
            "   - Çok aşamalı build'ler kullanarak imaj boyutunu küçültün",
            "   - Ortam değişkenleriyle dinamik konfigürasyon sağlayın"
        );
    }

    return {
        type: topArch,
        confidence: parseFloat(Math.min(100, Math.max(0, confidence)).toFixed(2)),
        details: scores,
        matchedIndicators: matchedIndicators,
        suggestions: suggestions
    };
};
