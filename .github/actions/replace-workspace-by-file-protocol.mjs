/**
 * Temporarily, pnpm installs all monorepo packages when being run in node-linker=hoist mode.
 * So we run pnpm in its regular mode, which is not broken, and then reinstall node_modules with `npm i`.
 * Because pnpm uses workspace:* protocall to declare dependencies on local packages, we ned to replace them with file:/... protocall.
 * This is what this file for
 */
import fs from 'node:fs'
import path from 'node:path'

import { findWorkspacePackagesNoCheck } from '@pnpm/find-workspace-packages'

const [_1, _2, workspaceRootPath, distPath] = process.argv
const absoluteWorkspaceRootPath = path.isAbsolute(workspaceRootPath)
    ? workspaceRootPath
    : path.join(process.cwd(), workspaceRootPath)

const absoluteDistPath = path.isAbsolute(distPath) ? distPath : path.join(process.cwd(), distPath)

// node ./replace-workspace-protocol-by-version.mjs ./deployed-package/package.json

const projects = await findWorkspacePackagesNoCheck(absoluteWorkspaceRootPath)
// first elem of returned array is the root package.json, the monorepo itself --> discard that
const [_rootProject, ...workspaceProjects] = projects
const distPackageJsonPath = path.join(absoluteDistPath, 'package.json')
const distPackageJsonContent = JSON.parse(await fs.promises.readFile(distPackageJsonPath, 'utf-8'))

console.log({ absoluteDistPath, absoluteWorkspaceRootPath })

/**
 * @param {{[key: string]: string}} dependencies
 */
function replaceWorkspaceByFileProtocol(dependencies) {
    if (typeof dependencies !== 'object' || dependencies === null) {
        return
    }

    for (const [pkgName, pkgVersion] of Object.entries(dependencies)) {
        if (pkgVersion.startsWith('workspace:')) {
            const matchingWorkspaceProject = workspaceProjects.find(project => project.manifest.name === pkgName)
            dependencies[pkgName] = `file:${matchingWorkspaceProject.dir}`
        }
    }
}

replaceWorkspaceByFileProtocol(distPackageJsonContent.dependencies)
replaceWorkspaceByFileProtocol(distPackageJsonContent.devDependencies)
replaceWorkspaceByFileProtocol(distPackageJsonContent.peerDependencies)
replaceWorkspaceByFileProtocol(distPackageJsonContent.optionalDependencies)

await fs.promises.writeFile(distPackageJsonPath, JSON.stringify(distPackageJsonContent, undefined, 2), 'utf-8')
