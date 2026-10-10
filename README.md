# Sistema de gestão de recuperação judicial

Projeto de TCC com frontend React/TypeScript e API Java/Spring Boot, persistência MongoDB e autenticação JWT.

## Requisitos

- Node.js compatível com o Vite 8 (a validação foi feita com Node 24).
- JDK 21.
- MongoDB acessível pela configuração do backend.
- Gradle Wrapper incluído no backend; a primeira execução pode precisar de internet.

## Executar no PowerShell

Backend:

```powershell
cd C:\tcc\Projeto\Backend\rj-system
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21.0.12'
$env:SPRING_MONGODB_URI = 'mongodb://localhost:27017/rj-system'
$env:APP_SECURITY_JWT_SECRET = '<segredo aleatorio com pelo menos 32 bytes>'
.\gradlew.bat bootRun
```

Use o caminho do JDK instalado na sua máquina e um segredo próprio. Variáveis de ambiente sobrescrevem as propriedades correspondentes. Não publique credenciais reais no repositório.

Frontend, em outro terminal:

```powershell
cd C:\tcc\Projeto\Frontend
npm.cmd ci
Copy-Item .env.example .env.local
npm.cmd run dev
```

A interface usa `http://localhost:5173` e a API `http://localhost:8080`. Ajuste `VITE_API_URL` em `.env.local` se necessário. O CORS do backend permite as origens locais na porta 5173.

## Usuários e acesso

Login e health check são públicos. O cadastro `POST /api/auth/register` exige o token de um administrador. Novos usuários recebem o perfil `OPERADOR`; administradores e operadores podem usar os módulos do sistema, mas apenas administradores cadastram usuários.

Administradores já existentes continuam válidos. Para um banco vazio, configure as variáveis abaixo antes de iniciar o backend:

```powershell
$env:APP_BOOTSTRAP_ADMIN_EMAIL = '<email do administrador>'
$env:APP_BOOTSTRAP_ADMIN_PASSWORD = '<senha de pelo menos 8 caracteres>'
```

O bootstrap só cria o administrador quando não há nenhum usuário. Ele não modifica nem promove contas existentes. Remova essas variáveis depois da criação. Se o banco já tiver usuários sem administrador, o perfil deve ser corrigido diretamente por quem administra o banco.

## API

| Rotas | Função |
|---|---|
| `/api/auth/login`, `/api/auth/register`, `/api/auth/me` | Autenticação e usuários |
| `/api/processos` e `/api/processos/{id}` | Cadastro, consulta, edição e exclusão de processos |
| `/api/processos/{id}/timeline` | Atualização de eventos |
| `/api/credores` e `/api/credores/{id}` | Gestão de credores |
| `/api/credores/importar` | Importação de credores |
| `/api/processos/{processoId}/documentos` | Lista e upload de documentos |
| `/api/documentos/{id}` e `/api/documentos/{id}/download` | Exclusão e download |

Use `Authorization: Bearer <token>` nas requisições protegidas. Há uma coleção de requisições em `Backend/rj-system/postman`.

## Regras e indicadores

- Processos com credores não podem ser excluídos: remova ou transfira os credores primeiro. Processos sem credores têm seus documentos removidos na exclusão.
- Alterações em credores recarregam processos e credores pela API, incluindo os totais financeiros.
- A importação valida todos os processos antes de escrever. Repetir itens idênticos (processo, documento, nome, tipo, valor e status) reutiliza o mesmo registro e completa vínculos pendentes. Alterar esses campos gera outro item; a importação não é um mecanismo de atualização de cadastros.
- A importação não é uma transação atômica: uma falha de infraestrutura pode deixar parte do lote salva. A interface informa essa possibilidade e permite repetir o mesmo lote. Dados importados antes desta implementação não recebem automaticamente os novos IDs.
- A idade média mede meses desde a abertura até hoje. O percentual de passivo em processos aprovados compara o passivo desses processos com o passivo total. Esses indicadores não medem homologação nem valores efetivamente recuperados.
- O gráfico de distribuição do passivo usa valores monetários para dimensionar as fatias.
- A exportação dos relatórios abre a impressão do navegador, que permite salvar em PDF.

## Validação

```powershell
cd C:\tcc\Projeto\Frontend
npm.cmd run build
cd C:\tcc\Projeto\Backend\rj-system
.\gradlew.bat test
```

Os testes cobrem restrições de cadastro, perfil do novo usuário, exclusão de processo com e sem credores, validação prévia da importação e repetição de lote após falha de vínculo. O teste de contexto usa a configuração MongoDB disponível no ambiente.

Os uploads ficam no diretório configurado por `app.upload.dir` (padrão `uploads`). Inclua esse diretório e o MongoDB nos backups.
