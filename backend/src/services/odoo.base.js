import xmlrpc from 'xmlrpc';
import prisma from '../utils/prisma.js';
class OdooService {
    config = null;
    uid = null;
    async loadConfig() {
        // Try to get dynamic config from DB first
        const dbConfig = await prisma.odooConfig.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });
        if (dbConfig) {
            this.config = {
                url: dbConfig.url,
                db: dbConfig.db,
                username: dbConfig.username,
                apiKey: dbConfig.apiKey,
            };
        }
        else {
            // Fallback to .env
            this.config = {
                url: process.env.ODOO_URL || '',
                db: process.env.ODOO_DB || '',
                username: process.env.ODOO_USERNAME || '',
                apiKey: process.env.ODOO_API_KEY || '',
            };
        }
    }
    getClient(path) {
        if (!this.config)
            throw new Error('Odoo config not loaded');
        const url = new URL(path, this.config.url);
        const isHttps = url.protocol === 'https:';
        const clientCreator = isHttps ? xmlrpc.createSecureClient : xmlrpc.createClient;
        return clientCreator({
            host: url.hostname,
            port: url.port ? parseInt(url.port) : (isHttps ? 443 : 80),
            path: url.pathname,
        });
    }
    async authenticate() {
        const previousUrl = this.config?.url;
        await this.loadConfig();
        if (this.uid && this.config?.url === previousUrl)
            return this.uid;
        this.uid = null; // reset if config changed or not yet authenticated
        if (!this.config?.url)
            throw new Error('Odoo URL not configured');
        console.log(`[Odoo] Connecting to ${this.config.url} for DB: ${this.config.db}...`);
        return new Promise((resolve, reject) => {
            try {
                const common = this.getClient('/xmlrpc/2/common');
                common.methodCall('authenticate', [this.config.db, this.config.username, this.config.apiKey, {}], (error, value) => {
                    if (error) {
                        console.error('[Odoo] Auth connection error:', error.message || error);
                        return reject(error);
                    }
                    if (typeof value !== 'number') {
                        console.error('[Odoo] Auth failed: Invalid credentials or database name');
                        return reject(new Error('Authentication failed'));
                    }
                    console.log('[Odoo] Auth success, UID:', value);
                    this.uid = value;
                    resolve(value);
                });
            }
            catch (e) {
                console.error('[Odoo] Client setup error:', e.message);
                reject(e);
            }
        });
    }
    async execute(model, method, args, kwargs = {}) {
        const uid = await this.authenticate();
        return new Promise((resolve, reject) => {
            try {
                const object = this.getClient('/xmlrpc/2/object');
                object.methodCall('execute_kw', [this.config.db, uid, this.config.apiKey, model, method, args, kwargs], (error, value) => {
                    if (error) {
                        console.error(`[Odoo] Execution error on ${model}.${method}:`, error.message || error);
                        return reject(error);
                    }
                    resolve(value);
                });
            }
            catch (e) {
                console.error('[Odoo] Execution setup error:', e.message);
                reject(e);
            }
        });
    }
}
export const odoo = new OdooService();
//# sourceMappingURL=odoo.base.js.map