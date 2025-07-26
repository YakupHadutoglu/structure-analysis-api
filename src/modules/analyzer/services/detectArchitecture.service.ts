import { FileTree, generateTree } from './treeGenerator.service';

export interface ArchitectureGuess {
    type: string;
    confidence: number; //* 0 - 100
    details?: Record<string, number>;
    suggestions?: string[];
}

interface ArchitectureIndicator {
    name: string;
    score: number;
    matchFunction: (tree: FileTree) => boolean;
}

export const detectArchitecture = (tree: FileTree): ArchitectureGuess => {
    let scores: Record<string, number> = {
        monolithic: 0,
        modularMonolithic: 0,
        microservices: 0,
        serverless: 0,
        eventDriven: 0,
        cleanArch: 0,
        cqrs: 0,
        microFrontend: 0,
        hybrid: 0,
    };

    // Helper functions
    const hasDirectFolder = (name: string, subtree: FileTree) => name in subtree;
    // A recursive helper to control the subfolders //* Alt klasörleri kontrol etmek için recursive bir helper
    // Ex: Are there subfolders such as 'user' and 'order' under the 'Modulas' folder? //* Örn: 'modules' klasörünün altında 'user' ve 'order' gibi alt klasörler var mı?

    const hasNestedFolders = (parentName: string, subfolderNames: string[], tree: FileTree): boolean => {
        if (!hasDirectFolder(parentName, tree)) return false;
        const parentFolder = tree[parentName] as FileTree;
        return subfolderNames.every(name => hasDirectFolder(name, parentFolder));
    };

    // Architectural indicators and scoring logic
    const indicators: ArchitectureIndicator[] = [
        // Monolithic
        { name: 'services', score: 30, matchFunction: (t) => hasDirectFolder('services', t) },
        { name: 'routes', score: 20, matchFunction: (t) => hasDirectFolder('routes', t) },
        { name: 'controllers', score: 15, matchFunction: (t) => hasDirectFolder('controllers', t) },
        { name: 'models', score: 10, matchFunction: (t) => hasDirectFolder('models', t) },
        { name: 'middleware', score: 5, matchFunction: (t) => hasDirectFolder('middleware', t) },
        // Yaygın monolitik alt klasörler
        { name: 'common', score: 5, matchFunction: (t) => hasDirectFolder('common', t) },
        { name: 'utils', score: 5, matchFunction: (t) => hasDirectFolder('utils', t) },


        // Modular Monolithic
        { name: 'modules', score: 50, matchFunction: (t) => hasDirectFolder('modules', t) },
        { name: 'modules_nested_example', score: 20, matchFunction: (t) => hasNestedFolders('modules', ['auth', 'user', 'order'], t) },
        { name: 'components', score: 10, matchFunction: (t) => hasDirectFolder('components', t) },

        // Microservices
        { name: 'services_root', score: 40, matchFunction: (t) => hasDirectFolder('services', t) && Object.keys(t.services as FileTree).length > 2 },
        { name: 'gateways', score: 25, matchFunction: (t) => hasDirectFolder('gateways', t) }, // API GATEWAY
        { name: 'reverse_proxies', score: 20, matchFunction: (t) => hasDirectFolder('reverse-proxies', t) }, // NGİNX/ENVOY Constructions
        { name: 'shared_libraries', score: 10, matchFunction: (t) => hasDirectFolder('shared', t) && hasDirectFolder('libs', t) }, // Shared code warehouses


        // Serverless
        { name: 'functions', score: 60, matchFunction: (t) => hasDirectFolder('functions', t) },
        { name: 'handlers', score: 20, matchFunction: (t) => hasDirectFolder('handlers', t) },
        { name: 'serverless_yml', score: 30, matchFunction: (t) => hasDirectFolder('serverless.yml', t) },

        // Event-Driven
        { name: 'events', score: 60, matchFunction: (t) => hasDirectFolder('events', t) },
        { name: 'listeners', score: 20, matchFunction: (t) => hasDirectFolder('listeners', t) },
        { name: 'consumers', score: 20, matchFunction: (t) => hasDirectFolder('consumers', t) },
        { name: 'producers', score: 20, matchFunction: (t) => hasDirectFolder('producers', t) },
        { name: 'queues', score: 15, matchFunction: (t) => hasDirectFolder('queues', t) }, // RabbitMQ, Kafka config

        // Clean Architecture (Ports & Adapters)
        { name: 'adapters_ports', score: 70, matchFunction: (t) => hasDirectFolder('adapters', t) && hasDirectFolder('ports', t) },
        { name: 'domain', score: 20, matchFunction: (t) => hasDirectFolder('domain', t) },
        { name: 'application', score: 20, matchFunction: (t) => hasDirectFolder('application', t) },
        { name: 'infrastructure', score: 20, matchFunction: (t) => hasDirectFolder('infrastructure', t) },

        // CQRS (Command Query Responsibility Segregation)
        { name: 'commands_queries', score: 70, matchFunction: (t) => hasDirectFolder('commands', t) && hasDirectFolder('queries', t) },
        { name: 'handlers_cqrs', score: 15, matchFunction: (t) => hasDirectFolder('commandHandlers', t) && hasDirectFolder('queryHandlers', t) },

        // Micro-Frontend
        { name: 'microfrontends', score: 70, matchFunction: (t) => hasDirectFolder('microfrontends', t) },
        { name: 'web_components', score: 20, matchFunction: (t) => hasDirectFolder('web-components', t) },
        { name: 'shared_ui', score: 15, matchFunction: (t) => hasDirectFolder('shared-ui', t) },
    ];

    // Scoring cycle //* Puanlama döngüsü
    for (const indicator of indicators) {
        if (indicator.matchFunction(tree)) {
            if (indicator.name.includes('modules')) scores.modularMonolithic += indicator.score;
            else if (indicator.name.includes('services')) scores.monolithic += indicator.score;  //General Services //* Genel servisler
            else if (indicator.name === 'services_root') scores.microservices += indicator.score; //Root Level Services //* Kök seviye servisler
            else if (indicator.name.includes('routes')) scores.monolithic += indicator.score;
            else if (indicator.name.includes('functions') || indicator.name.includes('serverless')) scores.serverless += indicator.score;
            else if (indicator.name.includes('events') || indicator.name.includes('listeners') || indicator.name.includes('consumers') || indicator.name.includes('producers') || indicator.name.includes('queues')) scores.eventDriven += indicator.score;
            else if (indicator.name.includes('adapters') || indicator.name.includes('ports') || indicator.name.includes('domain') || indicator.name.includes('application') || indicator.name.includes('infrastructure')) scores.cleanArch += indicator.score;
            else if (indicator.name.includes('commands') || indicator.name.includes('queries') || indicator.name.includes('handlers_cqrs')) scores.cqrs += indicator.score;
            else if (indicator.name.includes('microfrontends') || indicator.name.includes('web_components') || indicator.name.includes('shared_ui')) scores.microFrontend += indicator.score;
            else if (indicator.name.includes('gateways') || indicator.name.includes('reverse_proxies') || indicator.name.includes('shared_libraries')) scores.microservices += indicator.score;
            else if (indicator.name.includes('controllers') || indicator.name.includes('models') || indicator.name.includes('middleware')) scores.monolithic += indicator.score;
            else if (indicator.name.includes('common') || indicator.name.includes('utils')) scores.monolithic += indicator.score;
        }
    }

    //More than one architecture to score on a particular threshold //* Birden fazla mimarinin belirli bir eşiğin üzerinde skor alması
    const highScoringArchitectures = Object.entries(scores).filter(([, score]) => score >= 50 && score < 100); //Maybe if it is close to 100, it is already clear //* 100'e yakınsa belki zaten nettir

    if (highScoringArchitectures.length >= 2) {
        scores.hybrid += 40; //If there are two or more high score architecture //* İki veya daha fazla yüksek skorlu mimari varsa
    }

    const entries = Object.entries(scores);
    entries.sort((a, b) => b[1] - a[1]);

    const topArchitectureType = entries[0][0];
    let topArchitectureConfidence = entries[0][1];

    // Reliability Setting: If the difference between the highest and second highest score is low, reduce confidence //* Güvenilirlik ayarı: En yüksek ve ikinci en yüksek skor arasındaki fark az ise güveni düşürülür
    if (entries.length > 1) {
        const secondTopConfidence = entries[1][1];
        const difference = topArchitectureConfidence - secondTopConfidence;

        if (difference < 20) { //If the difference is less than 20, reduce confidence //* Eğer fark 20'den az ise, güveni düşür
            topArchitectureConfidence -= (20 - difference); //The less the difference, the more //* Fark ne kadar azsa o kadar düşür
            if (topArchitectureConfidence < 0) topArchitectureConfidence = 0; // Don't fall to negative //* Negatife düşmesin
        }
    }

    const maxPossibleScore = 100;
    let totalPossibleScore = 0;
    indicators.forEach(ind => {
        //We can collect and how much each indicator adds to the maximum architecture and can do other analyzes in the future.
        //* Her indikatörün maksimum hangi mimariye ne kadar puan kattığını toplayıp başka analizlerde yapabiliriz ileride
    });

    topArchitectureConfidence = Math.min(topArchitectureConfidence, 100);


    return {
        type: topArchitectureType,
        confidence: topArchitectureConfidence,
        details: scores,
        suggestions: ["Consider adding more specific file/folder patterns for higher accuracy.", "Integrate content analysis for key configuration files (e.g., package.json, serverless.yml)."]
    };
};
