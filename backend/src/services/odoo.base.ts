import xmlrpc from 'xmlrpc';
import prisma from '../utils/prisma.js';

export interface OdooConfig {
  url: string;
  db: string;
  username: string;
  apiKey: string;
}

class OdooService {
  private config: OdooConfig | null = null;
  private uid: number | null = null;

  private async loadConfig() {
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
    } else {
      // Fallback to .env
      this.config = {
        url: process.env.ODOO_URL || '',
        db: process.env.ODOO_DB || '',
        username: process.env.ODOO_USERNAME || '',
        apiKey: process.env.ODOO_API_KEY || '',
      };
    }
  }

  private getClient(path: string) {
    if (!this.config) throw new Error('Odoo config not loaded');
    const url = new URL(path, this.config.url);
    return xmlrpc.createSecureClient({
      host: url.hostname,
      port: url.port ? parseInt(url.port) : 443,
      path: url.pathname,
    });
  }

  async authenticate(): Promise<number> {
    await this.loadConfig();
    if (this.uid && this.config) return this.uid;
    if (!this.config?.url) throw new Error('Odoo URL not configured');

    return new Promise((resolve, reject) => {
      const common = this.getClient('/xmlrpc/2/common');
      common.methodCall(
        'authenticate',
        [this.config!.db, this.config!.username, this.config!.apiKey, {}],
        (error: any, value: any) => {
          if (error) return reject(error);
          if (typeof value !== 'number') return reject(new Error('Authentication failed'));
          this.uid = value;
          resolve(value);
        }
      );
    });
  }

  async execute(model: string, method: string, args: any[], kwargs: any = {}): Promise<any> {
    const uid = await this.authenticate();
    return new Promise((resolve, reject) => {
      const object = this.getClient('/xmlrpc/2/object');
      object.methodCall(
        'execute_kw',
        [this.config.db, uid, this.config.apiKey, model, method, args, kwargs],
        (error: any, value: any) => {
          if (error) return reject(error);
          resolve(value);
        }
      );
    });
  }
}

export const odoo = new OdooService();
