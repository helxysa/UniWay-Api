import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const app = express();
const prisma = new PrismaClient();

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

app.post('/users', async (req, res) => {
  try {
    const { name, email, course, password } = req.body;

    // Validação básica
    if (!name || !email || !course || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Verificar se o e-mail já está em uso
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
