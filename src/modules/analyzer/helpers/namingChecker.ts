export const checkNaming = (fileTree: any): string[] => {
    const problems: string[] = [];

    const isValidName = (name: string) => {
        //only Kebab-Case //* sadece kebab-case
        return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name);
    };

    const checkRecursively = (tree: any, currentPath: string = '') => {
        for (const name in tree) {
            const fullPath = currentPath ? `${currentPath}/${name}` : name;
            if (!isValidName(name)) {
                problems.push(`⚠️ Geçersiz isim: ${fullPath}`);
            }

            const child = tree[name];
            if (child !== null) {
                checkRecursively(child, fullPath);
            }
        }
    };

    checkRecursively(fileTree);
    return problems;
};
