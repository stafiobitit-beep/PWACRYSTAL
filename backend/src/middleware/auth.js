import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token)
        return res.status(401).json({ message: 'Unauthorized' });
    // @ts-ignore
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err)
            return res.status(403).json({ message: 'Forbidden' });
        req.user = user;
        next();
    });
};
export const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Unauthorized role' });
        }
        next();
    };
};
//# sourceMappingURL=auth.js.map