declare module 'qz-tray' {
  const qz: {
    websocket: {
      connect: () => Promise<void>;
      disconnect: () => Promise<void>;
      isActive: () => boolean;
    };
    security: {
      setCertificatePromise: (callback: (resolve: (cert: string) => void) => void) => void;
      setSignatureAlgorithm: (algo: string) => void;
      setSignaturePromise: (callback: (toSign: string) => (resolve: (sig: string) => void) => void) => void;
    };
    printers: {
      find: (query?: string) => Promise<string | string[]>;
      getDefault: () => Promise<string>;
    };
    configs: {
      create: (printer: string, opts?: any) => any;
    };
    print: (config: any, data: any[]) => Promise<void>;
  };
  export default qz;
}
