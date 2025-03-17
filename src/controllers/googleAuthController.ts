//src\controllers\googleAuthController.ts
import { Request, Response } from 'express';
import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

// Create a new OAuth2Client with your Google Client ID
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Verify the Google client ID is loaded
console.log("Google Client ID configured:", process.env.GOOGLE_CLIENT_ID ? "Yes (length: " + process.env.GOOGLE_CLIENT_ID.length + ")" : "No");

// Función para autenticación con Google (maneja tanto login como registro)
export const googleAuth = async (req: express.Request, res: express.Response) : Promise<express.Response> => {
  try {
    console.log("Google Auth endpoint hit");
    console.log("Request headers:", req.headers);
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    // Check if we have a credential in the request
    if (!req.body) {
      return res.status(400).json({ message: 'Request body is empty' });
    }
    
    const { credential } = req.body;
    
    console.log("Credential value:", credential ? "Present" : "Not present");
    console.log("Credential type:", typeof credential);
    
    // Handle empty credential
    if (!credential) {
      return res.status(400).json({ 
        message: 'Credential not provided',
        body: req.body
      });
    }
    
    // Handle non-string credential
    if (typeof credential !== 'string') {
      return res.status(400).json({ 
        message: 'Credential must be a string',
        receivedType: typeof credential
      });
    }
    
    // Log the first part of the credential (for debugging)
    if (credential.length > 20) {
      console.log("Credential starts with:", credential.substring(0, 20) + "...");
      console.log("Credential length:", credential.length);
    } else {
      console.log("WARNING: Credential is too short:", credential);
      return res.status(400).json({ message: 'Invalid credential format - too short' });
    }
    
    // Ensure the credential looks like a JWT token (starts with "eyJ")
    if (!credential.startsWith("eyJ")) {
      console.log("WARNING: Credential doesn't look like a JWT token");
      return res.status(400).json({ message: 'Credential does not appear to be a valid JWT token' });
    }
    
    console.log("About to verify token with Google...");
    
    // Verify the ID Token with Google
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Token verification succeeded but payload is empty');
      }
      
      console.log("Google payload verified successfully:", {
        sub: payload.sub,
        email: payload.email,
        name: payload.name
      });
      
      // Look for existing user
      let user = await User.findOne({ email: payload.email });
      
      if (!user) {
        console.log("Creating new user for:", payload.email);
        // Create new user if none exists
        user = new User({
          name: payload.name,
          email: payload.email,
          avatar: payload.picture,
          authProvider: 'google',
          googleId: payload.sub,
          role: 'registered',
        });
        await user.save();
        console.log("New user created with ID:", user._id);
      } else if (!user.googleId) {
        console.log("Updating existing user with Google ID:", user._id);
        // Update existing user with Google ID if needed
        user.googleId = payload.sub;
        user.authProvider = user.authProvider || 'google';
        await user.save();
      }
      
      // Generate JWT token
      const jwtToken = jwt.sign(
        { _id: user._id },
        process.env.JWT_SECRET || '',
        { expiresIn: '7d' }
      );
      
      console.log("Authentication successful for:", user.email);
      
      return res.json({
        user,
        token: jwtToken,
      });
    } catch (verifyError) {
      console.error("Google token verification error:", verifyError);
      return res.status(401).json({
        message: 'Google token verification failed',
        error: verifyError instanceof Error ? verifyError.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({ 
      message: 'Authentication failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Función para registrar un nuevo usuario
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }
    
    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Crear nuevo usuario
    const user = new User({
      name,
      email,
      password: hashedPassword,
      authProvider: 'email', // Indicar que el registro es mediante email
      role: 'registered', // Asignar un rol por defecto
    });
    
    await user.save();
    
    // Generar JWT
    const jwtToken = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET || '',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      user,
      token: jwtToken,
    });
  } catch (error) {
    console.error('Error en el registro:', error);
    res.status(500).json({ message: 'Error en el registro' });
  }
};



// Función para verificar un token de Google directamente
export const verifyGoogleToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token no proporcionado' });
    }
    
    // Verificar el token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ message: 'Token inválido' });
    }
    
    // Devolver la información del usuario
    res.json({
      verified: true,
      payload: {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        email_verified: payload.email_verified
      }
    });
  } catch (error) {
    console.error('Error al verificar token de Google:', error);
    res.status(400).json({
      verified: false,
      message: 'Token inválido',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};