/**
 * Google Apps Script — Delulu Literário
 * Backend para receber recomendações de livros e salvar no Google Sheets.
 */

const SHEET_NAME = 'Recomendações';

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'API do Delulu Literário está funcionando.',
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const titulo = String(data.titulo || '').trim();
    const autores = String(data.autores || '').trim();
    const capa = String(data.capa || '').trim();
    const googleBooksId = String(data.googleBooksId || '').trim();
    const ondeComprar = String(data.ondeComprar || '').trim();
    const dataEnvio = String(data.dataEnvio || '').trim() || formatDateNow();

    if (!titulo || !googleBooksId) {
      return jsonResponse({ success: false, error: 'Título e Google Books ID são obrigatórios.' }, 400);
    }

    const sheet = getOrCreateSheet();
    sheet.appendRow([
      dataEnvio,
      titulo,
      autores,
      capa,
      googleBooksId,
      ondeComprar,
    ]);

    return jsonResponse({ success: true, message: 'Recomendação salva com sucesso.' });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
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
      'Google Books ID',
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

function jsonResponse(payload, statusCode) {
  const output = ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);

  // Apps Script não suporta códigos HTTP customizados diretamente,
  // mas o payload indica sucesso ou erro para integrações que leem a resposta.
  return output;
}
