// controllers/AuthController.js
const supabase = require('../supabaseClient');  // Assuming supabaseClient.js is correctly set up
const supabaseAdmin = require('../supabaseAdminClient'); // Importa el cliente administrativo
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Handle user login
async function loginHandler(req, res) {
    const { email, password } = req.body;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return res.status(401).json({ message: 'Login failed', error: error.message });
        }

        const session = data.session;
        let user = await User.findOne({ userId: session.user.id });

        if (!user) {
            user = new User({
                userId: session.user.id,
                email: session.user.email,
                username: session.user.email.split('@')[0],
                role: 'Listener',
            });
            await user.save();
        }

        const token = jwt.sign({ userId: session.user.id, email: session.user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({ message: 'Login successful', token, user: session.user });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
}

// Handle user logout
async function logoutHandler(req, res) {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            return res.status(400).json({ message: 'Logout failed', error: error.message });
        }

        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Server error during logout', error: error.message });
    }
}

// Handle session verification
async function checkSessionHandler(req, res) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded); // Verifica si el token está siendo decodificado correctamente
        
        const user = await User.findOne({ userId: decoded.userId });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Session verification error:', error.message);
        return res.status(401).json({ error: 'Invalid token' });
    }
}


// Handle user registration (this could be a separate route or incorporated into loginHandler)
// Handle user registration
async function registerHandler(req, res) {
    const { email, password, username } = req.body; // Aceptar el nombre de usuario del cuerpo de la solicitud

    try {
        // Verifica si el username es válido
        if (username && username.includes('@')) {
            return res.status(400).json({ message: 'Username cannot contain "@"' });
        }

        // Si no se proporciona un username, usar el email sin el '@'
        let finalUsername = username || email.split('@')[0];

        // Validar longitud del username
        if (finalUsername.length > 30) {
            finalUsername = finalUsername.substring(0, 30); // Acortar a 30 caracteres
        }

        // Sustituir caracteres no permitidos por un guion bajo
        finalUsername = finalUsername.replace(/[^a-zA-Z0-9._]+/g, '_');

        // Validar que el username no exceda la longitud máxima después de la sustitución
        if (finalUsername.length > 30) {
            finalUsername = finalUsername.substring(0, 30); // Asegúrate de acortar nuevamente si es necesario
        }

        // Verificar si el username ya existe en la base de datos
        const existingUser = await User.findOne({ username: finalUsername });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already taken. Please choose another one.' });
        }

        // Register user with Supabase
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            return res.status(400).json({ message: 'Registration failed', error: error.message });
        }

        const session = data.user;

        const newUser = new User({
            userId: session.id,
            email: session.email,
            username: finalUsername,  // Usar el nombre de usuario final
            role: 'Listener',  // Default role
        });

        await newUser.save();

        const token = jwt.sign({ userId: session.id, email: session.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: session,
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
}

// Enviar correo de restablecimiento de contraseña
async function forgotPasswordHandler(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'http://media.maar.world/login#recovery', // Ajusta esto según tu configuración
        });

        if (error) {
            return res.status(400).json({ message: 'Password reset failed', error: error.message });
        }

        res.status(200).json({ message: 'Password reset email sent successfully' });
    } catch (error) {
        console.error('Error during password reset request:', error);
        res.status(500).json({ message: 'Server error during password reset request', error: error.message });
    }
}

// Restablecer la contraseña usando el token proporcionado por Supabase
// Password reset handler (backend logic)
async function resetPasswordHandler(req, res) {
    const { accessToken, newPassword } = req.body;

    if (!accessToken || !newPassword) {
        return res.status(400).json({ message: 'Access token and new password are required.' });
    }

    try {
        // Decode the access token to extract user information
        const decodedToken = jwt.decode(accessToken);

        if (!decodedToken || !decodedToken.sub) {
            return res.status(400).json({ message: 'Invalid token provided.' });
        }

        const userId = decodedToken.sub; // Extract the userId (UUID) from the token

        // Update the user's password using Supabase Admin API
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: newPassword,
        });

        if (error) {
            // Handle specific errors, including weak password error
            if (error.code === 'weak_password') {
                return res.status(422).json({
                    message: 'Password is too weak. It should be at least 6 characters long and contain a mix of letters, numbers, and special characters.',
                    error: error.message,
                });
            }

            console.error('Error resetting password:', error);
            return res.status(400).json({ message: 'Password reset failed', error: error.message });
        }

        res.status(200).json({ message: 'Password reset successful!' });
    } catch (error) {
        console.error('Error during password reset:', error);
        res.status(500).json({ message: 'Server error during password reset', error: error.message });
    }
}

module.exports = {
    loginHandler,
    logoutHandler,
    checkSessionHandler,
    forgotPasswordHandler,
    registerHandler,
    resetPasswordHandler  // Asegúrate de exportar esta función
};
