import type { Server } from 'http';
export interface Config {
    host: string;
    port: number;
}
export declare const defaultConfig: Config;
declare const server: (partialConfig?: Partial<Config>) => Promise<Server>;
export default server;
