import fs from 'fs';
import path from 'path';
import xml2js from 'xml2js';
import ini from 'ini';
import toml from 'toml';

/**
 * Enhanced dependency report interface.
 * //* Gelişmiş bağımlılık raporu arayüzü.
 */
export interface DependencyReport {
    technologies: string[]; //Detected Technologies (Node.JS, Java, Python, etc.)
    dependencies: LibraryDependency[]; //Libraries and version information
    packageManagers: string[]; //Package Managers Used
    buildTools: string[]; //Build vehicles used (WebPack, Maven, Gradle, etc.)
    ciTools: string[]; //Used CI/CD Tools (Jenkins, Github Actions, etc.)
    framework?: string; //Main library detection (React, Spring, Django, vb.)
    securityAdvisories: SecurityAdvisory[]; //security vulnerability warnings
}

export interface LibraryDependency {
    name: string;
    version: string;
    type: 'production' | 'development' | 'peer';
    latestVersion?: string; //Latest version information //* En son sürüm bilgisi
    deprecated?: boolean; //Is it removed from use? //* Kullanımdan kaldırılmış mı?
    vulnerability?: VulnerabilityInfo; //security vulnerability information//* Güvenlik açığı bilgisi
}

export interface VulnerabilityInfo {
    severity: 'low' | 'medium' | 'high' | 'critical';
    advisory: string;
    patchedVersions: string;
}

export interface SecurityAdvisory {
    library: string;
    severity: string;
    advisory: string;
    affectedVersions: string;
    patchedVersions: string;
}

/**
 * Analyzes project dependencies and returns an enhanced report.
 *//* Proje bağımlılıklarını analiz eder ve gelişmiş bir rapor döndürür.
 */
export const analyzeDependencies = async (projectPath: string): Promise<DependencyReport> => {
    const report: DependencyReport = {
        technologies: [],
        dependencies: [],
        packageManagers: [],
        buildTools: [],
        ciTools: [],
        securityAdvisories: []
    };

    // Run all analysis functions collectively//* Tüm analiz fonksiyonlarını toplu olarak çalıştır
    await analyzePackageFiles(projectPath, report);
    detectBuildTools(projectPath, report);
    detectCITools(projectPath, report);
    detectFrameworks(projectPath, report);
    await checkSecurityVulnerabilities(report);

    //Clean Repeated Values //* Tekrarlayan değerleri temizle
    report.technologies = [...new Set(report.technologies)];
    report.packageManagers = [...new Set(report.packageManagers)];
    report.buildTools = [...new Set(report.buildTools)];
    report.ciTools = [...new Set(report.ciTools)];

    console.log('[DEPENDENCY_ANALYZER] Enhanced analysis complete');
    return report;
};

/**
 * Analyzes all package management files
 * //* Tüm paket yönetim dosyalarını analiz eder
 */
async function analyzePackageFiles(projectPath: string, report: DependencyReport) {
    const packageFiles = [
        { name: 'package.json', handler: analyzePackageJson },
        { name: 'pom.xml', handler: analyzePomXml },
        { name: 'build.gradle', handler: analyzeGradleFile },
        { name: 'build.gradle.kts', handler: analyzeGradleFile },
        { name: 'requirements.txt', handler: analyzeRequirementsTxt },
        { name: 'Pipfile', handler: analyzePipfile },
        { name: 'pyproject.toml', handler: analyzePyprojectToml },
        { name: 'composer.json', handler: analyzeComposerJson },
        { name: 'Cargo.toml', handler: analyzeCargoToml },
        { name: 'go.mod', handler: analyzeGoMod },
        { name: 'Podfile', handler: analyzePodfile },
        { name: 'Gemfile', handler: analyzeGemfile },
        { name: 'mix.exs', handler: analyzeMixExs },
    ];

    for (const { name, handler } of packageFiles) {
        const filePath = path.join(projectPath, name);
        if (fs.existsSync(filePath)) {
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                await handler(content, filePath, report);
                console.log(`[DEPENDENCY_ANALYZER] Processed ${name}`);
            } catch (error) {
                console.error(`[DEPENDENCY_ANALYZER] Error processing ${name}:`, error);
            }
        }
    }
}

