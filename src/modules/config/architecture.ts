import { ArchitectureIndicator, ArchitectureDefinition, FileTree } from '../analyzer/types/analyzer';

const hasDirectFolder = (name: string, tree: FileTree) => name in tree && tree[name] !== null;
const hasFile = (name: string, tree: FileTree) => name in tree && tree[name] === null;

const hasNestedFolders = (parentName: string, subfolderNames: string[], tree: FileTree): boolean => {
    if (!hasDirectFolder(parentName, tree)) return false;
    const parentFolder = tree[parentName] as FileTree;
    return subfolderNames.every(name => hasDirectFolder(name, parentFolder));
};

export const ARCHITECTURES: ArchitectureDefinition[] = [
    { id: 'monolithic', name: 'Monolitik Mimari', description: 'Tek bir kod tabanında birleşik uygulama.' },
    { id: 'modularMonolithic', name: 'Modüler Monolitik Mimari', description: 'Modüllere ayrılmış, ancak tek bir deploy edilebilir birim.' },
    { id: 'microservices', name: 'Mikroservis Mimarisi', description: 'Bağımsız, küçük ve özel hizmetler.' },
    { id: 'serverless', name: 'Sunucusuz Mimari (Serverless)', description: 'Olay odaklı, fonksiyon bazlı bulut hizmetleri.' },
    { id: 'eventDriven', name: 'Olay Odaklı Mimari', description: 'Mesaj kuyrukları ve olaylarla iletişim kuran bileşenler.' },
    { id: 'cleanArch', name: 'Temiz Mimari / Portlar ve Adaptörler', description: 'Katmanlı, dış bağımlılıklardan izole edilmiş çekirdek mantık.' },
    { id: 'cqrs', name: 'CQRS (Command Query Responsibility Segregation)', description: 'Okuma ve yazma işlemlerini ayıran mimari.' },
    { id: 'microFrontend', name: 'Mikro Ön Uç (Micro-Frontend) Mimarisi', description: 'Bağımsız olarak geliştirilebilen ve deploy edilebilen UI parçaları.' },
    { id: 'hybrid', name: 'Hibrit Mimari', description: 'Birden fazla mimari stilinin birleşimi.' },
];

