import { Request, Response, NextFunction } from 'express';

/**
 * Role-based authorization middleware
 * @param allowedRoles Array of roles that can access the route
 */
export function authorizeRoles(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get user role from JWT token (attached by auth middleware)
    const userRole = (req as any).user?.role;
    
    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - No role found'
      });
    }
    
    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden - ${userRole} role does not have access to this resource`
      });
    }
    
    // User has permission, proceed
    next();
  };
}
