import { useCallback, useState } from 'react';
import type { DriveFile } from '../types';

export function extractFolderId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  const folderMatch = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) return folderMatch[1];
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) return trimmed;
  return null;
}

interface ListResponse {
  files?: Array<{
    id: string;
    name: string;
    mimeType: string;
    modifiedTime?: string;
    size?: string;
  }>;
  error?: { message: string; code: number };
}

export interface DriveLoadState {
  status: 'idle' | 'listing' | 'listed' | 'loading' | 'done' | 'error';
  error: string | null;
  files: DriveFile[];
}

export function useDriveLoader() {
  const [state, setState] = useState<DriveLoadState>({
    status: 'idle',
    error: null,
    files: [],
  });

  const listFolder = useCallback(async (folderUrlOrId: string, apiKey: string): Promise<boolean> => {
    const folderId = extractFolderId(folderUrlOrId);
    if (!folderId) {
      setState({ status: 'error', error: 'Konnte Ordner-ID aus dem Link nicht extrahieren.', files: [] });
      return false;
    }
    if (!apiKey) {
      setState({ status: 'error', error: 'Google API-Key fehlt.', files: [] });
      return false;
    }
    setState({ status: 'listing', error: null, files: [] });

    const q = encodeURIComponent(
      `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
    );
    const fields = encodeURIComponent('files(id,name,mimeType,modifiedTime,size)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=200&key=${apiKey}`;

    try {
      const res = await fetch(url);
      const data: ListResponse = await res.json();
      if (!res.ok) {
        const msg = data.error?.message ?? `HTTP ${res.status}`;
        let hint = '';
        if (res.status === 403) {
          hint = ' Bitte sicherstellen, dass der Ordner für "Jeder mit Link" freigegeben ist und der API-Key Zugriff auf die Drive API erlaubt.';
        }
        setState({ status: 'error', error: `Fehler beim Laden des Ordners: ${msg}.${hint}`, files: [] });
        return false;
      }
      const allFiles = data.files ?? [];
      const csvFiles = allFiles.filter((f) =>
        /\.(csv|tsv|txt)$/i.test(f.name) || /text\/csv|text\/tab-separated/i.test(f.mimeType ?? ''),
      );
      if (csvFiles.length === 0) {
        setState({
          status: 'listed',
          error: 'Keine CSV-Dateien im Ordner gefunden.',
          files: [],
        });
        return true;
      }
      const driveFiles: DriveFile[] = csvFiles.map((f) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        modifiedTime: f.modifiedTime,
        size: f.size,
        selected: true,
        status: 'idle',
      }));
      setState({ status: 'listed', error: null, files: driveFiles });
      return true;
    } catch (err) {
      setState({
        status: 'error',
        error: `Netzwerkfehler: ${err instanceof Error ? err.message : 'Unbekannt'}`,
        files: [],
      });
      return false;
    }
  }, []);

  const toggleFile = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      files: prev.files.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f)),
    }));
  }, []);

  const setAllSelected = useCallback((selected: boolean) => {
    setState((prev) => ({
      ...prev,
      files: prev.files.map((f) => ({ ...f, selected })),
    }));
  }, []);

  const updateFileStatus = useCallback(
    (id: string, status: DriveFile['status'], error?: string) => {
      setState((prev) => ({
        ...prev,
        files: prev.files.map((f) => (f.id === id ? { ...f, status, error } : f)),
      }));
    },
    [],
  );

  const downloadFileText = useCallback(
    async (id: string, apiKey: string): Promise<string> => {
      const url = `https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const data = await res.json();
          if (data?.error?.message) msg = data.error.message;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      return res.text();
    },
    [],
  );

  const reset = useCallback(() => setState({ status: 'idle', error: null, files: [] }), []);

  const setStatus = useCallback((status: DriveLoadState['status']) => {
    setState((prev) => ({ ...prev, status }));
  }, []);

  return {
    state,
    listFolder,
    toggleFile,
    setAllSelected,
    updateFileStatus,
    downloadFileText,
    reset,
    setStatus,
  };
}
