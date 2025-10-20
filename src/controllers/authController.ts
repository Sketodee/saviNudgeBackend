import { Request, Response } from "express";
import { ApiResponse } from "../types/appScopeTypes";
import { login as loginService } from "../services/authService";


export const login = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
        const { email, password } = req.body;
        if(!email || !password) {
            res.status(400).json({
                success: false,
                message: 'Email and password are required',
                error: 'Email and password are required',
                data: null
            });
            return;
        }

        const result = await loginService({ email, password });

        if (!result.success) {
            res.status(400).json({
                success: false,
                message: result.message,
                error: result.errors?.[0]?.message || 'Unknown error',
                data: null
            });
            return;
        }

        if (result.success) {
            res.status(200).json({
                success: true,
                message: result.message,
                error: null,
                data: result.data
            });
            return;
        }

    }
    catch (error: any) {
        console.error('Error in login controller:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            data: null
        });
    }
}