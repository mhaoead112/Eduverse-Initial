import { db } from '../db/index.js';
import { users } from '../../../shared/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// These should be in your .env file
const JWT_SECRET = process.env.JWT_SECRET || 'DEFAULT_SECRET_KEY_PLEASE_CHANGE';
const SALT_ROUNDS = 10; // Standard for bcrypt password hashing

// --- Interfaces for Data Transfer ---
// Defines the shape of data for registering a new user
export interface RegisterUserDto {
    email: string;
    password: string;
    name: string;
    // Role is optional, defaults to 'student' if not provided
    role?: 'student' | 'teacher' | 'admin';
}

// Defines the shape of data for logging in
export interface LoginUserDto {
    email: string;
    password: string;
}

// Defines the shape of the data we send back on successful login
export interface AuthResponse {
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
}

/**
 * Registers a new user in the database.
 * Handles password hashing and checks for existing users.
 * @param userData The user data for registration.
 * @returns The newly created user's public information.
 */
export const registerUser = async (userData: RegisterUserDto) => {
    const { email, password, name, role = 'student' } = userData;

    // 1. Check if a user with that email already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (existingUser.length > 0) {
        // Use a generic error to prevent email enumeration
        throw new Error("Invalid credentials.");
    }

    // 2. Hash the password securely
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 3. Insert the new user into the database
    const newUser = await db.insert(users).values({
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role,
    }).returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
    });
    
    if (!newUser[0]) {
        throw new Error("Failed to create the user account.");
    }
    
    return newUser[0];
};

/**
 * Authenticates a user and provides a JWT session token.
 * @param credentials The user's login email and password.
 * @returns An object containing the JWT and public user information.
 */
export const loginUser = async (credentials: LoginUserDto): Promise<AuthResponse> => {
    const { email, password } = credentials;

    // 1. Find the user by their email
    const potentialUser = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (potentialUser.length === 0) {
        // Use a generic error to prevent timing attacks and email enumeration
        throw new Error("Invalid credentials.");
    }
    const user = potentialUser[0];

    // 2. Compare the provided password with the stored hash
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        throw new Error("Invalid Password");
    }

    // 3. If password is correct, create a payload for the JWT
    const tokenPayload = {
        id: user.id,
        role: user.role,
    };

    // 4. Sign the JWT, making it valid for 7 days
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    // 5. Return the token and public user data
    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        }
    };
};