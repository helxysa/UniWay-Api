import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt'; 
import cors from 'cors';




const app = express();

app.use(cors());
const prisma = new PrismaClient();
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(express.json());

app.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      course: true,
    },
  });
  res.json(users);
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const { password: _, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword, message: 'Login bem-sucedido' });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/users', async (req, res) => {
  try {
    const { name, email, course, password } = req.body;

    if (!name || !email || !course || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'E-mail já está em uso' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar novo usuário
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        course,
        password: hashedPassword,
      },
    });

    // Remover a senha do objeto de resposta
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    if (error instanceof Error) {
      if ('code' in error && error.code === 'P2002') {
        res.status(400).json({ error: 'E-mail já está em uso' });
      } else {
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    } else {
      res.status(500).json({ error: 'Erro desconhecido' });
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
