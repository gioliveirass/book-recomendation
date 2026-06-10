# Delulu Literário — Instruções de Configuração

Guia para conectar o formulário web ao Google Sheets via Google Apps Script.

---

## 1. Criar a planilha no Google Sheets

1. Acesse [Google Sheets](https://sheets.google.com) e crie uma nova planilha.
2. Renomeie a planilha para algo como **"Delulu Literário — Recomendações"**.
3. Não é necessário criar as colunas manualmente — o Apps Script cria automaticamente na primeira submissão. As colunas serão:

| Data | Título | Autores | Capa | Google Books ID | Onde Comprar |
|------|--------|---------|------|-----------------|--------------|

---

## 2. Configurar o Google Apps Script

1. Na planilha, vá em **Extensões → Apps Script**.
2. Apague o código padrão e cole o conteúdo do arquivo `Code.gs` deste projeto.
3. Clique em **Salvar** (ícone de disquete) e dê um nome ao projeto, por exemplo: `Delulu Literário API`.
4. (Opcional) Execute a função `doGet` para testar — autorize as permissões quando solicitado.

---

## 3. Publicar como Web App

1. No Apps Script, clique em **Implantar → Nova implantação**.
2. Clique no ícone de engrenagem ao lado de **Tipo** e selecione **App da Web**.
3. Configure:
   - **Descrição:** `API de recomendações v1`
   - **Executar como:** `Eu`
   - **Quem tem acesso:** `Qualquer pessoa`
4. Clique em **Implantar**.
5. Autorize o acesso quando solicitado (pode aparecer um aviso de "app não verificado" — clique em **Avançado → Ir para...**).
6. **Copie a URL do Web App** gerada (formato: `https://script.google.com/macros/s/XXXXX/exec`).

---

## 4. Conectar o frontend

1. Abra o arquivo `script.js`.
2. Substitua o valor de `APPS_SCRIPT_URL`:

```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/SUA_URL_AQUI/exec';
```

3. Salve o arquivo.

---

## 5. Hospedar o site

O formulário é estático (HTML/CSS/JS). Você pode hospedá-lo de várias formas:

### Opção A — GitHub Pages (gratuito)
1. Crie um repositório no GitHub.
2. Envie os arquivos `index.html`, `style.css` e `script.js`.
3. Em **Settings → Pages**, ative o GitHub Pages na branch `main`.
4. Acesse pelo link gerado (ex.: `https://seu-usuario.github.io/delulu-literario`).

### Opção B — Abrir localmente
1. Abra o arquivo `index.html` diretamente no navegador.
2. Funciona para testes, mas alguns navegadores podem bloquear requisições `fetch` em arquivos locais (`file://`). Nesse caso, use um servidor local:

```bash
# Com Python instalado:
python -m http.server 8080

# Ou com Node.js (npx):
npx serve .
```

3. Acesse `http://localhost:8080`.

### Opção C — Netlify / Vercel (gratuito)
1. Faça upload da pasta ou conecte ao repositório Git.
2. O deploy é automático.

---

## 6. Testar o fluxo completo

1. Abra o site no navegador.
2. Digite o nome de um livro no campo de busca.
3. Selecione um resultado da lista suspensa.
4. (Opcional) Preencha "Onde comprar?".
5. Clique em **Enviar recomendação**.
6. Verifique se uma nova linha apareceu na planilha do Google Sheets.

---

## 7. Atualizar o Apps Script

Se você alterar o código do Apps Script:

1. Vá em **Implantar → Gerenciar implantações**.
2. Clique no ícone de lápis da implantação ativa.
3. Em **Versão**, selecione **Nova versão**.
4. Clique em **Implantar**.

A URL do Web App permanece a mesma.

---

## Solução de problemas

| Problema | Solução |
|----------|---------|
| Formulário não envia | Verifique se `APPS_SCRIPT_URL` está configurada corretamente em `script.js`. |
| Dados não aparecem na planilha | Confirme que o Apps Script está vinculado à planilha correta e que você autorizou as permissões. |
| Busca de livros não funciona | A Google Books API é pública e não requer chave. Verifique sua conexão com a internet. |
| Erro de CORS ao enviar | O script usa `mode: 'no-cors'`, que é necessário para o Apps Script. O envio ocorre mesmo sem leitura da resposta. |
| "App não verificado" | Normal para scripts pessoais. Clique em Avançado e autorize. |

---

## Estrutura do projeto

```
book-recommendation/
├── index.html      # Página principal
├── style.css       # Estilos responsivos
├── script.js       # Lógica de busca e envio
├── Code.gs         # Backend Google Apps Script
└── INSTRUCOES.md   # Este arquivo
```
