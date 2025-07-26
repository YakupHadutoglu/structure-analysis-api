export interface FileTree {
    [key: string]: FileTree | null;
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
