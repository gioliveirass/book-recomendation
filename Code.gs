/**
 * Google Apps Script — Delulu Literário
 * Backend para receber recomendações de livros e salvar no Google Sheets.
 */

const SHEET_NAME = 'Recomendações';
const BOOK_ID_COLUMN = 5;
// Cole o ID da planilha (parte da URL: .../spreadsheets/d/ESTE_ID/edit)
const SPREADSHEET_ID = '1tH34di3cPsWzrnUrPlLqPOX6sFErPg-u6tOYhiv82LA';

function doGet(e) {
  const callback = e.parameter.callback;
  let payload;

  try {
    if (e.parameter.action === 'check') {
      const bookId = String(e.parameter.googleBooksId || e.parameter.bookId || '').trim();
      payload = { exists: bookId ? bookIdExists(bookId) : false };
    } else if (e.parameter.titulo) {
      Logger.log('Salvando: ' + e.parameter.titulo);
      payload = processRecommendation(e.parameter);
      if (!callback) {
        return respondViaPostMessage(payload);
      }
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
    return respondViaPostMessage(processRecommendation(data));
  } catch (err) {
    return respondViaPostMessage({ success: false, error: err.message });
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

function bookIdExists(bookId) {
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  const ids = sheet.getRange(2, BOOK_ID_COLUMN, lastRow, BOOK_ID_COLUMN).getValues();
  const normalized = String(bookId).trim();

  return ids.some(function (row) {
    return String(row[0]).trim() === normalized;
  });
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

    if (bookIdExists(bookId)) {
      return {
        success: false,
        duplicate: true,
        error: 'Este livro já foi recomendado no clube.',
      };
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
  if (SPREADSHEET_ID) return SpreadsheetApp.openById(SPREADSHEET_ID);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
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

function respondViaPostMessage(payload) {
  const json = JSON.stringify(payload)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
  const html = [
    '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><script>',
    'try {',
    '  window.parent.postMessage({ source: "delulu-literario", payload: ',
    json,
    ' }, "*");',
    '} catch (e) {}',
    '</script></body></html>',
  ].join('');

  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
