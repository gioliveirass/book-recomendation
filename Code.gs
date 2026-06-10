/**
 * Google Apps Script — Delulu Literário
 * Backend para receber recomendações de livros e salvar no Google Sheets.
 */

const SHEET_NAME = 'Recomendações';

function doGet(e) {
  if (e.parameter.titulo) {
    return saveRecommendation(e.parameter);
  }

  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'API do Delulu Literário está funcionando.',
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = parseRequestData(e);
    return saveRecommendation(data);
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function parseRequestData(e) {
  if (e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }

  if (e.parameter && e.parameter.titulo) {
    return e.parameter;
  }

  throw new Error('Nenhum dado recebido.');
}

function saveRecommendation(data) {
  const titulo = String(data.titulo || '').trim();
  const autores = String(data.autores || '').trim();
  const capa = String(data.capa || '').trim();
  const bookId = String(data.googleBooksId || data.bookId || '').trim();
  const ondeComprar = String(data.ondeComprar || '').trim();
  const dataEnvio = String(data.dataEnvio || '').trim() || formatDateNow();

  if (!titulo || !bookId) {
    return jsonResponse({ success: false, error: 'Título e ID do livro são obrigatórios.' });
  }

  const sheet = getOrCreateSheet();
  sheet.appendRow([
    dataEnvio,
    titulo,
    autores,
    capa,
    bookId,
    ondeComprar,
  ]);

  return jsonResponse({ success: true, message: 'Recomendação salva com sucesso.' });
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Data',
      'Título',
      'Autores',
      'Capa',
      'ID do Livro',
      'Onde Comprar',
    ]);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function formatDateNow() {
  const now = new Date();
  return Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
