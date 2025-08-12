import { FileTree } from '../types/analyzer';

export interface NamingCheckResult {
    errors: string[];
    warnings: string[];
    stats: {
        totalFiles: number;
        validFiles: number;
        conventions: {
            kebabCase: number;
            pascalCase: number;
            camelCase: number;
            snakeCase: number;
            upperSnake: number;
            unknown: number;
        };
    };
}

const NAMING_STANDARDS = {
    KEBAB_CASE: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    PASCAL_CASE: /^[A-Z][a-zA-Z0-9]*$/,
    CAMEL_CASE: /^[a-z][a-zA-Z0-9]*$/,
    SNAKE_CASE: /^[a-z0-9]+(?:_[a-z0-9]+)*$/,
    UPPER_SNAKE: /^[A-Z0-9]+(?:_[A-Z0-9]+)*$/
};

const CONFIG = {
    STANDARD_FILES: [
        '.env', '.gitignore', 'README.md', 'package.json', 'package-lock.json',
        'tsconfig.json', 'jest.config.js', 'webpack.config.js', 'vite.config.ts',
        'next.config.js', 'docker-compose.yml', 'Dockerfile', 'LICENSE'
    ],
    EXCLUDED_FOLDERS: ['node_modules', '.git', 'dist', 'build', '.next', '.cache']
};

const createNameValidator = () => {
    const detectNamingConvention = (name: string): string => {
        if (NAMING_STANDARDS.KEBAB_CASE.test(name)) return 'kebab-case';
        if (NAMING_STANDARDS.PASCAL_CASE.test(name)) return 'PascalCase';
        if (NAMING_STANDARDS.CAMEL_CASE.test(name)) return 'camelCase';
        if (NAMING_STANDARDS.SNAKE_CASE.test(name)) return 'snake_case';
        if (NAMING_STANDARDS.UPPER_SNAKE.test(name)) return 'UPPER_SNAKE';
        return 'unknown';
    };

    return (name: string): { isValid: boolean; convention?: string } => {
        if (CONFIG.STANDARD_FILES.includes(name) || name.startsWith('.')) {
            return { isValid: true };
        }

        const [baseName, ...extParts] = name.split('.');
        const extension = extParts.join('.');

        if (extension.startsWith('d.ts') && NAMING_STANDARDS.PASCAL_CASE.test(baseName)) {
            return { isValid: true, convention: 'PascalCase' };
        }

        const convention = detectNamingConvention(baseName);
        return { isValid: convention !== 'unknown', convention };
    };
};

export const checkNaming = (fileTree: FileTree): NamingCheckResult => {
    const result: NamingCheckResult = {
        errors: [],
        warnings: [],
        stats: {
            totalFiles: 0,
            validFiles: 0,
            conventions: {
                kebabCase: 0,
                pascalCase: 0,
                camelCase: 0,
                snakeCase: 0,
                upperSnake: 0,
                unknown: 0
            }
        }
    };

    const validateName = createNameValidator();
    const stack: { tree: FileTree; path: string }[] = [{ tree: fileTree, path: '' }];

    while (stack.length > 0) {
        const { tree: currentTree, path: currentPath } = stack.pop()!;

        for (const name in currentTree) {
            if (CONFIG.EXCLUDED_FOLDERS.includes(name)) continue;

            const fullPath = currentPath ? `${currentPath}/${name}` : name;
            const child = currentTree[name];

            if (child && typeof child === 'object') {
                stack.push({ tree: child as FileTree, path: fullPath });
                continue;
            }

            result.stats.totalFiles++;
            const { isValid, convention } = validateName(name);

            if (isValid) {
                result.stats.validFiles++;
                if (convention) {
                    const key = convention.replace(/-|_/g, '').toLowerCase() + 'Case';
                    if (key in result.stats.conventions) {
                        // @ts-expect-error TS type narrowing for dynamic key
                        result.stats.conventions[key]++;
                    }
                }
            } else {
                result.errors.push(`Invalid naming: ${fullPath} (Expected: kebab-case, PascalCase, camelCase or snake_case)`);
                result.stats.conventions.unknown++;
            }
        }
    }

    if (result.stats.conventions.unknown > 0) {
        result.warnings.push(`Found ${result.stats.conventions.unknown} files with non-standard naming`);
    }

    return result;
};
