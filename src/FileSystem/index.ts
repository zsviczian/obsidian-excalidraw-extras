import { App } from 'obsidian';

export const FILESYSTEM_COMPONENT_VERSION = '1.0.0';

export function getFileSystemVersion(): string {
  return FILESYSTEM_COMPONENT_VERSION;
}

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'string') {
    return err;
  }
  return String(err);
};

declare module 'obsidian' {
  interface DataAdapter {
    fs?: {
      readFile(
        path: string,
        encoding: 'utf8',
        callback: (err: unknown, data: string) => void,
      ): void;
      readFile(
        path: string,
        callback: (err: unknown, data: unknown) => void,
      ): void;
    };
  }
}

export const readLocalFile = async (
  filePath: string,
  app: App,
): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    // We cast to any to safely access the desktop 'fs' object
    const adapter = app.vault.adapter;
    if (!adapter.fs) {
      reject(new Error('File system access is not available on this device.'));
      return;
    }

    adapter.fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(new Error(`File Read Error: ${getErrorMessage(err)}`));
      } else {
        resolve(data);
      }
    });
  });
};

export const readLocalFileBinary = async (
  filePath: string,
  app: App,
): Promise<ArrayBuffer | null> => {
  return new Promise((resolve, reject) => {
    const path = decodeURI(filePath);
    const adapter = app.vault.adapter;
    if (!adapter.fs) {
      reject(new Error('File system access is not available on this device.'));
      return;
    }
    adapter.fs.readFile(path, (err, data) => {
      if (err) {
        reject(new Error(`File Read Error: ${getErrorMessage(err)}`));
      } else {
        if (data instanceof Uint8Array) {
          const arrayBuffer = data.buffer.slice(
            data.byteOffset,
            data.byteOffset + data.byteLength,
          ) as ArrayBuffer;
          resolve(arrayBuffer);
          return;
        }

        if (data instanceof ArrayBuffer) {
          resolve(data);
          return;
        }

        reject(new Error('File Read Error: Unexpected binary data type.'));
      }
    });
  });
};
