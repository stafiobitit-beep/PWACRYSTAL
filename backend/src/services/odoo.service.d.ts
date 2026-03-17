export declare class OdooTaskService {
    static getTasks(domain?: any[]): Promise<any>;
    static updateTaskStatus(taskId: number, stageId: number): Promise<any>;
}
export declare class OdooMessageService {
    static postMessage(taskId: number, content: string): Promise<any>;
}
export declare class OdooAttachmentService {
    static uploadAttachment(taskId: number, fileName: string, base64Data: string): Promise<any>;
}
export declare class OdooIncidentService {
    static createIncident(taskId: number, description: string): Promise<any>;
}
//# sourceMappingURL=odoo.service.d.ts.map