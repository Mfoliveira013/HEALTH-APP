const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = 3000;

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        // Cria o diretório se não existir
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Gera um nome único para o arquivo
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Lista de tipos MIME permitidos
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não permitido. Apenas imagens (JPEG, PNG, GIF, WEBP) são aceitas.'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // limite de 5MB
    }
});

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuração do JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_muito_segura_123';

// Configuração do pool de conexão com o banco de dados
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'banco_teste',
    password: '102030',
    port: 5432,
});

// Middlewares - IMPORTANTE: devem vir antes das rotas
app.use((req, res, next) => {
    // Allow requests from any origin
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de autenticação
function autenticarToken(req, res, next) {
    console.log('=== Iniciando autenticação do token ===');
    console.log('URL da requisição:', req.url);
    console.log('Método da requisição:', req.method);
    console.log('Headers recebidos:', JSON.stringify(req.headers, null, 2));
    
    const authHeader = req.headers['authorization'];
    console.log('Header de autorização:', authHeader);
    
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Token extraído:', token);

    if (!token) {
        console.log('Token não encontrado no header');
        return res.status(401).json({ message: 'Token não encontrado' });
    }

    jwt.verify(token, JWT_SECRET, (err, usuario) => {
        if (err) {
            console.error('Erro na verificação do token:', err);
            return res.status(403).json({ message: 'Token inválido' });
        }
        console.log('Token verificado com sucesso. Usuário:', usuario);
        req.usuario = usuario;
        next();
    });
}

// Rota protegida: obter dados do perfil do usuário
app.get('/usuarios/perfil', autenticarToken, async (req, res) => {
    console.log('=== Recebida requisição para /usuarios/perfil ===');
    const idUsuario = req.usuario.id;
    console.log('ID do usuário:', idUsuario);

    try {
        console.log('Executando query para buscar dados do usuário...');
        const result = await pool.query(
            'SELECT id, nome, email, peso, altura, idade FROM usuarios WHERE id = $1',
            [idUsuario]
        );
        console.log('Resultado da query:', result.rows);

        if (result.rows.length === 0) {
            console.log('Usuário não encontrado no banco de dados');
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        console.log('Enviando dados do usuário:', result.rows[0]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro detalhado ao buscar dados do usuário:', error);
        res.status(500).json({ message: 'Erro ao buscar dados do usuário' });
    }
});

// Rota de login
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        const user = result.rows[0];
        
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        const senhaOk = await bcrypt.compare(senha, user.senha);
        if (!senhaOk) {
            return res.status(401).json({ message: 'Senha incorreta' });
        }

        const token = jwt.sign(
            { id: user.id, nome: user.nome },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ 
            message: `Bem-vindo, ${user.nome}`,
            token,
            userId: user.id
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro no login' });
    }
});

// Rota de cadastro
app.post('/cadastro', async (req, res) => {
    const { nome, email, senha, peso, altura, idade } = req.body;

    if (!nome || !email || !senha || !peso || !altura || !idade) {
        return res.status(400).json({ message: 'Preencha todos os campos' });
    }

    try {
        const verifica = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (verifica.rows.length > 0) {
            return res.status(400).json({ message: 'Email já cadastrado' });
        }

        const senhaHash = await bcrypt.hash(senha, 10);
        await pool.query(
            'INSERT INTO usuarios (nome, email, senha, peso, altura, idade) VALUES ($1, $2, $3, $4, $5, $6)',
            [nome, email, senhaHash, peso, altura, idade]
        );

        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    } catch (error) {
        console.error('Erro ao cadastrar usuário:', error);
        res.status(500).json({ message: 'Erro ao cadastrar usuário' });
    }
});

// Rota protegida: registrar hidratação
app.post('/registro/hidratacao', autenticarToken, async (req, res) => {
    const { qntd_hid } = req.body;
    const id_usuario = req.usuario.id;

    try {
        const result = await pool.query(
            'INSERT INTO registro_hidratacao (qntd_hid, id_usuario, data_registro) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING *',
            [qntd_hid, id_usuario]
        );
        
        res.json({ 
            message: 'Hidratação registrada com sucesso!',
            registro: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao registrar hidratação:', error);
        res.status(500).json({ message: 'Erro ao registrar hidratação' });
    }
});

// Rota protegida: registrar calorias
app.post('/registro/calorias', autenticarToken, async (req, res) => {
  const { qntd_cal } = req.body;
  const id_usuario = req.usuario.id;

  try {
    await pool.query(
      'INSERT INTO registro_calorias (data_cal, qntd_cal, id_usuario) VALUES (CURRENT_DATE, $1, $2)',
      [qntd_cal, id_usuario]
    );
    res.json({ message: 'Calorias registradas com sucesso!' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Erro ao registrar calorias' });
  }
});

// Rota protegida: histórico de hidratação
app.get('/registro/hidratacao/historico', autenticarToken, async (req, res) => {
    const id_usuario = req.usuario.id;

    try {
        const result = await pool.query(
            `SELECT 
                qntd_hid AS quantidade,
                data_registro AS data
             FROM registro_hidratacao 
             WHERE id_usuario = $1 
             ORDER BY data_registro DESC`,
            [id_usuario]
        );

        // Converte a quantidade de litros
        const registros = result.rows.map(row => ({
            ...row,
            quantidade: parseFloat(row.qntd_hid)
        }));

        res.json({ registros });
    } catch (error) {
        console.error('Erro ao buscar histórico de hidratação:', error);
        res.status(500).json({ message: 'Erro ao buscar histórico de hidratação' });
    }
});

// Rota protegida: histórico de calorias
app.get('/registro/calorias/historico', autenticarToken, async (req, res) => {
    const id_usuario = req.usuario.id;

    try {
        const result = await pool.query(
            `SELECT 
                qntd_cal AS quantidade,
                data_cal AS data
             FROM registro_calorias 
             WHERE id_usuario = $1 
             ORDER BY data_cal DESC`,
            [id_usuario]
        );

        // Converte a quantidade para número
        const registros = result.rows.map(row => ({
            ...row,
            quantidade: parseInt(row.quantidade)
        }));

        res.json({ registros });
    } catch (error) {
        console.error('Erro ao buscar histórico de calorias:', error);
        res.status(500).json({ message: 'Erro ao buscar histórico de calorias' });
    }
});

// Rota protegida: atualizar dados do usuário
app.put('/usuarios/atualizar', autenticarToken, async (req, res) => {
    const { nome, email, peso, altura, idade } = req.body;
    const idUsuario = req.usuario.id;

    try {
        // Verificar se o email já está em uso por outro usuário
        if (email) {
            const emailCheck = await pool.query(
                'SELECT id FROM usuarios WHERE email = $1 AND id != $2',
                [email, idUsuario]
            );
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ message: 'Este email já está em uso por outro usuário' });
            }
        }

        // Atualizar os dados do usuário
        const result = await pool.query(
            `UPDATE usuarios 
             SET nome = COALESCE($1, nome),
                 email = COALESCE($2, email),
                 peso = COALESCE($3, peso),
                 altura = COALESCE($4, altura),
                 idade = COALESCE($5, idade)
             WHERE id = $6
             RETURNING *`,
            [nome, email, peso, altura, idade, idUsuario]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        const usuarioAtualizado = result.rows[0];
        delete usuarioAtualizado.senha;

        res.json({
            message: 'Dados atualizados com sucesso',
            usuario: usuarioAtualizado
        });
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ message: 'Erro ao atualizar dados do usuário' });
    }
});

// Resumo dos registros (água e calorias) do dia atual
app.get('/registro/resumo', autenticarToken, async (req, res) => {
    const idUsuario = req.usuario.id;

    try {
        const { rows: hidratacao } = await pool.query(
            `SELECT COALESCE(SUM(qntd_hid), 0) AS total_agua
             FROM registro_hidratacao
             WHERE id_usuario = $1 AND DATE(data_registro) = CURRENT_DATE`,
            [idUsuario]
        );

        const { rows: calorias } = await pool.query(
            `SELECT COALESCE(SUM(qntd_cal), 0) AS total_calorias
             FROM registro_calorias
             WHERE id_usuario = $1 AND DATE(data_cal) = CURRENT_DATE`,
            [idUsuario]
        );

        res.json({
            totalAgua: parseFloat(hidratacao[0].total_agua),
            totalCalorias: parseInt(calorias[0].total_calorias)
        });
    } catch (error) {
        console.error('Erro ao obter resumo:', error);
        res.status(500).json({ message: 'Erro ao obter resumo' });
    }
});

// GET /metas - Obter metas diárias
app.get('/metas', autenticarToken, async (req, res) => {
    const id_usuario = req.usuario.id;
    const data_meta = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD

    try {
        // Buscar metas do usuário
        const metasResult = await pool.query(
            `SELECT meta_hid, meta_cal, data_meta 
             FROM meta_usuario 
             WHERE id_usuario = $1 AND data_meta = $2`,
            [id_usuario, data_meta]
        );

        // Buscar registros do dia
        const registrosHidratacao = await pool.query(
            `SELECT COALESCE(SUM(qntd_hid), 0) as total_hid
             FROM registro_hidratacao 
             WHERE id_usuario = $1 AND DATE(data_registro) = $2`,
            [id_usuario, data_meta]
        );

        const registrosCalorias = await pool.query(
            `SELECT COALESCE(SUM(qntd_cal), 0) as total_cal
             FROM registro_calorias 
             WHERE id_usuario = $1 AND data_cal = $2`,
            [id_usuario, data_meta]
        );

        const metas = metasResult.rows[0] || { meta_hid: 2000, meta_cal: 2000 }; // Valores padrão
        const totalHid = registrosHidratacao.rows[0].total_hid;
        const totalCal = registrosCalorias.rows[0].total_cal;

        res.json({
            metas: {
                ...metas,
                meta_hid_atual: totalHid,
                meta_cal_atual: totalCal
            }
        });
    } catch (error) {
        console.error('Erro ao buscar metas:', error);
        res.status(500).json({ message: 'Erro ao buscar metas' });
    }
});

// POST /metas - Salvar metas diárias
app.post('/metas', autenticarToken, async (req, res) => {
    const { metaAgua, metaCalorias, metaPeso } = req.body;
    const id_usuario = req.usuario.id;
    const data_meta = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD

    try {
        const result = await pool.query(
            `INSERT INTO meta_usuario (meta_hid, meta_cal, data_meta, id_usuario)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id_usuario, data_meta)
             DO UPDATE SET meta_hid = $1, meta_cal = $2
             RETURNING *`,
            [metaAgua, metaCalorias, data_meta, id_usuario]
        );

        // Buscar registros do dia para calcular progresso
        const registrosHidratacao = await pool.query(
            `SELECT COALESCE(SUM(qntd_hid), 0) as total_hid
             FROM registro_hidratacao 
             WHERE id_usuario = $1 AND DATE(data_registro) = $2`,
            [id_usuario, data_meta]
        );

        const registrosCalorias = await pool.query(
            `SELECT COALESCE(SUM(qntd_cal), 0) as total_cal
             FROM registro_calorias 
             WHERE id_usuario = $1 AND data_cal = $2`,
            [id_usuario, data_meta]
        );

        const metas = result.rows[0];
        const totalHid = registrosHidratacao.rows[0].total_hid;
        const totalCal = registrosCalorias.rows[0].total_cal;

        res.status(200).json({ 
            message: 'Metas salvas com sucesso!', 
            metas: {
                ...metas,
                meta_hid_atual: totalHid,
                meta_cal_atual: totalCal
            }
        });
    } catch (error) {
        console.error('Erro ao salvar metas:', error);
        res.status(500).json({ message: 'Erro ao salvar metas' });
    }
});

// Rota para criar a restrição de unicidade na tabela meta_usuario
app.post('/setup-meta-usuario', async (req, res) => {
    try {
        await pool.query(`
            ALTER TABLE meta_usuario 
            ADD CONSTRAINT meta_usuario_id_usuario_data_meta_key 
            UNIQUE (id_usuario, data_meta);
        `);
        res.json({ message: 'Restrição de unicidade adicionada com sucesso!' });
    } catch (error) {
        console.error('Erro ao adicionar restrição:', error);
        res.status(500).json({ message: 'Erro ao adicionar restrição' });
    }
});

// Rota para criar nível do usuário
app.post('/nivel', autenticarToken, async (req, res) => {
    try {
        const id_usuario = req.usuario.id;
        const result = await pool.query(
            'INSERT INTO nivel (nivel_usu, data_nivel, id_usuario) VALUES ($1, NOW(), $2) RETURNING *',
            [1, id_usuario]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar nível:', error);
        res.status(500).json({ message: 'Erro ao criar nível' });
    }
});

// Rota protegida: obter nível do usuário
app.get('/nivel', autenticarToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT nivel_usu FROM nivel WHERE id_usuario = $1 ORDER BY data_nivel DESC LIMIT 1',
            [req.usuario.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Nível não encontrado' });
        }

        res.json({ nivel: result.rows[0].nivel_usu });
    } catch (error) {
        console.error('Erro ao buscar nível:', error);
        res.status(500).json({ message: 'Erro ao buscar nível do usuário' });
    }
});

// Rota para atualizar nível do usuário
app.put('/nivel', autenticarToken, async (req, res) => {
    try {
        const { id_usuario } = req.usuario;
        const { nivel_usu } = req.body;
        
        await pool.query(
            'UPDATE nivel SET nivel_usu = ?, data_nivel = NOW() WHERE id_usuario = ?',
            [nivel_usu, id_usuario]
        );
        
        const [rows] = await pool.query(
            'SELECT * FROM nivel WHERE id_usuario = ?',
            [id_usuario]
        );
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar nível:', error);
        res.status(500).json({ message: 'Erro ao atualizar nível' });
    }
});

// Modificar a rota de registro para criar nível junto com o usuário
app.post('/usuarios/registro', async (req, res) => {
    const { nome, email, senha, peso, altura, idade } = req.body;
    
    try {
        // Iniciar transação
        await pool.query('START TRANSACTION');
        
        // Verificar se o email já existe
        const [existingUsers] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ message: 'Email já cadastrado' });
        }
        
        // Criar usuário
        const [result] = await pool.query(
            'INSERT INTO usuarios (nome, email, senha, peso, altura, idade) VALUES (?, ?, ?, ?, ?, ?)',
            [nome, email, senha, peso, altura, idade]
        );
        
        const id_usuario = result.insertId;
        
        // Criar nível inicial para o usuário
        await pool.query(
            'INSERT INTO nivel (nivel_usu, data_nivel, id_usuario) VALUES (1, NOW(), ?)',
            [id_usuario]
        );
        
        // Commit da transação
        await pool.query('COMMIT');
        
        res.status(201).json({ message: 'Usuário registrado com sucesso', id_usuario });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ message: 'Erro ao registrar usuário' });
    }
});

// Rota protegida: upload de avatar
app.post('/upload-avatar', autenticarToken, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Nenhum arquivo enviado' });
        }

        // Gera a URL do avatar
        const avatarUrl = `/uploads/${req.file.filename}`;
        
        // Atualiza o avatar_url do usuário no banco de dados
        const result = await pool.query(
            'UPDATE usuarios SET avatar_url = $1 WHERE id = $2 RETURNING avatar_url',
            [avatarUrl, req.usuario.id]
        );

        if (result.rows.length === 0) {
            // Se o usuário não for encontrado, remove o arquivo
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        res.json({ 
            message: 'Avatar atualizado com sucesso',
            avatarUrl: avatarUrl
        });
    } catch (error) {
        // Se houver erro, remove o arquivo
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Erro ao fazer upload do avatar:', error);
        res.status(500).json({ message: 'Erro ao fazer upload do avatar' });
    }
});

const verificarToken = require('./html/middlewares/auth'); 

module.exports = app;

// Iniciar o servidor - IMPORTANTE: deve ser a última linha
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

