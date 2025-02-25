import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Define a handler type to ensure consistent return types
type RequestHandler = (req: Request, res: Response) => Promise<void>;


export const getUsers: RequestHandler = async (req, res) => {
    try {
        const users = await User.find({}, '-password'); // Excluye la contraseña por seguridad
        res.status(200).json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};



export const register: RequestHandler = async (req, res) => {
    try {
        console.log("Datos recibidos:", req.body);

        const { name, email, password, authProvider, googleId, avatar, location } = req.body;

        if (!name || !authProvider) {
            res.status(400).json({ message: "Faltan campos obligatorios: name y authProvider" });
            return;
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            res.status(400).json({ message: "User already exists" });
            return;
        }

        let hashedPassword = undefined;
        if (authProvider === "email" && password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const user = new User({
            name,
            email,
            password: hashedPassword,
            authProvider,
            googleId,
            avatar,
            location,
            role: 'registered', // 👈 Establece el rol como 'registered' por defecto
        });

        await user.save();

        const token = jwt.sign(
            { _id: user._id },
            process.env.JWT_SECRET || '',
            { expiresIn: '7d' }
        );

        res.status(201).json({ 
            message: "Usuario registrado exitosamente", 
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                location: user.location,
                authProvider: user.authProvider,
                role: user.role, // 👈 Incluye el rol en la respuesta
            },
            token 
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ message: "Server error" });
    }
};


export const getProfile: RequestHandler = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Verificar si req.user existe y mostrar su estructura para depuración
      console.log('req.user:', req.user);
      
      if (!req.user) {
        res.status(401).json({ message: 'No autenticado' });
        return;
      }
      
      // Usar _id en lugar de id
      const userId = req.user._id;
      
      console.log('userId:', userId);
      
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      res.json({ user });
      return;
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Server error' });
      return;
    }
  };




export const login: RequestHandler = async (req: AuthRequest, res: Response) => {
    try {
        const { email, password } = req.body;

        const userId = req.user?._id;
        

        const user = await User.findOne({ email });
        if (!user) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }

        if (user.authProvider === 'google') {
            res.status(400).json({
                message: 'Please sign in with Google',
                authProvider: 'google'
            });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password?.toString() || '');
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }

        const token = jwt.sign(
            { _id: user._id },
            process.env.JWT_SECRET || '',
            { expiresIn: '7d' }
        );

        res.json({ user, token });
        console.log("Usuario logueado exitosamente" + user + token);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const googleAuth: RequestHandler = async (req, res) => {
    try {
        const { token } = req.body;

        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            res.status(400).json({ message: 'Invalid Google token' });
            return;
        }

        const {
            email,
            name,
            picture: avatar,
            sub: googleId
        } = payload;

        let user = await User.findOne({ email });

        if (user) {
            if (user.authProvider !== 'google') {
                user.authProvider = 'google';
                user.googleId = googleId;
                user.avatar = avatar;
                await user.save();
            }
        } else {
            user = new User({
                email,
                name,
                avatar,
                googleId,
                authProvider: 'google',
                location: '',
                active: true
            });
            await user.save();
        }

        const jwtToken = jwt.sign(
            { _id: user._id },
            process.env.JWT_SECRET || '',
            { expiresIn: '7d' }
        );

        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            location: user.location,
            authProvider: user.authProvider
        };

        res.json({
            user: userResponse,
            token: jwtToken
        });
    } catch (error) {
        console.error('Google auth error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error authenticating with Google';
        res.status(500).json({
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
};

export const verifyToken: RequestHandler = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            res.status(401).json({ message: 'No token provided' });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { _id: string };
        const user = await User.findById(decoded._id).select('-password');

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.json({ user });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};