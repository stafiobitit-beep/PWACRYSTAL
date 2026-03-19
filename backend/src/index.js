import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import prisma from './utils/prisma.js';
import { authenticateToken, authorizeRole } from './middleware/auth.js';
import { OdooTaskService, OdooMessageService, OdooAttachmentService, OdooIncidentService, OdooTimesheetService, OdooProjectService, OdooPartnerService, OdooUserService } from './services/odoo.service.js';
import { odoo } from './services/odoo.base.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
app.use(cors());
app.use(express.json({ limit: '10mb' }));
// --- HEALTH CHECK ---
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));
// --- AUTO-SEED FOR DEMO ---
const autoSeed = async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    // Admin
    await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: { password: hashedPassword },
        create: {
            email: 'admin@example.com',
            password: hashedPassword,
            name: 'De Baas',
            role: 'ADMIN'
        }
    });
    // Cleaner
    await prisma.user.upsert({
        where: { email: 'cleaner1@example.com' },
        update: { password: hashedPassword },
        create: {
            email: 'cleaner1@example.com',
            password: hashedPassword,
            name: 'An de Kuis',
            role: 'CLEANER'
        }
    });
    // Customer
    await prisma.user.upsert({
        where: { email: 'customer1@example.com' },
        update: { password: hashedPassword },
        create: {
            email: 'customer1@example.com',
            password: hashedPassword,
            name: 'Klant Kritisch',
            role: 'CUSTOMER'
        }
    });
    console.log('Auto-seed completed (upsert used). Demo accounts ready.');
};
autoSeed().catch(err => console.error('Auto-seed failed:', err));
// --- ODOO SYNC HELPERS ---
export async function syncOdooData(selectedProjectIds, since) {
    console.log('Starting sync...', {
        filtered: selectedProjectIds ? selectedProjectIds.length : 'All',
        since: since ? since.toISOString() : 'None'
    });
    const results = { partners: 0, locations: 0, tasks: 0 };
    const errors = [];
    try {
        const hashedDefaultPassword = await bcrypt.hash('password123', 10);
        // 1. Sync Partners -> Customers
        try {
            const partners = await OdooPartnerService.getPartners();
            for (const p of partners) {
                try {
                    const email = p.email || `odoo_partner_${p.id}@placeholder.local`;
                    await prisma.user.upsert({
                        where: { email },
                        update: { name: p.name, odooPartnerId: p.id },
                        create: {
                            email,
                            name: p.name,
                            password: hashedDefaultPassword,
                            role: 'CUSTOMER',
                            odooPartnerId: p.id
                        }
                    });
                    results.partners++;
                }
                catch (e) {
                    errors.push(`Partner sync failed for ${p.name}: ${e.message}`);
                }
            }
        }
        catch (e) {
            errors.push(`Failed to fetch partners from Odoo: ${e.message}`);
        }
        // 2. Sync Projects -> Locations
        try {
            let projects = await OdooProjectService.getProjects(since);
            if (selectedProjectIds && Array.isArray(selectedProjectIds)) {
                projects = projects.filter((p) => selectedProjectIds.includes(p.id));
            }
            for (const pr of projects) {
                try {
                    console.log(`[Sync] Processing project: ${pr.name} (ID: ${pr.id})`);
                    const partnerId = Array.isArray(pr.partner_id) ? pr.partner_id[0] : null;
                    let customerId = partnerId ? (await prisma.user.findFirst({ where: { odooPartnerId: partnerId } }))?.id : null;
                    if (!customerId) {
                        const firstAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
                        customerId = firstAdmin?.id || null;
                    }
                    if (customerId) {
                        await prisma.location.upsert({
                            where: { odooProjectId: pr.id },
                            update: { name: pr.name, customerId },
                            create: { name: pr.name, address: 'Odoo Project Address', customerId, odooProjectId: pr.id }
                        });
                        results.locations++;
                    }
                    else {
                        errors.push(`Project "${pr.name}" skipped: No customer or admin fallback found`);
                    }
                }
                catch (e) {
                    errors.push(`Project sync failed for ${pr.name}: ${e.message}`);
                }
            }
        }
        catch (e) {
            errors.push(`Failed to fetch projects from Odoo: ${e.message}`);
        }
        // 3. Sync Tasks
        try {
            const odooTasks = await OdooTaskService.getTasks([], since);
            const allUsers = await prisma.user.findMany({ where: { role: 'CLEANER' } });
            const userCache = new Map();
            for (const t of odooTasks) {
                try {
                    if (selectedProjectIds && Array.isArray(selectedProjectIds) && !selectedProjectIds.includes(t.project_id[0])) {
                        continue;
                    }
                    const location = await prisma.location.findUnique({ where: { odooProjectId: t.project_id[0] } });
                    if (location) {
                        // Resolve cleaner name from user_ids (plural in Odoo 19)
                        let odooUserName = null;
                        const userIds = t.user_ids && Array.isArray(t.user_ids) ? t.user_ids : [];
                        if (userIds.length > 0) {
                            const firstId = userIds[0];
                            if (userCache.has(firstId)) {
                                odooUserName = userCache.get(firstId);
                            }
                            else {
                                try {
                                    const userData = await odoo.execute('res.users', 'read', [[firstId]], { fields: ['name'] });
                                    if (userData && userData[0] && userData[0].name) {
                                        const name = userData[0].name;
                                        odooUserName = name;
                                        userCache.set(firstId, name);
                                    }
                                }
                                catch (e) {
                                    console.error(`Failed to resolve Odoo user name for ID ${firstId}:`, e);
                                }
                            }
                        }
                        const cleaner = odooUserName ? allUsers.find((u) => u.name === odooUserName) : null;
                        const taskData = {
                            title: t.name,
                            description: t.description || '',
                        };
                        if (cleaner?.id) {
                            taskData.cleanerId = cleaner.id;
                        }
                        await prisma.cleaningTask.upsert({
                            where: { odooTaskId: t.id },
                            update: taskData,
                            create: {
                                title: t.name,
                                description: t.description || '',
                                date: t.date_deadline ? new Date(t.date_deadline) : new Date(),
                                status: 'PLANNED',
                                locationId: location.id,
                                odooTaskId: t.id,
                                ...taskData
                            }
                        });
                        // Pull new Odoo messages into app (incremental only when since is set)
                        if (since) {
                            try {
                                const odooMsgs = await OdooMessageService.getMessages(t.id, since);
                                for (const msg of odooMsgs) {
                                    const plainBody = msg.body.replace(/<[^>]*>/g, '').trim();
                                    if (!plainBody)
                                        continue;
                                    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
                                    if (!admin)
                                        continue;
                                    const localTask = await prisma.cleaningTask.findUnique({ where: { odooTaskId: t.id } });
                                    if (!localTask)
                                        continue;
                                    const msgDate = new Date(msg.date);
                                    const existing = await prisma.taskMessage.findFirst({
                                        where: {
                                            taskId: localTask.id,
                                            content: plainBody,
                                            timestamp: {
                                                gte: new Date(msgDate.getTime() - 5000),
                                                lte: new Date(msgDate.getTime() + 5000),
                                            }
                                        }
                                    });
                                    if (!existing) {
                                        await prisma.taskMessage.create({
                                            data: { content: plainBody, taskId: localTask.id, senderId: admin.id, timestamp: msgDate }
                                        });
                                    }
                                }
                            }
                            catch { /* non-fatal — Odoo message read may fail on some instances */ }
                        }
                        results.tasks++;
                    }
                }
                catch (e) {
                    errors.push(`Task sync failed for "${t.name}": ${e.message}`);
                }
            }
        }
        catch (e) {
            errors.push(`Failed to fetch tasks from Odoo: ${e.message}`);
        }
        return { results, errors };
    }
    catch (error) {
        console.error('Core sync logic failed:', error);
        throw error;
    }
}
async function runAutoSync() {
    try {
        const config = await prisma.odooConfig.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });
        if (!config) {
            console.log('Auto-sync skipped: No active Odoo config');
            return;
        }
        const syncStartTime = new Date(); // Start time for the session
        const since = config.lastSyncedAt;
        let projectIds;
        if (config.syncedProjectIds) {
            try {
                projectIds = JSON.parse(config.syncedProjectIds);
            }
            catch (e) {
                console.error('Failed to parse syncedProjectIds:', e);
            }
        }
        console.log('Background smart-poll starting...');
        const { results, errors } = await syncOdooData(projectIds, since || undefined);
        await prisma.odooConfig.update({
            where: { id: config.id },
            data: { lastSyncedAt: syncStartTime }
        });
        console.log(`Background sync completed. Results:`, results, `Warnings:`, errors.length);
    }
    catch (err) {
        console.error('Background sync critical failure:', err);
    }
}
// Start auto-sync interval
setTimeout(() => {
    runAutoSync();
    setInterval(runAutoSync, 30 * 1000); // Smart poll every 30 seconds
}, 15000); // 15 seconds after boot
// --- AUTH ROUTES ---
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user.id, role: user.role, email: user.email, name: user.name }, JWT_SECRET);
        res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
    }
    catch (e) {
        console.error('Login error:', e);
        res.status(500).json({ message: 'Server error' });
    }
});
// --- TASK ROUTES ---
app.get('/api/tasks', authenticateToken, async (req, res) => {
    const { role, id } = req.user;
    let tasks;
    if (role === 'ADMIN') {
        tasks = await prisma.cleaningTask.findMany({
            include: {
                location: { include: { customer: { select: { name: true } } } },
                cleaner: { select: { name: true } },
                messages: {
                    orderBy: { timestamp: 'desc' },
                    take: 1,
                    include: { sender: { select: { name: true } } }
                }
            }
        });
    }
    else if (role === 'CLEANER') {
        tasks = await prisma.cleaningTask.findMany({
            where: { cleanerId: id },
            include: {
                location: { include: { customer: { select: { name: true } } } },
                cleaner: { select: { name: true } },
                messages: {
                    orderBy: { timestamp: 'desc' },
                    take: 1,
                    include: { sender: { select: { name: true } } }
                }
            }
        });
    }
    else {
        // Customer sees tasks for their locations
        tasks = await prisma.cleaningTask.findMany({
            where: { location: { customerId: id } },
            include: {
                location: { include: { customer: { select: { name: true } } } },
                cleaner: { select: { name: true } },
                messages: {
                    orderBy: { timestamp: 'desc' },
                    take: 1,
                    include: { sender: { select: { name: true } } }
                }
            }
        });
    }
    res.json(tasks);
});
app.get('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const { role, id: userId } = req.user;
        const task = await prisma.cleaningTask.findUnique({
            where: { id: req.params.id },
            include: {
                location: {
                    include: {
                        customer: { select: { id: true, name: true, email: true } }
                    }
                },
                cleaner: { select: { id: true, name: true } },
                manager: { select: { id: true, name: true } },
                messages: {
                    include: { sender: { select: { id: true, name: true, role: true } } },
                    orderBy: { timestamp: 'asc' }
                },
                photos: { orderBy: { createdAt: 'desc' } },
                incidents: { orderBy: { createdAt: 'desc' } },
                timesheets: {
                    orderBy: { startTime: 'desc' }
                }
            }
        });
        if (!task)
            return res.status(404).json({ message: 'Taak niet gevonden' });
        // Authorization Check
        const isOwner = role === 'ADMIN';
        const isCleaner = role === 'CLEANER' && task.cleanerId === userId;
        const isCustomer = role === 'CUSTOMER' && task.location?.customerId === userId;
        if (isOwner || isCleaner || isCustomer) {
            return res.json(task);
        }
        res.status(403).json({ message: 'Geen toegang tot deze taak' });
    }
    catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
});
app.post('/api/tasks', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    try {
        const { title, description, date, locationId, cleanerId } = req.body;
        const location = await prisma.location.findUnique({ where: { id: locationId } });
        if (!location)
            return res.status(400).json({ message: 'Locatie niet gevonden' });
        const customer = await prisma.user.findUnique({ where: { id: location.customerId } });
        // 1. Create locally
        const task = await prisma.cleaningTask.create({
            data: {
                title,
                description,
                date: new Date(date),
                status: 'PLANNED',
                locationId,
                cleanerId
            },
            include: { location: true, cleaner: true }
        });
        // 2. Respond immediately
        res.json(task);
        // 3. Sync to Odoo if location has odooProjectId
        if (location?.odooProjectId) {
            try {
                const taskData = {
                    name: title,
                    project_id: location.odooProjectId,
                    description: description || ''
                };
                if (customer?.odooPartnerId) {
                    taskData.partner_id = customer.odooPartnerId;
                }
                const odooTask = await OdooTaskService.createTask(taskData);
                await prisma.cleaningTask.update({
                    where: { id: task.id },
                    data: { odooTaskId: odooTask }
                });
            }
            catch (error) {
                console.error('[Odoo] task creation failed (non-fatal):', error);
            }
        }
    }
    catch (e) {
        console.error('[CreateTask] Fatal error:', e);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error' });
        }
    }
});
app.post('/api/tasks/:id/timer/start', authenticateToken, async (req, res) => {
    try {
        const task = await prisma.cleaningTask.findUnique({
            where: { id: req.params.id }
        });
        if (!task) {
            return res.status(404).json({ message: 'Taak niet gevonden' });
        }
        // Only the assigned cleaner can start/stop the timer
        if (task.cleanerId !== req.user.id) {
            return res.status(403).json({
                message: 'Enkel de toegewezen kuiser kan de timer bedienen'
            });
        }
        const updated = await prisma.cleaningTask.update({
            where: { id: req.params.id },
            data: { timerStartedAt: new Date(), status: 'IN_PROGRESS' },
            include: {
                location: true,
                cleaner: { select: { id: true, name: true } }
            }
        });
        res.json(updated);
    }
    catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
});
app.post('/api/tasks/:id/timer/stop', authenticateToken, async (req, res) => {
    try {
        const task = await prisma.cleaningTask.findUnique({
            where: { id: req.params.id },
            include: { location: true }
        });
        if (!task) {
            return res.status(404).json({ message: 'Taak niet gevonden' });
        }
        // Only the assigned cleaner can stop the timer
        if (task.cleanerId !== req.user.id) {
            return res.status(403).json({
                message: 'Enkel de toegewezen kuiser kan de timer bedienen'
            });
        }
        if (!task.timerStartedAt) {
            return res.status(400).json({ message: 'Timer is niet gestart' });
        }
        // 1. Save locally first
        const endTime = new Date();
        const startTime = task.timerStartedAt;
        const durationInMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
        const timesheet = await prisma.timesheet.create({
            data: {
                startTime,
                endTime,
                duration: durationInMinutes,
                taskId: task.id,
                cleanerId: req.user.id
            }
        });
        const updatedTask = await prisma.cleaningTask.update({
            where: { id: req.params.id },
            data: { timerStartedAt: null }
        });
        // 2. Respond immediately
        res.json({ task: updatedTask, timesheet });
        // 3. Sync to Odoo in isolated try/catch after response
        if (task.odooTaskId) {
            try {
                await OdooTimesheetService.createTimesheet(task.odooTaskId, durationInMinutes, `Kuisbeurt – ${req.user.name} @ ${task.location?.name ?? task.id}`, req.user.email // ← add this
                );
            }
            catch (error) {
                console.error('[Odoo] timesheet sync failed (non-fatal):', error?.message);
            }
        }
    }
    catch (e) {
        console.error('[TimerStop] Fatal error:', e?.message);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error' });
        }
    }
});
app.patch('/api/tasks/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status, odooTaskId, odooStageId } = req.body;
        // 1. Save locally first
        const task = await prisma.cleaningTask.update({
            where: { id: req.params.id },
            data: { status }
        });
        // 2. Respond immediately
        res.json(task);
        // 3. Sync to Odoo after response
        if (odooTaskId && odooStageId) {
            try {
                await OdooTaskService.updateTaskStatus(Number(odooTaskId), Number(odooStageId));
            }
            catch (error) {
                console.error('[Odoo] status sync failed (non-fatal):', error?.message);
            }
        }
    }
    catch (e) {
        console.error('[StatusUpdate] Fatal error:', e?.message);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error' });
        }
    }
});
app.get('/api/tasks/:id/available-cleaners', authenticateToken, async (req, res) => {
    try {
        const cleaners = await prisma.user.findMany({
            where: { role: 'CLEANER' },
            select: { id: true, name: true }
        });
        res.json(cleaners);
    }
    catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
});
app.patch('/api/tasks/:id/assign', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    try {
        const { cleanerId } = req.body;
        const taskId = req.params.id;
        const task = await prisma.cleaningTask.findUnique({
            where: { id: taskId },
            select: { odooTaskId: true }
        });
        if (!task)
            return res.status(404).json({ message: 'Taak niet gevonden' });
        // 1. Save locally first
        const updatedTask = await prisma.cleaningTask.update({
            where: { id: taskId },
            data: { cleanerId: cleanerId || null },
            include: { cleaner: { select: { id: true, name: true } } }
        });
        // 2. Respond immediately
        res.json(updatedTask);
        // 3. Sync to Odoo in isolated try/catch after response
        if (task.odooTaskId) {
            try {
                if (cleanerId) {
                    const cleaner = await prisma.user.findUnique({
                        where: { id: cleanerId },
                        select: { email: true }
                    });
                    if (cleaner) {
                        const odooUsers = await odoo.execute('res.users', 'search_read', [[['login', '=', cleaner.email]]], { fields: ['id'] });
                        if (odooUsers && odooUsers[0]) {
                            const odooUserId = odooUsers[0].id;
                            await odoo.execute('project.task', 'write', [[task.odooTaskId]], { user_ids: [[4, odooUserId]] });
                        }
                    }
                }
                else {
                    // Unlink all users from task
                    await odoo.execute('project.task', 'write', [[task.odooTaskId]], { user_ids: [[5]] });
                }
            }
            catch (err) {
                console.error('[Odoo] assignment sync failed (non-fatal):', err?.message);
            }
        }
    }
    catch (e) {
        console.error('[Assign] Fatal error:', e?.message);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error' });
        }
    }
});
app.post('/api/tasks/:id/messages', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const senderId = req.user.id;
        const senderName = req.user.name;
        const { content, odooTaskId } = req.body;
        if (!content?.trim()) {
            return res.status(400).json({ message: 'Bericht mag niet leeg zijn' });
        }
        // STEP 1: save locally
        const message = await prisma.taskMessage.create({
            data: {
                content: content.trim(),
                taskId,
                senderId,
            },
            include: {
                sender: { select: { id: true, name: true, role: true } },
            },
        });
        // STEP 2: respond immediately
        res.json(message);
        // STEP 3: attempt Odoo sync after response
        if (odooTaskId) {
            try {
                await OdooMessageService.postMessage(Number(odooTaskId), content.trim(), senderName || 'Gebruiker');
            }
            catch (odooErr) {
                console.error('[Odoo] message_post failed (non-fatal):', odooErr?.message);
            }
        }
    }
    catch (e) {
        console.error('[Messages] Fatal error:', e?.message);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error' });
        }
    }
});
// --- PHOTO ROUTES ---
app.post('/api/tasks/:id/photos', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const { url, type, odooTaskId, fileName } = req.body;
        if (!url) {
            return res.status(400).json({ message: 'Geen afbeelding ontvangen' });
        }
        // STEP 1: save locally first
        const photo = await prisma.taskPhoto.create({
            data: {
                url,
                type: type || 'GENERAL',
                taskId,
            },
        });
        // STEP 2: respond immediately
        res.json(photo);
        // STEP 3: attempt Odoo sync after response
        if (odooTaskId) {
            try {
                const base64Data = url.includes(',') ? url.split(',')[1] : url;
                await OdooAttachmentService.uploadAttachment(Number(odooTaskId), fileName || 'foto.jpg', base64Data);
            }
            catch (odooErr) {
                console.error('[Odoo] attachment upload failed (non-fatal):', odooErr?.message);
            }
        }
    }
    catch (e) {
        console.error('[Photos] Fatal error:', e?.message);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error' });
        }
    }
});
// --- INCIDENT ROUTES ---
app.post('/api/tasks/:id/incidents', authenticateToken, async (req, res) => {
    try {
        const { description, odooTaskId } = req.body;
        const taskId = req.params.id;
        // 1. Save locally first
        const incident = await prisma.incident.create({
            data: { description, status: 'OPEN', taskId }
        });
        // Auto update task status to ISSUE
        await prisma.cleaningTask.update({
            where: { id: taskId },
            data: { status: 'ISSUE' }
        });
        // 2. Respond immediately
        res.json(incident);
        // 3. Sync to Odoo in isolated try/catch after response
        if (odooTaskId) {
            try {
                await OdooIncidentService.createIncident(Number(odooTaskId), description);
            }
            catch (err) {
                console.error('[Odoo] incident creation failed (non-fatal):', err?.message);
            }
        }
    }
    catch (e) {
        console.error('[Incidents] Fatal error:', e?.message);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error' });
        }
    }
});
// --- SETTINGS ROUTES ---
app.get('/api/settings/odoo', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    const config = await prisma.odooConfig.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
    });
    res.json(config || {});
});
app.post('/api/settings/odoo', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    const { url, db, username, apiKey } = req.body;
    // Deactivate old configs
    await prisma.odooConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false }
    });
    const config = await prisma.odooConfig.create({
        data: { url, db, username, apiKey, isActive: true }
    });
    res.json(config);
});
// --- HELPER ROUTES FOR UI ---
// --- USER MANAGEMENT ROUTES ---
app.post('/api/users/cleaners', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // Validation
        if (!name || !email || !password || password.length < 6) {
            return res.status(400).json({
                message: 'Naam, e-mail en wachtwoord (min. 6 tekens) zijn verplicht'
            });
        }
        // Check uniqueness
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ message: 'E-mailadres al in gebruik' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'CLEANER'
            },
            select: { id: true, name: true, email: true, role: true }
        });
        res.json(user);
        // Optionally create Odoo internal user for timesheet linking
        if (req.body.createOdooUser) {
            try {
                await OdooUserService.createInternalUser(name, email);
            }
            catch (e) {
                console.warn('[Odoo] Could not create Odoo user for cleaner:', e.message);
            }
        }
    }
    catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
});
app.patch('/api/users/:id', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { name, email },
            select: { id: true, name: true, email: true, role: true }
        });
        res.json(user);
    }
    catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
});
app.delete('/api/users/:id', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    try {
        const id = req.params.id;
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user)
            return res.status(404).json({ message: 'Gebruiker niet gevonden' });
        if (user.role !== 'CLEANER')
            return res.status(403).json({ message: 'Enkel kuisers kunnen verwijderd worden' });
        // Check for active tasks
        const activeTasks = await prisma.cleaningTask.count({
            where: { cleanerId: id, status: 'IN_PROGRESS' }
        });
        if (activeTasks > 0) {
            return res.status(409).json({ message: 'Kuiser heeft actieve taken' });
        }
        await prisma.user.delete({ where: { id } });
        res.json({ message: 'Kuiser verwijderd' });
    }
    catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
});
app.get('/api/users/cleaners', authenticateToken, async (req, res) => {
    const cleaners = await prisma.user.findMany({
        where: { role: 'CLEANER' },
        select: { id: true, name: true, email: true }
    });
    res.json(cleaners);
});
app.get('/api/locations', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    const locations = await prisma.location.findMany({ include: { customer: { select: { name: true } } } });
    res.json(locations);
});
app.get('/api/odoo/projects', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    try {
        const projects = await OdooProjectService.getProjects();
        res.json(projects);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch Odoo projects' });
    }
});
// --- SYNC ROUTE ---
app.post('/api/sync/all', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    try {
        const { selectedProjectIds } = req.body;
        // Save selection to config
        const config = await prisma.odooConfig.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });
        if (config && selectedProjectIds) {
            await prisma.odooConfig.update({
                where: { id: config.id },
                data: {
                    syncedProjectIds: JSON.stringify(selectedProjectIds),
                    lastSyncedAt: new Date()
                }
            });
        }
        const { results, errors } = await syncOdooData(selectedProjectIds);
        res.json({
            message: errors.length > 0 ? 'Sync voltooid met waarschuwingen' : 'Sync succesvol voltooid',
            results,
            warnings: errors
        });
    }
    catch (error) {
        console.error('Odoo Sync Error:', error);
        // Only return 500 if the whole process crashed (e.g. Odoo unreachable)
        res.status(500).json({ error: `Sync kritiek gefaald: ${error.message || 'Unknown error'}` });
    }
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map