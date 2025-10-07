-- Tabela de usuários
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL,
  avatar_url TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas de segurança (RLS - Row Level Security)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública de alguns campos
CREATE POLICY "Usuários são visíveis para todos" ON usuarios
  FOR SELECT USING (true);

-- Política para permitir que usuários editem apenas seus próprios dados
CREATE POLICY "Usuários podem atualizar seus próprios dados" ON usuarios
  FOR UPDATE USING (auth.uid() = id);

-- Política para permitir que usuários excluam apenas suas próprias contas
CREATE POLICY "Usuários podem excluir suas próprias contas" ON usuarios
  FOR DELETE USING (auth.uid() = id);