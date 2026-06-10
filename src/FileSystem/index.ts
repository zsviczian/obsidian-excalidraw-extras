import { App } from "obsidian";

export const FILESYSTEM_COMPONENT_VERSION = '1.0.0';

export function getFileSystemVersion(): string {
  return FILESYSTEM_COMPONENT_VERSION;
}

export const readLocalFile = async (
  filePath: string,
  app: App
): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    // We cast to any to safely access the desktop 'fs' object
    const adapter = app.vault.adapter as any;
    if (!adapter.fs) {
      reject(new Error("File system access is not available on this device."));
      return;
    }

    adapter.fs.readFile(filePath, "utf8", (err: any, data: string) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

export const readLocalFileBinary = async (
  filePath: string,
  app: App
): Promise<ArrayBuffer | null> => {
  return new Promise((resolve, reject) => {
    const path = decodeURI(filePath);
    const adapter = app.vault.adapter as any;
    if (!adapter.fs) {
      reject(new Error("File system access is not available on this device."));
      return;
    }

    adapter.fs.readFile(path, (err: any, data: Buffer) => {
      if (err) {
        reject(err);
      } else {
        const arrayBuffer = data.buffer.slice(
          data.byteOffset,
          data.byteOffset + data.byteLength,
        ) as ArrayBuffer;
        resolve(arrayBuffer);
      }
    });
  });
};