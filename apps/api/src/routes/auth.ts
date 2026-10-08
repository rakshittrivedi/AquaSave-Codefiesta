import { Router, Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { config } from '../config';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Seeds default administrator if no users exist in database.
 */
export async function ensureAdminUser(): Promise<void> {
  const count = await User.countDocuments();
  if (count === 0) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('aquasave2026!', salt);
    await User.create({
      username: 'admin',
      passwordHash,
      role: 'admin',
    });
  }
}

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Invalid credentials format',
        details: parseResult.error.format(),
      });
      return;
    }

    const { username, password } = parseResult.data;
    const user = await User.findOne({ username: username.toLowerCase().trim() });

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid username or password',
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid username or password',
      });
      return;
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
      },
      config.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to authenticate user',
    });
  }
});

export default router;