//package.json analysis
async function analyzePackageJson(content: string, filePath: string, report: DependencyReport) {
    try {
        const data = JSON.parse(content);
        report.technologies.push('Node.js', 'JavaScript/TypeScript');
        report.packageManagers.push(data.name?.includes('yarn') ? 'yarn' : 'npm');

        //Collect addictions //* Bağımlılıkları topla
        collectDependencies(data.dependencies, 'production', report);
        collectDependencies(data.devDependencies, 'development', report);
        collectDependencies(data.peerDependencies, 'peer', report);

        //Framework detection//* Framework tespiti
        if (data.dependencies) {
            if ('react' in data.dependencies) report.framework = 'React';
            else if ('vue' in data.dependencies) report.framework = 'Vue';
            else if ('@angular/core' in data.dependencies) report.framework = 'Angular';
            else if ('next' in data.dependencies) report.framework = 'Next.js';
            else if ('express' in data.dependencies) report.framework = 'Express';
        }

        //Build Tools //* Build araçları
        if (data.scripts) {
            if (data.scripts.build?.includes('webpack')) report.buildTools.push('Webpack');
            if (data.scripts.build?.includes('vite')) report.buildTools.push('Vite');
            if (data.scripts.build?.includes('rollup')) report.buildTools.push('Rollup');
        }
    } catch (error) {
        console.error('[DEPENDENCY_ANALYZER] Error parsing package.json', error);
    }
}

// Maven pom.xml analysis
async function analyzePomXml(content: string, filePath: string, report: DependencyReport) {
    try {
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(content);
        const project = result.project || {};

        report.technologies.push('Java');
        report.packageManagers.push('Maven');

        //Framework detection//* Framework tespiti
        if (project.dependencies) {
            const deps = project.dependencies[0].dependency || [];
            if (deps.some((d: any) => d.groupId[0] === 'org.springframework')) {
                report.framework = 'Spring';
            }
        }

        //Collect addictions//* Bağımlılıkları topla
        if (project.dependencies && project.dependencies[0].dependency) {
            project.dependencies[0].dependency.forEach((dep: any) => {
                const groupId = dep.groupId[0];
                const artifactId = dep.artifactId[0];
                const version = dep.version?.[0] || 'unknown';

                report.dependencies.push({
                    name: `${groupId}:${artifactId}`,
                    version,
                    type: 'production'
                });
            });
        }
    } catch (error) {
        console.error('[DEPENDENCY_ANALYZER] Error parsing pom.xml', error);
    }
}

// Gradle file analysis
async function analyzeGradleFile(content: string, filePath: string, report: DependencyReport) {
    try {
        report.technologies.push('Java', 'Kotlin');
        report.packageManagers.push('Gradle');

        //Find addictions//* Bağımlılıkları bul
        const depRegex = /(implementation|compile|api|testImplementation)\s+['"]([^'"]+)['"]/g;
        let match;

        while ((match = depRegex.exec(content)) !== null) {
            const [_, type, dep] = match;
            const parts = dep.split(':');
            if (parts.length >= 2) {
                const name = `${parts[0]}:${parts[1]}`;
                const version = parts.length >= 3 ? parts[2] : 'unknown';

                report.dependencies.push({
                    name,
                    version,
                    type: type.includes('test') ? 'development' : 'production'
                });
            }
        }
    } catch (error) {
        console.error('[DEPENDENCY_ANALYZER] Error parsing Gradle file', error);
    }
}

// Python requirements.txt analysis
async function analyzeRequirementsTxt(content: string, filePath: string, report: DependencyReport) {
    try {
        report.technologies.push('Python');
        report.packageManagers.push('pip');

        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [name, version] = trimmed.split(/[=<>~]/);
                if (name) {
                    report.dependencies.push({
                        name: name.trim(),
                        version: version?.trim() || 'unknown',
                        type: 'production'
                    });
                }
            }
        }
    } catch (error) {
        console.error('[DEPENDENCY_ANALYZER] Error parsing requirements.txt', error);
    }
}

// Pipfile analysis
async function analyzePipfile(content: string, filePath: string, report: DependencyReport) {
    try {
        report.technologies.push('Python');
        report.packageManagers.push('pipenv');

        const data = toml.parse(content);

        //Collect the packages //* Paketleri topla
        if (data.packages) {
            Object.entries(data.packages).forEach(([name, version]) => {
                report.dependencies.push({
                    name,
                    version: version as string || 'unknown',
                    type: 'production'
                });
            });
        }

        if (data.dev_packages) {
            Object.entries(data.dev_packages).forEach(([name, version]) => {
                report.dependencies.push({
                    name,
                    version: version as string || 'unknown',
                    type: 'development'
                });
            });
        }
    } catch (error) {
        console.error('[DEPENDENCY_ANALYZER] Error parsing Pipfile', error);
    }
}