// --- Architectural Indicators //* Mimari Göstergeleri ---
export const ARCHITECTURE_INDICATORS: ArchitectureIndicator[] = [
    // --- Monolithic architectural indicators //* Monolitik Mimari Göstergeleri ---
    {
        id: 'mono_central_services',
        description: 'Kök dizinde merkezi "services" klasörü',
        score: 30,
        architectures: ['monolithic'],
        matchFunction: (t) => hasDirectFolder('services', t)
    },
    {
        id: 'mono_central_routes',
        description: 'Kök dizinde merkezi "routes" veya "controllers" klasörü',
        score: 25,
        architectures: ['monolithic'],
        matchFunction: (t) => hasDirectFolder('routes', t) || hasDirectFolder('controllers', t)
    },
    {
        id: 'mono_single_database_config',
        description: 'Tek bir veritabanı bağlantı/model klasörü (örn: "db", "models", "data")',
        score: 20,
        architectures: ['monolithic'],
        matchFunction: (t) => hasDirectFolder('db', t) || hasDirectFolder('models', t) || hasDirectFolder('data', t)
    },
    {
        id: 'mono_large_utils_common',
        description: 'Büyük, genel "utils" veya "common" klasörleri',
        score: 15,
        architectures: ['monolithic'],
        matchFunction: (t) => hasDirectFolder('utils', t) || hasDirectFolder('common', t)
    },

    // --- Modular monolithic architectural indicators //* Modüler Monolitik Mimari Göstergeleri ---
    {
        id: 'modular_modules_folder',
        description: 'Kök dizinde "modules" klasörü',
        score: 50,
        architectures: ['modularMonolithic'],
        matchFunction: (t) => hasDirectFolder('modules', t)
    },
    {
        id: 'modular_nested_modules',
        description: '"modules" altında birden fazla alt modül (örn: user, auth, product)',
        score: 30,
        architectures: ['modularMonolithic'],
        matchFunction: (t) => hasNestedFolders('modules', ['user', 'auth', 'product'], t)
    },
    {
        id: 'modular_features_folder',
        description: 'Kök dizinde "features" klasörü',
        score: 40,
        architectures: ['modularMonolithic'],
        matchFunction: (t) => hasDirectFolder('features', t)
    },

    // --- MicroServis Architecture Indicators //* Mikroservis Mimarisi Göstergeleri ---
    {
        id: 'micro_multi_service_folders',
        description: 'Kök dizinde birden fazla servis veya domain odaklı klasör (örn: auth-service, order-service)',
        score: 60,
        architectures: ['microservices'],
        matchFunction: (t) => {
            const topLevelFolders = Object.keys(t).filter(key => t[key] !== null);
            return topLevelFolders.some(folder => folder.includes('-service') || folder.includes('Service')) && topLevelFolders.length > 2;
        },
    },
    {
        id: 'micro_api_gateway',
        description: '"gateway" veya "proxy" klasörü/yapılandırması',
        score: 25,
        architectures: ['microservices'],
        matchFunction: (t) => hasDirectFolder('gateway', t) || hasDirectFolder('proxy', t)
    },
    {
        id: 'micro_shared_libs',
        description: 'Paylaşılan kütüphaneler için "shared" veya "libs" klasörü',
        score: 15,
        architectures: ['microservices'],
        matchFunction: (t) => hasDirectFolder('shared', t) || hasDirectFolder('libs', t)
    },

    // --- Serverless Indicators without server //* Sunucusuz Mimari (Serverless) Göstergeleri ---
    {
        id: 'serverless_functions_folder',
        description: 'Kök dizinde "functions" veya "handlers" klasörü',
        score: 60,
        architectures: ['serverless'],
        matchFunction: (t) => hasDirectFolder('functions', t) || hasDirectFolder('handlers', t)
    },
    {
        id: 'serverless_config_file',
        description: 'Serverless yapılandırma dosyası (örn: serverless.yml, sam-template.yaml)',
        score: 40,
        architectures: ['serverless'],
        matchFunction: (t) => hasFile('serverless.yml', t) || hasFile('template.yaml', t) || hasFile('sam-template.yaml', t)
    },

    // --- Event -oriented architectural indicators //* Olay Odaklı Mimari Göstergeleri ---
    {
        id: 'event_events_folder',
        description: 'Kök dizinde "events" klasörü',
        score: 55,
        architectures: ['eventDriven'],
        matchFunction: (t) => hasDirectFolder('events', t)
    },
    {
        id: 'event_consumers_producers',
        description: '"consumers" veya "producers" klasörleri',
        score: 25,
        architectures: ['eventDriven'],
        matchFunction: (t) => hasDirectFolder('consumers', t) || hasDirectFolder('producers', t) || hasDirectFolder('listeners', t)
    },
    {
        id: 'event_message_queues_config',
        description: 'Mesaj kuyruğu yapılandırma dosyaları (örn: kafka.config.ts, rabbitmq.js)',
        score: 20,
        architectures: ['eventDriven'],
        matchFunction: (t) => hasFile('kafka.config.ts', t) || hasFile('rabbitmq.js', t) || hasFile('sqs.ts', t)
    },

    // --- Clean Architecture /Ports and Adapters Indicators //* Temiz Mimari / Portlar ve Adaptörler Göstergeleri ---
    {
        id: 'clean_adapters_ports',
        description: '"adapters" ve "ports" klasörlerinin varlığı',
        score: 70,
        architectures: ['cleanArch'],
        matchFunction: (t) => hasDirectFolder('adapters', t) && hasDirectFolder('ports', t)
    },
    {
        id: 'clean_domain_application_infra',
        description: '"domain", "application", "infrastructure" klasörlerinin varlığı',
        score: 30,
        architectures: ['cleanArch'],
        matchFunction: (t) => hasDirectFolder('domain', t) && hasDirectFolder('application', t) && hasDirectFolder('infrastructure', t)
    },

    // --- CQRS Indicators //* CQRS Göstergeleri ---
    {
        id: 'cqrs_commands_queries',
        description: '"commands" ve "queries" klasörlerinin varlığı',
        score: 70,
        architectures: ['cqrs'],
        matchFunction: (t) => hasDirectFolder('commands', t) && hasDirectFolder('queries', t)
    },
    {
        id: 'cqrs_handlers',
        description: '"commandHandlers" ve "queryHandlers" klasörlerinin varlığı',
        score: 20,
        architectures: ['cqrs'],
        matchFunction: (t) => hasDirectFolder('commandHandlers', t) && hasDirectFolder('queryHandlers', t)
    },

    // --- Micro-Frontend) Architecture Indicators //* Mikro Ön Uç (Micro-Frontend) Mimarisi Göstergeleri ---
    {
        id: 'mfe_microfrontends_folder',
        description: 'Kök dizinde "microfrontends" veya "mfes" klasörü',
        score: 70,
        architectures: ['microFrontend'],
        matchFunction: (t) => hasDirectFolder('microfrontends', t) || hasDirectFolder('mfes', t)
    },
    {
        id: 'mfe_shared_ui_components',
        description: 'Paylaşılan UI bileşenleri için "shared-ui" veya "design-system" klasörü',
        score: 20,
        architectures: ['microFrontend'],
        matchFunction: (t) => hasDirectFolder('shared-ui', t) || hasDirectFolder('design-system', t)
    },
];
