export declare class OdooTaskService {
    static getTasks(domain?: any[], since?: Date): Promise<any>;
    static createTask(data: {
        name: string;
        project_id: number;
        partner_id?: number;
        description?: string;
    }): Promise<any>;
    static updateTaskStatus(taskId: number, stageId: number): Promise<any>;
}
export declare class OdooProjectService {
    static getProjects(since?: Date): Promise<any>;
}
export declare class OdooPartnerService {
    static getPartners(domain?: any[]): Promise<any>;
}
export declare class OdooMessageService {
    static postMessage(taskId: number, content: string, senderName: string): Promise<any>;
    static getMessages(taskId: number, since?: Date): Promise<any>;
}
export declare class OdooTimesheetService {
    static createTimesheet(taskId: number, minutes: number, description: string, cleanerEmail?: string): Promise<any>;
}
export declare class OdooAttachmentService {
    static uploadAttachment(taskId: number, fileName: string, base64Data: string): Promise<any>;
}
export declare class OdooIncidentService {
    static createIncident(taskId: number, description: string): Promise<any>;
}
export declare class OdooUserService {
    static findByEmail(email: string): Promise<any>;
    static createInternalUser(name: string, email: string): Promise<number | null>;
}
//# sourceMappingURL=odoo.service.d.ts.map