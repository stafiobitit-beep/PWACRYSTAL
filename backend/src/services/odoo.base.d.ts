export interface OdooConfig {
    url: string;
    db: string;
    username: string;
    apiKey: string;
}
declare class OdooService {
    private config;
    private uid;
    private loadConfig;
    private getClient;
    authenticate(): Promise<number>;
    execute(model: string, method: string, args: any[], kwargs?: any): Promise<any>;
}
export declare const odoo: OdooService;
export {};
//# sourceMappingURL=odoo.base.d.ts.map