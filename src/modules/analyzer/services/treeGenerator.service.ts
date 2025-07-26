import { dir } from 'console';
import * as fs from 'fs/promises';
import * as path from 'path';

export type FileTree = {
    [key: string]: FileTree | null;
}

/**
 * @param dirPath //file path to be processed
 * @returns
 */

export const generateTree = async (dirPath: string | Express.Multer.File): Promise<FileTree> => {
    const resolvedPath = typeof dirPath === 'string' ? dirPath : dirPath.path;
    const entries = await fs.readdir(resolvedPath, { withFileTypes: true })
    const tree: FileTree = {};

    for (const entry of entries) {
        if (entry.isDirectory()) {
            tree[entry.name] = await generateTree(path.join(resolvedPath, entry.name));
        } else {
            tree[entry.name] = null;
        }
    }

    return tree;
}
