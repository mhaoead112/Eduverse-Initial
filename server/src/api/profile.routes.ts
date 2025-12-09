import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { isAuthenticated } from '../middleware/auth.middleware.js';

const router = express.Router();

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profiles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Get current user profile
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;

    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        profilePicture: users.profilePicture,
        grade: users.grade,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile (name and grade)
router.put('/me', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { fullName, grade } = req.body;

    if (!fullName || fullName.trim().length === 0) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    if (fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Full name must be at least 2 characters' });
    }

    const updateData: any = {
      fullName: fullName.trim(),
      updatedAt: new Date(),
    };

    // Only update grade if provided
    if (grade !== undefined) {
      updateData.grade = grade.trim() || null;
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        profilePicture: users.profilePicture,
        grade: users.grade,
      });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Upload profile picture
router.post('/me/picture', isAuthenticated, upload.single('profilePicture'), async (req, res) => {
  try {
    const userId = req.user!.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get current user to delete old profile picture
    const [currentUser] = await db
      .select({ profilePicture: users.profilePicture })
      .from(users)
      .where(eq(users.id, userId));

    // Delete old profile picture if it exists
    if (currentUser?.profilePicture) {
      const oldPath = path.join(process.cwd(), currentUser.profilePicture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const profilePicturePath = `/uploads/profiles/${req.file.filename}`;

    const [updatedUser] = await db
      .update(users)
      .set({
        profilePicture: profilePicturePath,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        profilePicture: users.profilePicture,
        grade: users.grade,
      });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});

// Delete profile picture
router.delete('/me/picture', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;

    // Get current user to delete the file
    const [currentUser] = await db
      .select({ profilePicture: users.profilePicture })
      .from(users)
      .where(eq(users.id, userId));

    if (currentUser?.profilePicture) {
      const filePath = path.join(process.cwd(), currentUser.profilePicture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        profilePicture: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        profilePicture: users.profilePicture,
        grade: users.grade,
      });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    res.status(500).json({ error: 'Failed to delete profile picture' });
  }
});

export default router;
