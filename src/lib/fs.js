import fs from 'socket:fs'
import path from 'socket:path'

export async function rm (directory) {
  try {
    const files = await fs.promises.readdir(directory, { withFileTypes: true })

    for (const file of files) {
      const filePath = path.join(directory, file.name)

      if (file.isDirectory()) {
        await rm(filePath)
      } else {
        await fs.promises.unlink(filePath)
      }
    }

    await fs.promises.rmdir(directory)
  } catch {}
}

export async function cp (srcDir, destDir) {
  await fs.promises.mkdir(destDir, { recursive: true })
  const files = await fs.promises.readdir(srcDir, { withFileTypes: true })

  for (const file of files) {
    const srcPath = path.join(srcDir, file.name)
    const destPath = path.join(destDir, file.name)

    if (file.isDirectory()) {
      await cp(srcPath, destPath)
    } else {
      await fs.promises.copyFile(srcPath, destPath, fs.constants.COPYFILE_FICLONE)
    }
  }
}

export async function ls (dir, { root = dir, ignoreList = [] }) {
  let fileList = []
  const entries = await fs.promises.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const subDirFiles = await ls(fullPath, { root, ignoreList })
      fileList = fileList.concat(subDirFiles)
    } else {
      fileList.push(path.relative(root, fullPath))
    }
  }

  return fileList
}
