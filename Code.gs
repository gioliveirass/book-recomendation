/**
 * Google Apps Script — Delulu Literário
 * Backend para receber recomendações de livros e salvar no Google Sheets.
 */

const SHEET_NAME = 'Recomendações';
// Cole o ID da planilha (parte da URL: .../spreadsheets/d/ESTE_ID/edit)
const SPREADSHEET_ID = '1tH34di3cPsWzrnUrPlLqPOX6sFErPg-u6tOYhiv82LA';

function doGet(e) {
  const callback = e.parameter.callback;
  let payload;

  try {
    if (e.parameter.titulo) {
      payload = processRecommendation(e.parameter);
    } else {
      payload = {
        status: 'ok',
        message: 'API do Delulu Literário está funcionando.',
      };
    }
  } catch (err) {
    payload = { success: false, error: err.message };
  }

  return respond(payload, callback);
}

function doPost(e) {
  try {
    const data = getRequestData(e);
    return respond(processRecommendation(data));
  } catch (err) {
    return respond({ success: false, error: err.message });
  }
}

function getRequestData(e) {
  if (e.parameter && e.parameter.titulo) {
    return e.parameter;
  }

  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (parseErr) {
      throw new Error('Formato de dados inválido.');
    }
  }

  throw new Error('Nenhum dado recebido.');
}

function processRecommendation(data) {
  try {
    const titulo = String(data.titulo || '').trim();
    const autores = String(data.autores || '').trim();
    const capa = String(data.capa || '').trim();
    const bookId = String(data.googleBooksId || data.bookId || '').trim();
    const ondeComprar = String(data.ondeComprar || '').trim();
    const dataEnvio = String(data.dataEnvio || '').trim() || formatDateNow();

    if (!titulo || !bookId) {
      return { success: false, error: 'Título e ID do livro são obrigatórios.' };
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

    return { success: true, message: 'Recomendação salva com sucesso.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getSpreadsheet() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  if (SPREADSHEET_ID) return SpreadsheetApp.openById(SPREADSHEET_ID);
  throw new Error('Planilha não encontrada. Cole o SPREADSHEET_ID no Code.gs.');
}

function getOrCreateSheet() {
  const ss = getSpreadsheet();
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

function respond(payload, callback) {
  const json = JSON.stringify(payload);
  const safeCallback = callback ? String(callback).replace(/[^\w$]/g, '') : '';

  if (safeCallback) {
    return ContentService
      .createTextOutput(`${safeCallback}(${json});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
