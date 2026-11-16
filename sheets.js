const { google } = require('googleapis');
const db = require('./database');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');


async function getAuthClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth.getClient();
}

function colToLetter(col) {
  let letter = '';
  while (col > 0) {
    const remainder = (col - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

async function sincronizarSheets() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    throw new Error(
      'Variável GOOGLE_SHEET_ID não definida no .env.\n' +
      'Adicione: GOOGLE_SHEET_ID=<ID da sua planilha Google>'
    );
  }

  const nomeAba = process.env.GOOGLE_SHEET_ABA || null;

  const authClient = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const abas = meta.data.sheets.map((s) => s.properties.title);

  let abaAlvo;
  if (nomeAba) {
    abaAlvo = abas.find(
      (a) => a.toLowerCase() === nomeAba.toLowerCase()
    );
    if (!abaAlvo) {
      throw new Error(
        `Aba "${nomeAba}" não encontrada. Abas disponíveis: ${abas.join(', ')}`
      );
    }
  } else {
    abaAlvo = abas[0];
  }

  const headerRange = `'${abaAlvo}'!1:1`;
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: headerRange,
  });

  const headerRow = headerRes.data.values?.[0] ?? [];

  const colMap = {};
  headerRow.forEach((titulo, idx) => {
    colMap[titulo.trim().toLowerCase()] = idx + 1;
  });

  const COL_USERNAME = colMap['username']      ?? null;
  const COL_HORAS    = colMap['horas totais']  ?? null;
  const COL_ID       = colMap['id discord']    ?? null;
  const COL_POS      = colMap['posição']        ?? null;
  const COL_STATUS   = colMap['status']         ?? null;

  if (!COL_USERNAME || !COL_HORAS) {
    throw new Error(
      'Colunas "Username" e/ou "Horas Totais" não encontradas na linha 1 da aba.\n' +
      `Cabeçalhos detectados: ${headerRow.join(', ')}`
    );
  }

  const membros = await db.getTodosMembros();

  const data = []; 

  membros.forEach((m, i) => {
    const linha = i + 2; 

    if (COL_POS) {
      data.push({
        range: `'${abaAlvo}'!${colToLetter(COL_POS)}${linha}`,
        values: [[i + 1]],
      });
    }
    if (COL_ID) {
      data.push({
        range: `'${abaAlvo}'!${colToLetter(COL_ID)}${linha}`,
        values: [[m.id]],
      });
    }

    data.push({
      range: `'${abaAlvo}'!${colToLetter(COL_USERNAME)}${linha}`,
      values: [[m.username]],
    });

    data.push({
      range: `'${abaAlvo}'!${colToLetter(COL_HORAS)}${linha}`,
      values: [[parseFloat(m.horas.toFixed(2))]],
    });

    if (COL_STATUS) {
      const statusTexto = m.inicio_plantao ? '🟢 Em expediente' : '🔴 Fora de Serviço';
      data.push({
        range: `'${abaAlvo}'!${colToLetter(COL_STATUS)}${linha}`,
        values: [[statusTexto]],
      });
    }
  });

  const linhaRodape = membros.length + 3;
  const colRodape   = COL_POS || COL_ID || COL_USERNAME;
  data.push({
    range: `'${abaAlvo}'!A${linhaRodape}`,
    values: [[`Atualizado em: ${new Date().toLocaleString('pt-BR')}`]],
  });

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data,
    },
  });

  console.log(
    `[Sheets] ✅ ${membros.length} membro(s) sincronizados na aba "${abaAlvo}" da planilha ${sheetId}`
  );

  return membros.length;
}

module.exports = { sincronizarSheets };
