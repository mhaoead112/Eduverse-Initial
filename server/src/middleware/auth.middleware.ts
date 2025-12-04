import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
// We define the role type here to avoid circular dependency issues with schema if strict
type UserRole = 'student' | 'teacher' | 'admin' | 'parent';

const JWT_SECRET = process.env.JWT_SECRET || 'DEFAULT_SECRET_KEY_PLEASE_CHANGE';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: UserRole;
    };
}

// FIX: Explicitly type the middleware functions as RequestHandler or ensure parameter types are compatible
// By using 'Request' instead of 'AuthenticatedRequest' in the signature, we satisfy Express's expected type.
// We then cast 'req' to 'AuthenticatedRequest' inside the function to access '.user'.

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication required: Bearer token missing.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string, role: UserRole };
        // Safe cast to attach the user
        (req as AuthenticatedRequest).user = { id: decoded.id, role: decoded.role };
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

export const checkRole = (requiredRole: UserRole) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as AuthenticatedRequest).user;
        
        if (!user) {
            return res.status(500).json({ message: 'Internal error: User context missing.' });
        }
        if (user.role !== requiredRole) {
            return res.status(403).json({ message: `Access denied. Requires role: ${requiredRole}` });
        }
        next();
    };
};

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    // Re-use authentication logic but don't strictly enforce failure if no token is present
    authenticateJWT(req, res, (err?: any) => {
        // If an error occurred during token verification (401 from JWT verify)
        if (err) {
            return res.status(401).json({ message: "Invalid or expired token." });
        }
        // If authenticateJWT failed to attach a user (401 from bearer check)
        if (!(req as AuthenticatedRequest).user) {
             return res.status(401).json({ message: "Authentication required." });
        }
        next();
    });
};