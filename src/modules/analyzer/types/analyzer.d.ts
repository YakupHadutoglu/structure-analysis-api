export type FileTree = {
    [key: string]: FileTree | FileMeta | SymlinkMeta | null;
};

export interface FileMeta {
    type: 'file';
    size: number;
    modified: Date;
}

export interface SymlinkMeta {
    type: 'symlink';
    target: string;
}


export interface ArchitectureGuess {
    type: string;
    confidence: number; // Normalized confidence between 0-100
    details: Record<string, number>; // The raw scores of every architecture
    matchedIndicators: Record<string, string[]>; // Which indicators matched for which architecture
    suggestions?: string[]; // Recommendations on how to develop estimated (Optional)
}

export interface ArchitectureIndicator {
    id: string;
    description: string;
    score: number; // How many points will the existing indicator add
    architectures: string[]; // Which architecture will add points to (more than one)
    matchFunction: (tree: FileTree) => boolean; // The function that controls whether the indicator exists in the existing file tree
    negativeImpact?: {
        architectures: string[];
        score: number;
    };
}

export interface ArchitectureDefinition {
    id: string;
    name: string;
    description: string;
}

export type ArchitectureDetails = Record<string, number>
export interface ArchitectureDetails {
    monolithic: number;
    microservices: number;
    serverless: number;
    eventDriven: number;
    hybrid: number;
    cleanArch: number;
    cqrs: number;
    microFrontend: number;
    ddd: number;
    modularMonolithic: number;
    hexagonal: number;
    eventSourcing: number;
    soa: number;
    apiFirst: number;
    tdd: number;
    bff: number;
    functional: number;
    reactive: number;
    domainDriven: number;
    microKernel: number;
    layered: number;
    nTier: number;
}
