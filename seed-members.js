// ═══ SEED MEMBERS FROM CSV DATA ═══
// Run: node seed-members.js
// This creates/updates the members table in Supabase with all employee data
//
// Fonte: "Relação Fornecedores Macfor - Geral.csv"
//
// IMPORTANTE: antes de rodar este script pela primeira vez após esta atualização,
// crie a coluna nova no Supabase (SQL Editor):
//
//   ALTER TABLE members ADD COLUMN IF NOT EXISTS mes_ano_entrada text;
//
// Esta lista reflete SOMENTE os fornecedores presentes no CSV atual (a lista
// antiga tinha nomes que não estão mais nele). Campos que vieram em branco no
// CSV foram deixados como null para serem preenchidos depois.

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const MEMBERS = [
  { name: 'Adriano Lopes Monteiro', squad: 'Syngenta', area: 'Creative', operacoes: true, funcao: 'Creative Senior Captain', report_to: 'Hugo Oliveira', email: 'adriano.monteiro@macfor.com.br', mes_ano_entrada: '02/2026', day_offs: 20 },
  { name: 'Allan Couto', squad: 'Business Development', area: 'Creative', operacoes: true, funcao: 'Creative Senior Captain', report_to: 'Hugo Oliveira', email: 'allan.couto@macfor.com.br', mes_ano_entrada: '08/2025', day_offs: 20 },
  { name: 'Amanda Arduini', squad: null, area: 'Account Partner', operacoes: true, funcao: 'ACCOUNT PARTNER TECHNICAL EXPERT I', report_to: 'Gisele Pozavski', email: 'amanda.arduini@macfor.com.br', mes_ano_entrada: '01/2023', day_offs: 24 },
  { name: 'Amanda Campos', squad: null, area: 'Technical', operacoes: true, funcao: 'CONTENT ADVANCED I', report_to: 'Victor Coleta', email: 'amanda.campos@macfor.com.br', mes_ano_entrada: '10/2022', day_offs: 13 },
  { name: 'Amanda Meneghel', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative Intermediate III', report_to: 'Gustavo Stancial', email: 'amanda.meneghel@macfor.com.br', mes_ano_entrada: '05/2025', day_offs: null },
  { name: 'Ana Julia Silva Ledo', squad: 'Business Development', area: 'Market Intelligence', operacoes: false, funcao: 'Market Intelligence Beginner I', report_to: 'Mariana Batista', email: 'julia.ledo@macfor.com.br', mes_ano_entrada: '09/2025', day_offs: 20 },
  { name: 'Ariane Parreira', squad: null, area: 'Content', operacoes: false, funcao: 'Content Advanced', report_to: 'Daniela Leite', email: 'ariane.parreira@macfor.com.br', mes_ano_entrada: '12/2025', day_offs: 20 },
  { name: 'Beatriz da Silva Vasconcelos', squad: null, area: 'Projetos/Operações', operacoes: true, funcao: 'Analista de Projetos', report_to: 'Mariana Batista', email: 'beatriz.vasconcelos@macfor.com.br', mes_ano_entrada: '08/2025', day_offs: 20 },
  { name: 'Beatriz de Souza Varela da Costa', squad: 'Syngenta', area: 'Content', operacoes: true, funcao: 'Social Advanced I', report_to: 'Allan Couto', email: 'beatriz.costa@macfor.com.br', mes_ano_entrada: '04/2026', day_offs: 20 },
  { name: 'Carlos Gustavo Freire Peres Quintas', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative e Social Senior Captain', report_to: 'Hugo Oliveira', email: 'gustavo.peres@macfor.com.br', mes_ano_entrada: '05/2026', day_offs: 20 },
  { name: 'Carolina Pardini Baldoni', squad: 'Syngenta', area: 'Content', operacoes: true, funcao: 'Content Advanced', report_to: 'Allan Couto', email: 'carolina.pardini@macfor.com.br', mes_ano_entrada: '12/2025', day_offs: 20 },
  { name: 'Daniel Sousa da Silva', squad: null, area: 'Planejamento', operacoes: true, funcao: 'Planner Senior Captain', report_to: 'Hugo Oliveira', email: 'daniel.sousa@macfor.com.br', mes_ano_entrada: '03/2026', day_offs: 20 },
  { name: 'Daniela Leite', squad: null, area: 'Content', operacoes: true, funcao: 'Content Captain I', report_to: 'Hugo Oliveira', email: 'daniela.leite@macfor.com.br', mes_ano_entrada: '01/2025', day_offs: 20 },
  { name: 'Daniele Campos', squad: null, area: 'Quality', operacoes: true, funcao: 'QUALITY TECHNICAL EXPERT I', report_to: 'Mariana Batista', email: 'daniele.campos@macfor.com.br', mes_ano_entrada: '01/2022', day_offs: 31 },
  { name: 'Eduarda Vaz de Freitas', squad: null, area: 'Account Partner', operacoes: true, funcao: 'Account Partner Advanced I', report_to: 'Lucas Soares', email: 'eduarda.freitas@macfor.com.br', mes_ano_entrada: '05/2025', day_offs: 20 },
  { name: 'Elysabeth Barcellos', squad: null, area: 'Content', operacoes: true, funcao: 'Content Intermediate III', report_to: 'Victor Coleta', email: 'elysabeth.barcellos@macfor.com.br', mes_ano_entrada: '01/2025', day_offs: 20 },
  { name: 'Felipe Euller Costa Parente', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative Technical Expert', report_to: 'Guilherme Mortale', email: 'felipe.euller@macfor.com.br', mes_ano_entrada: '09/2025', day_offs: 20 },
  { name: 'Fernanda Moraes Peixoto', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative Team Technical Expert', report_to: 'Hugo Oliveira', email: 'fernanda.peixoto@macfor.com.br', mes_ano_entrada: '05/2026', day_offs: 20 },
  { name: 'Gabriel Barros de Oliveira', squad: null, area: 'SEO', operacoes: true, funcao: 'SEO Advanced II', report_to: 'Michelle Oliveira', email: 'gabriel.oliveira@macfor.com.br', mes_ano_entrada: '03/2026', day_offs: 20 },
  { name: 'Gabriel Contartesi', squad: null, area: 'Media Guild', operacoes: true, funcao: 'DIGITAL MEDIA GUILD CAPTAIN II', report_to: 'Guilherme Castilho', email: 'gabriel.contartesi@macfor.com.br', mes_ano_entrada: '01/2024', day_offs: 15 },
  { name: 'Gabriel Henrique Barros Vilela', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative Intermediate I', report_to: 'João Camargo', email: 'gabriel.vilela@macfor.com.br', mes_ano_entrada: '09/2025', day_offs: 20 },
  { name: 'Gabriel Moura Castelo Branco', squad: 'Syngenta', area: 'Creative', operacoes: true, funcao: 'Creative Advanced', report_to: 'Guilherme Mortale', email: 'gabriel.moura@macfor.com.br', mes_ano_entrada: '11/2025', day_offs: 20 },
  { name: 'Gabriel Pereira Rodrigues', squad: null, area: 'Planejamento', operacoes: true, funcao: 'Planner Technical Expert', report_to: 'Luiz Guedes', email: 'gabriel.rodrigues@macfor.com.br', mes_ano_entrada: '03/2026', day_offs: 20 },
  { name: 'Gabriela Farias', squad: null, area: 'Creative', operacoes: true, funcao: 'CREATIVE ADVANCED III', report_to: 'Mariana Batista', email: 'gabriela.farias@macfor.com.br', mes_ano_entrada: '01/2022', day_offs: 12 },
  { name: 'Gabriela Silva Souza', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative Advanced', report_to: 'Gustavo Stancial', email: 'gabriela.souza@macfor.com.br', mes_ano_entrada: '09/2025', day_offs: 20 },
  { name: 'Gabriella Fontoura Gonçalves', squad: null, area: 'SEO', operacoes: true, funcao: 'Content SEO Advanced I', report_to: 'Michelle Oliveira', email: 'gabriella.fontoura@macfor.com.br', mes_ano_entrada: '02/2026', day_offs: 20 },
  { name: 'Gisele Pozavski', squad: null, area: 'Account Partner', operacoes: true, funcao: 'ACCOUNT PARTNER SENIOR CAPTAIN I', report_to: 'Victor Coleta', email: 'gisele.pozavski@macfor.com.br', mes_ano_entrada: '05/2022', day_offs: null },
  { name: 'Guilherme Andrade', squad: 'Analytics', area: 'Analytics', operacoes: true, funcao: 'TECH LEADER ADVANCED II', report_to: 'Mariana Batista', email: 'guilherme.andrade@macfor.com.br', mes_ano_entrada: '03/2022', day_offs: 40 },
  { name: 'Guilherme Castilho Pinto', squad: null, area: 'Media Guild', operacoes: true, funcao: 'Media and Performance Captain II', report_to: 'Diogo Luchiari', email: 'guilherme.castilho@macfor.com.br', mes_ano_entrada: '02/2025', day_offs: 20 },
  { name: 'Guilherme Mourao', squad: null, area: 'Media Guild', operacoes: true, funcao: 'Digital Media & BI Advanced III', report_to: 'William Jacob', email: 'guilherme.mourao@macfor.com.br', mes_ano_entrada: '12/2024', day_offs: 6 },
  { name: 'Gustavo Rocha', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative Advanced I', report_to: 'Gustavo Stancial', email: 'gustavo.rocha@macfor.com.br', mes_ano_entrada: '01/2024', day_offs: 26 },
  { name: 'Heloisa Franchin', squad: null, area: 'Account Partner', operacoes: true, funcao: 'Account Partner Advanced III', report_to: 'Natália Elias', email: 'heloisa.franchin@macfor.com.br', mes_ano_entrada: '08/2025', day_offs: 20 },
  { name: 'Hugo Oliveira', squad: null, area: 'Creative', operacoes: true, funcao: 'SERVICES DIGITAL COACH', report_to: 'Diogo Luchiari', email: 'hugo.oliveira@macfor.com.br', mes_ano_entrada: '05/2023', day_offs: null },
  { name: 'Jady Cristina Silva', squad: 'Business Development', area: 'Corporate Marketing', operacoes: false, funcao: 'BI & Digital Team Technical Expert I', report_to: 'Fabrício Macias', email: 'jady.silva@macfor.com.br', mes_ano_entrada: '09/2025', day_offs: 20 },
  { name: 'Jéssica Lopes', squad: null, area: 'Creative', operacoes: true, funcao: 'CREATIVE ADVANCED I', report_to: 'João Camargo', email: 'jessica.lopes@macfor.com.br', mes_ano_entrada: '05/2024', day_offs: 20 },
  { name: 'Jéssica Zambeli', squad: null, area: 'Content', operacoes: true, funcao: 'CONTENT INTERMEDIATE II', report_to: 'Victor Coleta', email: 'jessica.zambeli@macfor.com.br', mes_ano_entrada: '01/2024', day_offs: 20 },
  { name: 'João Camargo', squad: null, area: 'Creative', operacoes: true, funcao: 'CREATIVE TEAM TECHNICAL EXPERT I', report_to: 'Hugo Oliveira', email: 'joao.camargo@macfor.com.br', mes_ano_entrada: '08/2021', day_offs: 34 },
  { name: 'João Neto', squad: null, area: 'Planejamento', operacoes: true, funcao: 'PROJECT MANAGEMENT INTERMEDIATE III', report_to: 'Mariana Batista', email: 'joao.neto@macfor.com.br', mes_ano_entrada: '10/2023', day_offs: 36 },
  { name: 'João Paulo da Silva Monteiro', squad: null, area: 'Tech', operacoes: true, funcao: 'Tech Intermediate II', report_to: 'Mariana Baptista', email: 'joao.monteiro@macfor.com.br', mes_ano_entrada: '04/2026', day_offs: 20 },
  { name: 'João Pedro Garcia Fernandes', squad: null, area: 'SEO', operacoes: true, funcao: 'Content SEO Advanced I', report_to: 'Michelle Oliveira', email: 'joao.fernandes@macfor.com.br', mes_ano_entrada: '03/2026', day_offs: 20 },
  { name: 'João Victor Bazoti Brito Delgado', squad: 'Enterprise', area: 'Account Partner', operacoes: true, funcao: 'Account Partner Captain I', report_to: 'Diogo Lucchiari', email: 'joao.bazoti@macfor.com.br', mes_ano_entrada: '04/2026', day_offs: 20 },
  { name: 'Julio Cezar', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative Technical Expert', report_to: 'Guilherme Mortale', email: 'julio.silva@macfor.com.br', mes_ano_entrada: '07/2025', day_offs: 20 },
  { name: 'Kaique Oliveira', squad: null, area: 'Account Partner', operacoes: true, funcao: 'Account Partner Captain I', report_to: 'Diogo Luchiari', email: 'kaique.oliveira@macfor.com.br', mes_ano_entrada: '10/2024', day_offs: 31 },
  { name: 'Leonardo Bocchini Ruiz', squad: null, area: 'Content', operacoes: true, funcao: 'Content Intermediate', report_to: 'Daniela Leite', email: 'leonardo.ruiz@macfor.com.br', mes_ano_entrada: '09/2025', day_offs: 20 },
  { name: 'Leonardo Felippe', squad: null, area: 'Account Partner', operacoes: true, funcao: 'Account Partner Advanced I', report_to: 'Kaique Oliveira', email: 'leonardo.felippe@macfor.com.br', mes_ano_entrada: '12/2024', day_offs: 20 },
  { name: 'Leonardo Lanjoni', squad: null, area: 'SEO', operacoes: true, funcao: 'SEO INTERMEDIATE I', report_to: 'Michelle Oliveira', email: 'leonardo.lanjoni@macfor.com.br', mes_ano_entrada: '06/2023', day_offs: 39 },
  { name: 'Livia Gondim dos Santos', squad: null, area: 'Media Guild', operacoes: true, funcao: 'Media Advanced III', report_to: 'Gabriel Contartesi', email: 'livia.gondim@macfor.com.br', mes_ano_entrada: '09/2025', day_offs: 20 },
  { name: 'Lorena Martinez Laporti', squad: 'Syngenta', area: 'Creative', operacoes: true, funcao: 'Creative Advanced', report_to: 'Guilherme Mortale', email: 'lorena.martinez@macfor.com.br', mes_ano_entrada: '02/2026', day_offs: 20 },
  { name: 'Luana Carla Hilario Silva', squad: null, area: 'Content', operacoes: true, funcao: 'Content Intermediate', report_to: 'Hugo Oliveira', email: 'luana.hilario@macfor.com.br', mes_ano_entrada: '05/2026', day_offs: 20 },
  { name: 'Lucas Soares', squad: null, area: 'Account Partner', operacoes: true, funcao: 'PROJECT MANAGEMENT SENIOR  CAPTAIN I', report_to: 'José Fortunato', email: 'lucas@macfor.com.br', mes_ano_entrada: '02/2020', day_offs: 35 },
  { name: 'Luiz Guedes', squad: null, area: 'Planejamento', operacoes: true, funcao: 'PROJECT MANAGEMENT SENIOR CAPTAIN I', report_to: 'Hugo Oliveira', email: 'luiz.guedes@macfor.com.br', mes_ano_entrada: '12/2023', day_offs: 11 },
  { name: 'Marcelo Blanco', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative Team Technical Expert', report_to: 'Guilherme Mortale', email: 'marcelo.blanco@macfor.com.br', mes_ano_entrada: '03/2026', day_offs: 20 },
  { name: 'Marcelo Borini', squad: 'Syngenta', area: 'Creative', operacoes: true, funcao: 'Creative Advanced', report_to: 'Guilherme Mortale', email: 'marcelo.borini@macfor.com.br', mes_ano_entrada: '11/2025', day_offs: 20 },
  { name: 'Mariana Batista dos Santos', squad: null, area: 'Projetos/Operações', operacoes: true, funcao: 'Project Management Senior Captain I', report_to: 'Victor Coleta', email: 'mariana.batista@macfor.com.br', mes_ano_entrada: '04/2025', day_offs: 20 },
  { name: 'Mariana Tita', squad: null, area: null, operacoes: false, funcao: 'Media Intermediate I', report_to: 'William Jacob', email: 'mariana.tita@macfor.com.br', mes_ano_entrada: '12/2025', day_offs: 20 },
  { name: 'Marina Franco Martins', squad: null, area: 'Content', operacoes: true, funcao: 'Content Advanced III', report_to: 'Allan Couto', email: 'marina.franco@macfor.com.br', mes_ano_entrada: '08/2025', day_offs: 20 },
  { name: 'Matheus Edmundo do Nascimento', squad: 'Syngenta', area: 'Projetos/Operações', operacoes: true, funcao: 'Project Management Intermediate', report_to: 'Mariana Baptista', email: 'matheus.edmundo@macfor.com.br', mes_ano_entrada: '12/2025', day_offs: 20 },
  { name: 'Nadine Cirino Santos de Souza', squad: 'Syngenta', area: 'Content', operacoes: true, funcao: 'Social Advanced', report_to: 'Hugo Oliveira', email: 'nadine.cirino@macfor.com.br', mes_ano_entrada: '06/2026', day_offs: 20 },
  { name: 'Natalia Novaes Elias', squad: 'Syngenta', area: 'Account Partner', operacoes: true, funcao: 'Account Partner Captain I', report_to: 'Victor Coleta', email: 'natalia.elias@macfor.com.br', mes_ano_entrada: '06/2025', day_offs: 20 },
  { name: 'Nathalia Cristina Leite', squad: 'SME', area: 'Creative', operacoes: true, funcao: 'Creative Senior Captain', report_to: 'Hugo Oliveira', email: 'nathalia.leite@macfor.com.br', mes_ano_entrada: '05/2026', day_offs: 20 },
  { name: 'Patrick Chieregato', squad: 'Syngenta', area: 'CRM', operacoes: true, funcao: 'CRM Captain', report_to: 'Diogo Lucchiari', email: 'patrick.chieregato@macfor.com.br', mes_ano_entrada: '05/2026', day_offs: 20 },
  { name: 'Rafael Sapia', squad: 'Syngenta', area: 'Creative', operacoes: true, funcao: 'Creative Advanced', report_to: 'Hugo Oliveira', email: 'rafael.sapia@macfor.com.br', mes_ano_entrada: '10/2025', day_offs: 20 },
  { name: 'Sandra Garcia Soares', squad: 'Syngenta', area: 'Account Partner', operacoes: true, funcao: 'Account Partner Senior Captain I', report_to: 'Diogo Luchiari', email: 'sandra.soares@macfor.com.br', mes_ano_entrada: '06/2022', day_offs: null },
  { name: 'Thalita Ferreira do Nascimento Beloni', squad: 'Syngenta', area: 'Content', operacoes: true, funcao: 'Content Advanced', report_to: 'Allan Couto', email: 'thalita.beloni@macfor.com.br', mes_ano_entrada: '06/2025', day_offs: 20 },
  { name: 'Thalita Roder da Silva', squad: 'Syngenta', area: 'Media Guild', operacoes: true, funcao: 'Media Intermediate III', report_to: 'Gabriel Contartesi', email: 'thalita.roder@macfor.com.br', mes_ano_entrada: '10/2025', day_offs: 20 },
  { name: 'Thiago Rita', squad: 'Syngenta', area: 'Media Guild', operacoes: true, funcao: 'DIGITAL MEDIA ADVANCED I', report_to: 'Willian Jacob', email: 'thiago.rita@macfor.com.br', mes_ano_entrada: '07/2024', day_offs: 22 },
  { name: 'Victor Augusto de Souza', squad: 'Syngenta', area: 'Technical', operacoes: true, funcao: 'CREATIVE ADVANCED I', report_to: 'Guilherme Mortale', email: 'victor.augusto@macfor.com.br', mes_ano_entrada: '08/2024', day_offs: 25 },
  { name: 'Victor Coleta', squad: 'Liderança Syngenta', area: 'Creative', operacoes: true, funcao: 'TECHNICAL SENIOR CAPTAIN I', report_to: 'Diogo Luchiari', email: 'victor.coleta@macfor.com.br', mes_ano_entrada: '02/2021', day_offs: 80 },
  { name: 'Victória Letícia Santos da Cunha Acioli', squad: 'SME', area: 'Creative', operacoes: true, funcao: 'Creative Advanced', report_to: 'João Camargo', email: 'victoria.acioli@macfor.com.br', mes_ano_entrada: '10/2025', day_offs: 20 },
  { name: 'Walderson Luiz da Silva Rocha', squad: 'Enterprise', area: 'Media Guild', operacoes: true, funcao: 'Creative Technical Expert I', report_to: 'Gustavo Stancial', email: 'walderson.rocha@macfor.com.br', mes_ano_entrada: '04/2024', day_offs: 20 },
  { name: 'Willian Jacob', squad: 'Syngenta', area: 'Market Intelligence', operacoes: false, funcao: 'DIGITAL MEDIA CAPTAIN I', report_to: 'Guilherme Castilho', email: 'willian.jacob@macfor.com.br', mes_ano_entrada: '08/2023', day_offs: 36 },
  { name: 'Ewerton Eduardo Rodrigues dos Santos', squad: 'Syngenta', area: 'Media Guild', operacoes: true, funcao: 'Media Advanced', report_to: 'Willian Jacob', email: 'ewerton.eduardo@macfor.com.br', mes_ano_entrada: '06/2026', day_offs: 20 },
  { name: 'Graziela Araújo', squad: 'SME', area: 'Content', operacoes: true, funcao: 'Social Advanced', report_to: 'Gustavo Peres', email: 'graziela.araujo@macfor.com.br', mes_ano_entrada: '06/2026', day_offs: 20 },
  { name: 'Juliana Dias Valente', squad: 'SME', area: 'Content', operacoes: true, funcao: 'Social Intermediate', report_to: 'Gustavo Peres', email: 'juliana.valente@macfor.com.br', mes_ano_entrada: '06/2026', day_offs: 20 },
  { name: 'Deivit Junior', squad: 'SME', area: 'Creative', operacoes: true, funcao: 'Creative Advanced', report_to: 'Nathalia Leite', email: 'deivit.junior@macfor.com.br', mes_ano_entrada: '07/2026', day_offs: 20 },
  { name: 'Beatriz Frontelli dos Santos', squad: 'Enterprise', area: 'Content', operacoes: true, funcao: 'Social Intermediate', report_to: 'Gustavo Peres', email: 'beatriz.frontelli@macfor.com.br', mes_ano_entrada: '07/2026', day_offs: 20 },
  { name: 'Michelle Oliveira', squad: null, area: 'SEO', operacoes: null, funcao: 'Líder', report_to: 'Guilherme Castilho', email: 'michelle.oliveira@macfor.com.br', mes_ano_entrada: '03/2024', day_offs: 4 },
];

async function seed() {
  console.log('Seeding members table...');
  let inserted = 0, updated = 0, errors = 0;

  for (const m of MEMBERS) {
    const payload = {
      name: m.name,
      squad: m.squad,
      area: m.area,
      operacoes: m.operacoes,
      funcao: m.funcao,
      report_to: m.report_to,
      email: m.email,
      day_offs_quota: m.day_offs,
      mes_ano_entrada: m.mes_ano_entrada,
    };

    if (m.email) {
      const { data: existing, error: findError } = await supabase
        .from('members')
        .select('id')
        .ilike('email', m.email)
        .single();

      if (existing) {
        const { error } = await supabase.from('members').update(payload).eq('id', existing.id);
        if (error) {
          console.error(`Error updating ${m.name}:`, error.message);
          errors++;
        } else {
          console.log(`  Updated: ${m.name}`);
          updated++;
        }
      } else if (findError && findError.code === 'PGRST116') {
        const { error } = await supabase.from('members').insert([payload]);
        if (error) {
          console.error(`Error inserting ${m.name}:`, error.message);
          errors++;
        } else {
          console.log(`  Inserted: ${m.name}`);
          inserted++;
        }
      } else if (findError) {
        console.error(`Error finding ${m.name}:`, findError.message);
        errors++;
      }
    } else {
      const { data: existing, error: findError } = await supabase
        .from('members')
        .select('id')
        .eq('name', m.name)
        .single();

      if (existing) {
        const { error } = await supabase.from('members').update(payload).eq('id', existing.id);
        if (error) {
          console.error(`Error updating ${m.name}:`, error.message);
          errors++;
        } else {
          console.log(`  Updated (by name): ${m.name}`);
          updated++;
        }
      } else {
        const { error } = await supabase.from('members').insert([payload]);
        if (error) {
          console.error(`Error inserting ${m.name}:`, error.message);
          errors++;
        } else {
          console.log(`  Inserted (no email): ${m.name}`);
          inserted++;
        }
      }
    }
  }

  console.log(`\nDone! ${MEMBERS.length} members processed.`);
  console.log(`Inserted: ${inserted}, Updated: ${updated}, Errors: ${errors}`);

  const csvEmails = new Set(MEMBERS.filter((m) => m.email).map((m) => m.email.toLowerCase()));
  const { data: allMembers, error: allErr } = await supabase.from('members').select('id, name, email');
  if (!allErr && allMembers) {
    const obsolete = allMembers.filter((m) => !m.email || !csvEmails.has(m.email.toLowerCase()));
    if (obsolete.length) {
      console.log(`\n${obsolete.length} membro(s) no banco NÃO estão na lista do CSV atual (não foram removidos automaticamente):`);
      obsolete.forEach((m) => console.log(`  #${m.id}  ${m.name}  (${m.email || 'sem email'})`));
      console.log('\nRevise essa lista antes de apagá-los manualmente — membros vinculados a um usuário ou a solicitações de indisponibilidade não devem ser removidos sem antes desvincular esses registros.');
    }
  }
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
