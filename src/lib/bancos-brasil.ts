/**
 * Lista completa de bancos do Brasil
 * Fonte: Banco Central do Brasil
 */

export const BANCOS_BRASIL = [
  // Principais bancos comerciais
  { codigo: "001", nome: "Banco do Brasil S.A." },
  { codigo: "237", nome: "Banco Bradesco S.A." },
  { codigo: "104", nome: "Caixa Econômica Federal" },
  { codigo: "341", nome: "Itaú Unibanco S.A." },
  { codigo: "033", nome: "Banco Santander (Brasil) S.A." },
  
  // Bancos digitais
  { codigo: "260", nome: "Nu Pagamentos S.A. (Nubank)" },
  { codigo: "290", nome: "Pagseguro Internet S.A." },
  { codigo: "323", nome: "Mercado Pago" },
  { codigo: "077", nome: "Banco Inter S.A." },
  { codigo: "212", nome: "Banco Original S.A." },
  { codigo: "336", nome: "Banco C6 S.A." },
  { codigo: "380", nome: "PicPay Serviços S.A." },
  { codigo: "403", nome: "Cora Sociedade de Crédito Direto S.A." },
  
  // Bancos públicos
  { codigo: "070", nome: "BRB - Banco de Brasília S.A." },
  { codigo: "021", nome: "BANESTES S.A. Banco do Estado do Espírito Santo" },
  { codigo: "037", nome: "Banco do Estado do Pará S.A." },
  { codigo: "041", nome: "Banco do Estado do Rio Grande do Sul S.A." },
  { codigo: "047", nome: "Banco do Estado de Sergipe S.A." },
  
  // Bancos de investimento e crédito
  { codigo: "208", nome: "Banco BTG Pactual S.A." },
  { codigo: "623", nome: "Banco Pan S.A." },
  { codigo: "422", nome: "Banco Safra S.A." },
  { codigo: "655", nome: "Banco Votorantim S.A." },
  { codigo: "633", nome: "Banco Rendimento S.A." },
  { codigo: "643", nome: "Banco Pine S.A." },
  { codigo: "637", nome: "Banco Sofisa S.A." },
  { codigo: "654", nome: "Banco A.J.Renner S.A." },
  { codigo: "653", nome: "Banco Indusval S.A." },
  { codigo: "069", nome: "Banco Crefisa S.A." },
  
  // Bancos cooperativos
  { codigo: "756", nome: "Banco Cooperativo do Brasil S.A. - BANCOOB" },
  { codigo: "748", nome: "Banco Cooperativo Sicredi S.A." },
  { codigo: "085", nome: "Cooperativa Central de Crédito - AILOS" },
  
  // Financeiras e crédito consignado
  { codigo: "107", nome: "Banco Bocom BBM S.A." },
  { codigo: "249", nome: "Banco Investcred Unibanco S.A." },
  { codigo: "318", nome: "Banco BMG S.A." },
  { codigo: "626", nome: "Banco C6 Consignado S.A." },
  { codigo: "654", nome: "Banco Digimais S.A." },
  { codigo: "739", nome: "Banco Cetelem S.A." },
  { codigo: "743", nome: "Banco Semear S.A." },
  { codigo: "074", nome: "Banco J. Safra S.A." },
  
  // Bancos menores e regionais
  { codigo: "246", nome: "Banco ABC Brasil S.A." },
  { codigo: "025", nome: "Banco Alfa S.A." },
  { codigo: "213", nome: "Banco Arbi S.A." },
  { codigo: "096", nome: "Banco B3 S.A." },
  { codigo: "394", nome: "Banco Bradesco Financiamentos S.A." },
  { codigo: "218", nome: "Banco BS2 S.A." },
  { codigo: "036", nome: "Banco Bradesco BBI S.A." },
  { codigo: "122", nome: "Banco Bradesco BERJ S.A." },
  { codigo: "204", nome: "Banco Bradesco Cartões S.A." },
  { codigo: "063", nome: "Banco Bradescard S.A." },
  { codigo: "065", nome: "Banco AndBank (Brasil) S.A." },
  { codigo: "024", nome: "Banco Bandepe S.A." },
  { codigo: "318", nome: "Banco BMG S.A." },
  { codigo: "752", nome: "Banco BNP Paribas Brasil S.A." },
  { codigo: "107", nome: "Banco BOCOM BBM S.A." },
  { codigo: "063", nome: "Banco Bradescard S.A." },
  { codigo: "036", nome: "Banco Bradesco BBI S.A." },
  { codigo: "122", nome: "Banco Bradesco BERJ S.A." },
  { codigo: "204", nome: "Banco Bradesco Cartões S.A." },
  { codigo: "394", nome: "Banco Bradesco Financiamentos S.A." },
  { codigo: "218", nome: "Banco BS2 S.A." },
  { codigo: "336", nome: "Banco C6 S.A." },
  { codigo: "473", nome: "Banco Caixa Geral - Brasil S.A." },
  { codigo: "412", nome: "Banco Capital S.A." },
  { codigo: "040", nome: "Banco Cargill S.A." },
  { codigo: "739", nome: "Banco Cetelem S.A." },
  { codigo: "233", nome: "Banco Cifra S.A." },
  { codigo: "745", nome: "Banco Citibank S.A." },
  { codigo: "756", nome: "Banco Cooperativo do Brasil S.A. - BANCOOB" },
  { codigo: "748", nome: "Banco Cooperativo Sicredi S.A." },
  { codigo: "075", nome: "Banco CR2 S.A." },
  { codigo: "069", nome: "Banco Crefisa S.A." },
  { codigo: "003", nome: "Banco da Amazônia S.A." },
  { codigo: "083", nome: "Banco da China Brasil S.A." },
  { codigo: "707", nome: "Banco Daycoval S.A." },
  { codigo: "300", nome: "Banco de La Nacion Argentina" },
  { codigo: "495", nome: "Banco de La Provincia de Buenos Aires" },
  { codigo: "494", nome: "Banco de La Republica Oriental del Uruguay" },
  { codigo: "456", nome: "Banco MUFG Brasil S.A." },
  { codigo: "214", nome: "Banco Dibens S.A." },
  { codigo: "654", nome: "Banco Digimais S.A." },
  { codigo: "047", nome: "Banco do Estado de Sergipe S.A." },
  { codigo: "037", nome: "Banco do Estado do Pará S.A." },
  { codigo: "041", nome: "Banco do Estado do Rio Grande do Sul S.A." },
  { codigo: "004", nome: "Banco do Nordeste do Brasil S.A." },
  { codigo: "265", nome: "Banco Fator S.A." },
  { codigo: "224", nome: "Banco Fibra S.A." },
  { codigo: "626", nome: "Banco Ficsa S.A." },
  { codigo: "094", nome: "Banco Finaxis S.A." },
  { codigo: "612", nome: "Banco Guanabara S.A." },
  { codigo: "604", nome: "Banco Industrial do Brasil S.A." },
  { codigo: "653", nome: "Banco Indusval S.A." },
  { codigo: "077", nome: "Banco Inter S.A." },
  { codigo: "249", nome: "Banco Investcred Unibanco S.A." },
  { codigo: "184", nome: "Banco Itaú BBA S.A." },
  { codigo: "029", nome: "Banco Itaú Consignado S.A." },
  { codigo: "074", nome: "Banco J. Safra S.A." },
  { codigo: "376", nome: "Banco J.P. Morgan S.A." },
  { codigo: "217", nome: "Banco John Deere S.A." },
  { codigo: "076", nome: "Banco KDB do Brasil S.A." },
  { codigo: "757", nome: "Banco KEB HANA do Brasil S.A." },
  { codigo: "600", nome: "Banco Luso Brasileiro S.A." },
  { codigo: "389", nome: "Banco Mercantil do Brasil S.A." },
  { codigo: "370", nome: "Banco Mizuho do Brasil S.A." },
  { codigo: "746", nome: "Banco Modal S.A." },
  { codigo: "456", nome: "Banco MUFG Brasil S.A." },
  { codigo: "169", nome: "Banco Olé Consignado S.A." },
  { codigo: "212", nome: "Banco Original S.A." },
  { codigo: "623", nome: "Banco Pan S.A." },
  { codigo: "611", nome: "Banco Paulista S.A." },
  { codigo: "643", nome: "Banco Pine S.A." },
  { codigo: "658", nome: "Banco Porto Real de Investimentos S.A." },
  { codigo: "747", nome: "Banco Rabobank International Brasil S.A." },
  { codigo: "633", nome: "Banco Rendimento S.A." },
  { codigo: "741", nome: "Banco Ribeirão Preto S.A." },
  { codigo: "120", nome: "Banco Rodobens S.A." },
  { codigo: "422", nome: "Banco Safra S.A." },
  { codigo: "033", nome: "Banco Santander (Brasil) S.A." },
  { codigo: "743", nome: "Banco Semear S.A." },
  { codigo: "366", nome: "Banco Société Générale Brasil S.A." },
  { codigo: "637", nome: "Banco Sofisa S.A." },
  { codigo: "464", nome: "Banco Sumitomo Mitsui Brasileiro S.A." },
  { codigo: "082", nome: "Banco Topázio S.A." },
  { codigo: "634", nome: "Banco Triângulo S.A." },
  { codigo: "018", nome: "Banco Tricury S.A." },
  { codigo: "655", nome: "Banco Votorantim S.A." },
  { codigo: "610", nome: "Banco VR S.A." },
  { codigo: "119", nome: "Banco Western Union do Brasil S.A." },
  { codigo: "124", nome: "Banco Woori Bank do Brasil S.A." },
  { codigo: "348", nome: "Banco XP S.A." },
  { codigo: "081", nome: "BancoSeguro S.A." },
  { codigo: "021", nome: "BANESTES S.A. Banco do Estado do Espírito Santo" },
  { codigo: "755", nome: "Bank of America Merrill Lynch Banco Múltiplo S.A." },
  { codigo: "250", nome: "BCV - Banco de Crédito e Varejo S.A." },
  { codigo: "017", nome: "BNY Mellon Banco S.A." },
  { codigo: "070", nome: "BRB - Banco de Brasília S.A." },
  { codigo: "126", nome: "BR Partners Banco de Investimento S.A." },
  { codigo: "173", nome: "BRL Trust Distribuidora de Títulos e Valores Mobiliários S.A." },
  { codigo: "080", nome: "B&T Corretora de Câmbio Ltda." },
  { codigo: "078", nome: "Haitong Banco de Investimento do Brasil S.A." },
  { codigo: "062", nome: "Hipercard Banco Múltiplo S.A." },
  { codigo: "399", nome: "Kirton Bank S.A. - Banco Múltiplo" },
  { codigo: "630", nome: "Smartbank S.A." },
  { codigo: "352", nome: "Travelex Banco de Câmbio S.A." },
  { codigo: "091", nome: "Unicred Central do Rio Grande do Sul" },
  { codigo: "084", nome: "Uniprime Norte do Paraná - Coop de Econ e Créd Mútuo dos Médicos" },
].sort((a, b) => a.nome.localeCompare(b.nome));

/**
 * Busca banco por código
 */
export function buscarBancoPorCodigo(codigo: string) {
  return BANCOS_BRASIL.find(b => b.codigo === codigo);
}

/**
 * Busca bancos por nome (busca parcial)
 */
export function buscarBancosPorNome(termo: string) {
  const termoLower = termo.toLowerCase();
  return BANCOS_BRASIL.filter(b => 
    b.nome.toLowerCase().includes(termoLower) ||
    b.codigo.includes(termo)
  );
}
