import { mkdirSync } from "node:fs";
import * as XLSX from "xlsx";

// Gera uma amostra SINTÉTICA (dados fictícios) com a mesma estrutura do extrato
// BTG, para testar o parser sem expor dados reais. Saída versionada em
// data/sample/btg_br_sample.xlsx.

const rendaVariavel = [
  ["Renda Variável"],
  ["Posição > Ações"],
  ["Código", "Ação", "Qtde.", "Preço Fechamento R$", "Preço Médio R$", "Saldo Bruto R$"],
  ["TEST3", "TESTE ON NM", "100", "10.00", "8.00", "1,000.00"],
  ["DEMO4", "DEMO PN", "200", "5.00", "-", "1,000.00"],
  ["Total em Ações R$", "", "", "", "", "2,000.00"],
  ["Posição > Fundos Listados"],
  ["Código", "Ativo", "Tipo", "Qtde.", "Preço Fechamento R$", "Preço Médio R$", "Saldo Bruto R$"],
  ["XPTO11", "FII XPTO CI", "FII", "50", "100.00", "95.00", "5,000.00"],
  ["Total em Fundos Listados R$", "", "", "", "", "", "5,000.00"],
  ["Movimentação > Ações"],
  ["Data", "Transação", "Código", "Qtde.", "Preço R$", "Valor Bruto R$", "Corretagem e Emolumentos R$", "Valor Líquido R$"],
  ["10/04/2026", "JUROS S/CAPITAL", "TEST3", "100", "-", "50.00", "-", "42.50"],
  ["15/04/2026", "RENDIMENTO", "XPTO11", "50", "-", "75.00", "-", "75.00"],
];

const rendaFixa = [
  ["Renda Fixa"],
  ["Posição > CDB"],
  ["Emissor", "Ativo", "Emissão", "Vencimento", "Liquidez", "Dias", "Data", "Taxa", "Quantidade", "Preço R$", "Saldo Bruto R$", "IR R$", "IOF R$", "Saldo Líquido R$"],
  ["BANCO DEMO", "CDB-DEMO123", "16/04/2026", "17/04/2028", "Sim", "1", "17/04/2026", "CDI", "1000000", "0.01", "10,000.00", "0", "0", "10,000.00"],
  ["Total", "", "", "", "", "", "", "", "", "", "10,000.00", "0", "0", "10,000.00"],
  ["Posição > TESOURO DIRETO - NTNB-P"],
  ["Emissor", "Ativo", "Emissão", "Vencimento", "Liquidez", "Dias", "Data", "Taxa", "Quantidade", "Preço R$", "Saldo Bruto R$", "IR R$", "IOF R$", "Saldo Líquido R$"],
  ["BACEN", "NTNB-P", "15/08/2004", "15/05/2035", "Não", "-", "-", "IPCA + 6%", "5", "2000.00", "10,000.00", "100", "0", "9,900.00"],
  ["Total", "", "", "", "", "", "", "", "", "", "10,000.00", "100", "0", "9,900.00"],
];

const capa = [
  ["Capa"],
  ["Extrato da Conta Investimento"],
  ["Período de 01/04/26 a 18/04/26"],
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(capa), "Capa");
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rendaFixa), "Renda Fixa");
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rendaVariavel), "Renda Variavel");

mkdirSync("data/sample", { recursive: true });
XLSX.writeFile(wb, "data/sample/btg_br_sample.xlsx");
console.log("✓ Amostra gerada: data/sample/btg_br_sample.xlsx");
