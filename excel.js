const ExcelJS = require('exceljs');
const db = require('./database');
const path = require('path');

async function exportarRelatorio() {
  const membros = await db.getTodosMembros();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Bot Unidade Delta';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Relatório Delta', {
    pageSetup: { orientation: 'landscape' },
  });

  sheet.columns = [
    { header: 'Posição', key: 'pos',      width: 10 },
    { header: 'ID Discord', key: 'id',    width: 22 },
    { header: 'Username', key: 'username',width: 22 },
    { header: 'Horas Totais', key: 'horas',width: 15 },
    { header: 'Apreensões realizadas', key: 'acoes',width: 15 },
    { header: 'Status', key: 'status',    width: 18 },
  ];

  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2B2D31' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF5865F2' } },
    };
  });
  sheet.getRow(1).height = 22;

  membros.forEach((m, i) => {
    const row = sheet.addRow({
      pos:      i + 1,
      id:       m.id,
      username: m.username,
      horas:    parseFloat(m.horas.toFixed(2)),
      acoes:    m.acoes,
      status:   m.inicio_plantao ? '🟢 Em expediente' : '🔴 Fora de Serviço',
    });

    if (i % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F3F5' } };
      });
    }

    row.getCell('horas').numFmt = '0.00"h"';
    row.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const lastRow = sheet.lastRow.number + 2;
  sheet.getCell(`A${lastRow}`).value = `Gerado em: ${new Date().toLocaleString('pt-BR')}`;
  sheet.getCell(`A${lastRow}`).font = { italic: true, color: { argb: 'FF888888' } };


  const nomeArquivo = 'relatorio_delta.xlsx';
  const caminhoCompleto = path.join(__dirname, 'planilhas', nomeArquivo);
  
  await workbook.xlsx.writeFile(caminhoCompleto);
  return caminhoCompleto;
}

module.exports = { exportarRelatorio };