// pyproject.toml analysis
async function analyzePyprojectToml(content: string, filePath: string, report: DependencyReport) {
    try {
        report.technologies.push('Python');
        report.packageManagers.push('poetry');

        const data = toml.parse(content);

        //Collect the packages//* Paketleri topla
        if (data.tool?.poetry?.dependencies) {
            Object.entries(data.tool.poetry.dependencies).forEach(([name, info]) => {
                if (name !== 'python') return;
                let version: string;
                if (typeof info === 'string')
                    if (name !== 'python' && info !== null && typeof info === 'object') {
                        const version = typeof info === 'string' ? info : info['version'] || 'unknown';
                        report.dependencies.push({
                            name,
                            version,
                            type: 'production'
                        });
                    }
            });
        }

        if (data.tool?.poetry?.dev_dependencies) {
            Object.entries(data.tool.poetry.dev_dependencies).forEach(([name, info]) => {
                let version = 'unknown';
                if (typeof info === 'string') {
                    version = info;
                } else if (info && typeof info === 'object' && 'version' in info) {
                    version = (version as { version?: string }).version ?? 'unknown'
                }
                report.dependencies.push({
                    name,
                    version,
                    type: 'development'
                });
            });
        }
    } catch (error) {
        console.error('[DEPENDENCY_ANALYZER] Error parsing pyproject.toml', error);
    }
}

// Composer.json analysis (PHP)
async function analyzeComposerJson(content: string, filePath: string, report: DependencyReport) {
    try {
        const data = JSON.parse(content);
        report.technologies.push('PHP');
        report.packageManagers.push('composer');

        // Framework detection //* Framework tespiti
        if (data.require) {
            if ('laravel/framework' in data.require) report.framework = 'Laravel';
            else if ('symfony/symfony' in data.require) report.framework = 'Symfony';
        }

        //Collect addictions//* Bağımlılıkları topla
        collectDependencies(data.require, 'production', report);
        collectDependencies(data['require-dev'], 'development', report);
    } catch (error) {
        console.error('[DEPENDENCY_ANALYZER] Error parsing composer.json', error);
    }
}

// Cargo.toml analysis (Rust)
async function analyzeCargoToml(content: string, filePath: string, report: DependencyReport) {
    try {
        const data = toml.parse(content);
        report.technologies.push('Rust');
        report.packageManagers.push('cargo');

        // Collect addictions //* Bağımlılıkları topla
        if (data.dependencies) {
            Object.entries(data.dependencies).forEach(([name, info]) => {
                let version = 'unknown';
                if (typeof info === 'string') {
                    version = info;
                } else if (info && typeof info === 'object' && 'version' in info) {
                    version = (version as { version?: string }).version ?? 'unknown'
                }
                report.dependencies.push({
                    name,
                    version,
                    type: 'production'
                });
            });
        }
    } catch (error) {
        console.error('[DEPENDENCY_ANALYZER] Error parsing Cargo.toml', error);
    }
}


//go.mod analysis (Go)
async function analyzeGoMod(content: string, filePath: string, report: DependencyReport) {
    try {
        report.technologies.push('Go');
        report.packageManagers.push('go modules');

        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('require ')) {
                const parts = trimmed.split(/\s+/);
                if (parts.length >= 3) {
                    const [_, name, version] = parts;
                    report.dependencies.push({
                        name,
                        version,
                        type: 'production'
                    });
                }
            }
        }
    } catch (error) {
        console.error('[DEPENDENCY_ANALYZER] Error parsing go.mod', error);
    }
}


// Podfile analysis (iOS)
async function analyzePodfile(content: string, filePath: string, report: DependencyReport) {
    try {
        report.technologies.push('Swift', 'Objective-C');
        report.packageManagers.push('CocoaPods');

        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('pod ')) {
                const match = trimmed.match(/pod\s+['"]([^'"]+)['"](?:,\s*['"]([^'"]+)['"])?/);
                if (match) {
                    report.dependencies.push({
                        name: match[1],
                        version: match[2] || 'latest',
                        type: 'production'
                    });
                }
            }
        }
    } catch (error) {
        console.error('[DEPENDENCY_ANALYZER] Error parsing Podfile', error);
    }
}


// Gemfile analysis (Ruby)
async function analyzeGemfile(content: string, filePath: string, report: DependencyReport) {
    try {
        report.technologies.push('Ruby');
        report.packageManagers.push('bundler');

        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('gem ')) {
                const match = trimmed.match(/gem\s+['"]([^'"]+)['"](?:,\s*['"]([^'"]+)['"])?/);
                if (match) {
                    report.dependencies.push({
                        name: match[1],
                        version: match[2] || 'latest',
                        type: 'production'
                    });

                    if (match[1] === 'rails') {
                        report.framework = 'Ruby on Rails';
                    }
                }
            }
        }
    } catch (error) {
        console.error('[DEPENDENCY_ANALYZER] Error parsing Gemfile', error);
    }
}


// mix.exs analysis (Elixir)
async function analyzeMixExs(content: string, filePath: string, report: DependencyReport) {
    try {
        report.technologies.push('Elixir');
        report.packageManagers.push('mix');

        const depsRegex = /defp deps do\s*\[([\s\S]*?)\]\s*end/g;
        const match = depsRegex.exec(content);

        if (match) {
            const depsBlock = match[1];
            const depLines = depsBlock.split('\n').filter(line => line.includes(':'));

            for (const line of depLines) {
                const match = line.match(/\{:\s*([^,]+)\s*,\s*["']([^"']+)["']/);
                if (match) {
                    report.dependencies.push({
                        name: match[1],
                        version: match[2],
                        type: 'production'
                    });
                }
            }
        }
    } catch (error) {
        console.error('[DEPENDENCY_ANALYZER] Error parsing mix.exs', error);
    }
}


// Collects dependencies in bulk //* Bağımlılıkları toplu olarak toplar
function collectDependencies(deps: Record<string, string> | undefined, type: 'production' | 'development' | 'peer', report: DependencyReport) {
    if (deps) {
        Object.entries(deps).forEach(([name, version]) => {
            report.dependencies.push({
                name,
                version,
                type
            });
        });
    }
}

//Detects build tools //* Build araçlarını tespit eder
function detectBuildTools(projectPath: string, report: DependencyReport) {
    const buildToolFiles = {
        'Webpack': 'webpack.config.js',
        'Vite': 'vite.config.js',
        'Rollup': 'rollup.config.js',
        'Parcel': 'parcel.config.js',
        'Babel': '.babelrc',
        'ESLint': '.eslintrc',
        'Gulp': 'gulpfile.js',
        'Grunt': 'Gruntfile.js',
        'Make': 'Makefile',
        'CMake': 'CMakeLists.txt',
        'Maven': 'pom.xml',
        'Gradle': 'build.gradle',
        'SBT': 'build.sbt',
        'Ant': 'build.xml',
        'MSBuild': '*.csproj',
        'Dotnet': '*.sln',
    };

    for (const [tool, pattern] of Object.entries(buildToolFiles)) {
        if (pattern.includes('*')) {
            const files = fs.readdirSync(projectPath);
            if (files.some(file => file.endsWith(pattern.split('*')[1]))) {
                report.buildTools.push(tool);
            }
        } else if (fs.existsSync(path.join(projectPath, pattern))) {
            report.buildTools.push(tool);
        }
    }
}

//Detects CI/CD tools //* CI/CD araçlarını tespit eder
function detectCITools(projectPath: string, report: DependencyReport) {
    const ciToolFiles = {
        'GitHub Actions': '.github/workflows',
        'GitLab CI': '.gitlab-ci.yml',
        'Jenkins': 'Jenkinsfile',
        'Travis CI': '.travis.yml',
        'CircleCI': '.circleci/config.yml',
        'Azure Pipelines': 'azure-pipelines.yml',
        'Bitbucket Pipelines': 'bitbucket-pipelines.yml',
        'TeamCity': 'teamcity.gradle',
        'Bamboo': 'bamboo-specs',
        'AWS CodeBuild': 'buildspec.yml',
    };

    for (const [tool, pattern] of Object.entries(ciToolFiles)) {
        if (pattern.includes('/')) {
            if (fs.existsSync(path.join(projectPath, pattern))) {
                report.ciTools.push(tool);
            }
        } else if (fs.existsSync(path.join(projectPath, pattern))) {
            report.ciTools.push(tool);
        }
    }
}

// framework detection

function detectFrameworks(projectPath: string, report: DependencyReport) {
    if (!report.framework) {
        //Additional framework detection mechanisms //* Ek framework tespit mekanizmaları
        if (fs.existsSync(path.join(projectPath, 'manage.py'))) report.framework = 'Django';
        if (fs.existsSync(path.join(projectPath, 'config.ru'))) report.framework = 'Ruby on Rails';
        if (fs.existsSync(path.join(projectPath, 'project.clj'))) report.framework = 'Clojure';
        if (fs.existsSync(path.join(projectPath, 'dub.sdl'))) report.framework = 'Dlang';
    }
}

//Security vulnerability check (simulated) //* Güvenlik açığı kontrolü (simüle edilmiş)
async function checkSecurityVulnerabilities(report: DependencyReport) {
    const vulnerabilities: Record<string, VulnerabilityInfo> = {
        'lodash': {
            severity: 'high',
            advisory: 'Prototype Pollution vulnerability',
            patchedVersions: '>=4.17.12'
        },
        'express': {
            severity: 'medium',
            advisory: 'Open Redirect vulnerability',
            patchedVersions: '>=4.17.3'
        },
        'log4j-core': {
            severity: 'critical',
            advisory: 'Remote Code Execution (Log4Shell)',
            patchedVersions: '>=2.17.1'
        }
    };

    report.dependencies.forEach(dep => {
        const vuln = vulnerabilities[dep.name];
        if (vuln) {
            dep.vulnerability = vuln;
            report.securityAdvisories.push({
                library: dep.name,
                severity: vuln.severity,
                advisory: vuln.advisory,
                affectedVersions: dep.version,
                patchedVersions: vuln.patchedVersions
            });
        }
    });
}
