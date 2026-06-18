// ═══ SEED MEMBERS FROM CSV DATA ═══
// Run: node seed-members.js
// This creates/updates the members table in Supabase with all employee data

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const MEMBERS = [
  { name: 'Adriane Boni de Andrade', squad: null, area: 'Account Partner', operacoes: true, funcao: 'Atendimento Sr', report_to: 'Lucas Soares', email: 'adriane.boni@macfor.com.br', day_offs: 20 },
  { name: 'Adriano Lopes Monteiro', squad: 'Syngenta', area: 'Creative', operacoes: true, funcao: 'Creative Senior Captain', report_to: 'Hugo Oliveira', email: 'adriano.monteiro@macfor.com.br', day_offs: 20 },
  { name: 'Alexia Oliveira', squad: 'Team development', area: 'TA&I', operacoes: false, funcao: 'Talent Attraction & Inclusion Intermediate II', report_to: 'Barbara Occhiuzzi', email: 'alexia.oliveira@macfor.com.br', day_offs: 20 },
  { name: 'Alice Paschoal', squad: 'Business Development', area: 'Corporate Marketing', operacoes: false, funcao: 'Corporate Marketing Captain I', report_to: 'Fabricio Macias', email: 'alice.paschoal@macfor.com.br', day_offs: 20 },
  { name: 'Allan Couto', squad: 'Business Development', area: 'Creative', operacoes: true, funcao: 'rm', report_to: 'Hugo Oliveira', email: 'allan.couto@macfor.com.br', day_offs: 20 },
  { name: 'Amanda Arduini', squad: null, area: 'Account Partner', operacoes: true, funcao: 'Account Partner Technical Expert I', report_to: 'Gisele Pozavski', email: 'amanda.arduini@macfor.com.br', day_offs: 30 },
  { name: 'Amanda Campos', squad: null, area: 'Technical', operacoes: true, funcao: 'Content Advanced I', report_to: 'Victor Coleta', email: 'amanda.campos@macfor.com.br', day_offs: 30 },
  { name: 'Amanda Meneghel', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative Intermediate III', report_to: 'Gustavo Stancial', email: 'amanda.meneghel@macfor.com.br', day_offs: 20 },
  { name: 'Ana Carolina Serejo Anitablian', squad: 'Business Development', area: 'Corporate Marketing', operacoes: false, funcao: 'Corporate Marketing Intermediate I', report_to: 'Alice Paschoal', email: 'ana.serejo@macfor.com.br', day_offs: 20 },
  { name: 'Ana Julia Ledo', squad: 'Business Development', area: 'Market Intelligence', operacoes: false, funcao: 'Market Intelligence Beginner I', report_to: 'Mariana Batista', email: 'julia.ledo@macfor.com.br', day_offs: 20 },
  { name: 'Ana Luisa Lokschin', squad: null, area: 'Content', operacoes: false, funcao: 'Content Advanced III', report_to: 'Daniela Leite', email: 'analuisa.lokschin@macfor.com.br', day_offs: 20 },
  { name: 'Ariane Parreira', squad: null, area: 'Content', operacoes: false, funcao: 'Content Advanced', report_to: 'Daniela Leite', email: 'ariane.parreira@macfor.com.br', day_offs: 20 },
  { name: 'Barbara Occhiuzzi', squad: 'Team development', area: 'TA&I', operacoes: false, funcao: 'Team Development Senior Captain I', report_to: 'Fabricio Macias', email: 'barbara.occhiuzzi@macfor.com.br', day_offs: 20 },
  { name: 'Barbara Ragio de Jesus', squad: 'Health', area: 'Account Partner', operacoes: true, funcao: 'Account Partner Senior Captain I', report_to: 'Fabricio Macias', email: 'barbara.ragio@macfor.com.br', day_offs: 20 },
  { name: 'Beatriz Alvarenga', squad: 'Support', area: 'Support', operacoes: false, funcao: 'Support Financial Intermediate I', report_to: 'Sonia Pereira', email: 'beatriz.alvarenga@macfor.com.br', day_offs: 30 },
  { name: 'Beatriz da Silva Vasconcelos', squad: null, area: 'Projetos/Operacoes', operacoes: true, funcao: 'Analista de Projetos', report_to: 'Mariana Batista', email: 'beatriz.vasconcelos@macfor.com.br', day_offs: 20 },
  { name: 'Beatriz dos Santos Leal', squad: 'Syngenta', area: 'Media Guild', operacoes: true, funcao: 'Media Intermediate II', report_to: 'Willian Jacob', email: 'beatriz.leal@macfor.com.br', day_offs: 20 },
  { name: 'Brena Stephanie Ramos Alves', squad: 'Business Development', area: 'Market Intelligence', operacoes: false, funcao: 'Market Intelligence Advanced I', report_to: 'Thales Praxedes', email: 'brena.alves@macfor.com.br', day_offs: 20 },
  { name: 'Breno Barbosa Latorre', squad: null, area: 'Media Guild', operacoes: true, funcao: 'Media Advanced I', report_to: 'Gabriel Contartesi', email: 'breno.latorre@macfor.com.br', day_offs: 20 },
  { name: 'Carlos Alberto Rocha', squad: 'Business Development', area: 'Corporate Marketing Creative', operacoes: false, funcao: 'Creative Advanced III', report_to: 'Thiago Adriano', email: 'carlos.rocha@macfor.com.br', day_offs: 20 },
  { name: 'Carolina Pardini Baldoni', squad: 'Syngenta', area: 'Content', operacoes: true, funcao: 'Content Advanced', report_to: 'Allan Couto', email: 'carolina.pardini@macfor.com.br', day_offs: 20 },
  { name: 'Cecilia Medeiros Souza', squad: 'Business Development', area: 'Market Intelligence', operacoes: false, funcao: 'CRM & Jornadas Advanced I', report_to: 'Fabricio Macias', email: 'cecilia.medeiros@macfor.com.br', day_offs: 20 },
  { name: 'Daniel Sousa da Silva', squad: null, area: 'Planejamento', operacoes: true, funcao: 'Planner Senior Captain', report_to: 'Hugo Oliveira', email: 'daniel.sousa@macfor.com.br', day_offs: 20 },
  { name: 'Daniela Leite', squad: null, area: 'Content', operacoes: true, funcao: 'Content Captain I', report_to: 'Hugo Oliveira', email: 'daniela.leite@macfor.com.br', day_offs: 20 },
  { name: 'Daniele Campos', squad: null, area: 'Quality', operacoes: true, funcao: 'Quality Technical Expert I', report_to: 'Mariana Batista', email: 'daniele.campos@macfor.com.br', day_offs: 0 },
  { name: 'Danielle Santos Araujo', squad: 'Business Development', area: 'Trafego', operacoes: false, funcao: 'Analista de Tráfego Interno', report_to: 'Thiago Pereira', email: 'danielle.araujo@macfor.com.br', day_offs: 20 },
  { name: 'Darlete Nobre', squad: 'Support', area: 'Support', operacoes: false, funcao: 'Support Financial Intermediate I', report_to: 'Sonia Pereira', email: 'darlete.nobre@macfor.com.br', day_offs: 30 },
  { name: 'Dayane Lima', squad: 'Business Development', area: 'Corporate Marketing', operacoes: false, funcao: 'Corporate Marketing Team Technical Expert I', report_to: 'Fabricio Macias', email: 'dayane.lima@macfor.com.br', day_offs: 20 },
  { name: 'Denise Bosisio', squad: 'Business Development', area: 'Market Intelligence', operacoes: false, funcao: 'Market Intelligence Technical Expert I', report_to: 'Fabricio Macias', email: 'denise.bosisio@macfor.com.br', day_offs: 20 },
  { name: 'Diogo Luchiari', squad: null, area: 'Projetos/Operacoes', operacoes: true, funcao: 'AG Services Coach Senior III', report_to: null, email: 'diogo@macfor.com.br', day_offs: 0 },
  { name: 'Eduarda Fernandes Carneiro', squad: null, area: 'TA&I', operacoes: false, funcao: 'Talent Attraction & Inclusion Beginner I', report_to: 'Barbara Occhiuzzi', email: 'eduarda.carneiro@macfor.com.br', day_offs: 20 },
  { name: 'Eduarda Vaz de Freitas', squad: null, area: 'Account Partner', operacoes: true, funcao: 'Account Partner Advanced I', report_to: 'Lucas Soares', email: 'eduarda.freitas@macfor.com.br', day_offs: 20 },
  { name: 'Eduardo Dias', squad: 'Business Development', area: 'Corporate Marketing', operacoes: false, funcao: 'Corporate Marketing Creative Technical Expert I', report_to: 'Thiago Pereira', email: 'eduardo.dias@macfor.com.br', day_offs: 20 },
  { name: 'Elysabeth Barcellos', squad: null, area: 'Content', operacoes: true, funcao: 'Content Intermediate III', report_to: 'Victor Coleta', email: 'elysabeth.barcellos@macfor.com.br', day_offs: 20 },
  { name: 'Emanuelle Costa', squad: 'Syngenta', area: 'Content', operacoes: true, funcao: 'Content Intermediate', report_to: 'Allan Couto', email: 'emanuelle.costa@macfor.com.br', day_offs: 20 },
  { name: 'Fabricio Macias', squad: 'Business Development', area: null, operacoes: false, funcao: 'CO CEO & BD & TD Coach', report_to: 'Guilherme Castilho', email: 'fabricio@macfor.com.br', day_offs: 0 },
  { name: 'Felipe Euller Costa Parente', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative Technical Expert', report_to: 'Guilherme Mortale', email: 'felipe.euller@macfor.com.br', day_offs: 20 },
  { name: 'Felipe Marcassa', squad: 'Business Development', area: 'Corporate Marketing', operacoes: false, funcao: 'Corporate Marketing Senior Captain I', report_to: 'Fabricio Macias', email: 'felipe.marcassa@macfor.com.br', day_offs: 20 },
  { name: 'Frederico Palma da Matta', squad: null, area: 'Account Partner', operacoes: true, funcao: 'Account Partner Coach', report_to: 'Diogo Luchiari', email: 'fred.palma@macfor.com.br', day_offs: 20 },
  { name: 'Gabriel Barros de Oliveira', squad: null, area: 'SEO', operacoes: true, funcao: 'SEO Advanced II', report_to: 'Michelle Oliveira', email: 'gabriel.oliveira@macfor.com.br', day_offs: 20 },
  { name: 'Gabriel Contartesi', squad: null, area: 'Media Guild', operacoes: true, funcao: 'Digital Media Guild Captain II', report_to: 'Guilherme Castilho', email: 'gabriel.contartesi@macfor.com.br', day_offs: 20 },
  { name: 'Gabriel da Silva Porto', squad: 'Business Development', area: 'P&A', operacoes: false, funcao: 'P&A Beginner', report_to: 'Rafael Portella', email: 'gabriel.porto@macfor.com.br', day_offs: 20 },
  { name: 'Gabriel Henrique Barros Vilela', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative Intermediate I', report_to: 'Joao Camargo', email: 'gabriel.vilela@macfor.com.br', day_offs: 20 },
  { name: 'Gabriel Moura Castelo Branco', squad: 'Syngenta', area: 'Creative', operacoes: true, funcao: 'Creative Advanced', report_to: 'Guilherme Mortale', email: 'gabriel.moura@macfor.com.br', day_offs: 20 },
  { name: 'Gabriel Pereira Rodrigues', squad: null, area: 'Planejamento', operacoes: true, funcao: 'Planner Technical Expert', report_to: 'Luiz Guedes', email: null, day_offs: 20 },
  { name: 'Gabriela Farias', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative Advanced III', report_to: 'Mariana Batista', email: 'gabriela.farias@macfor.com.br', day_offs: 20 },
  { name: 'Gabriela Gomes de Almeida', squad: null, area: 'Planejamento', operacoes: true, funcao: 'Planner Advanced III', report_to: 'Luiz Guedes', email: 'gabriela.almeida@macfor.com.br', day_offs: 20 },
  { name: 'Gabriela Silva Souza', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative Advanced', report_to: 'Gustavo Stancial', email: 'gabriela.souza@macfor.com.br', day_offs: 20 },
  { name: 'Gabriele Gois', squad: null, area: 'Content', operacoes: true, funcao: 'Content Intermediate II', report_to: 'Daniele Leite', email: 'gabriele.gois@macfor.com.br', day_offs: 20 },
  { name: 'Gabriella Fontoura Goncalves', squad: null, area: 'SEO', operacoes: true, funcao: 'Content SEO Advanced I', report_to: 'Michelle Oliveira', email: 'gabriella.fontoura@macfor.com.br', day_offs: 20 },
  { name: 'Gisele Pozavski', squad: null, area: 'Account Partner', operacoes: true, funcao: 'Account Partner Senior Captain I', report_to: 'Victor Coleta', email: 'gisele.pozavski@macfor.com.br', day_offs: 0 },
  { name: 'Guilherme Andrade', squad: 'Analytics', area: 'Analytics', operacoes: true, funcao: 'Tech Leader Advanced II', report_to: 'Mariana Batista', email: 'guilherme.andrade@macfor.com.br', day_offs: 0 },
  { name: 'Guilherme Bezerra Santos', squad: 'Analytics', area: 'Analytics', operacoes: true, funcao: 'Tech Trainee', report_to: 'Mariana Batista', email: 'guilherme.bezerra@macfor.com.br', day_offs: 20 },
  { name: 'Guilherme Castilho Pinto', squad: null, area: 'Media Guild', operacoes: true, funcao: 'Media and Performance Captain II', report_to: 'Diogo Luchiari', email: 'guilherme.castilho@macfor.com.br', day_offs: 20 },
  { name: 'Guilherme Mourao', squad: null, area: 'Media Guild', operacoes: true, funcao: 'Digital Media & BI Advanced III', report_to: 'Willian Jacob', email: 'guilherme.mourao@macfor.com.br', day_offs: 20 },
  { name: 'Guilherme Sartori', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative Advanced I', report_to: 'Joao Camargo', email: 'guilherme.sartori@macfor.com.br', day_offs: 20 },
  { name: 'Guilherme Victor Mortale', squad: 'Syngenta', area: 'Creative', operacoes: true, funcao: 'Creative Senior Captain I', report_to: 'Hugo Oliveira', email: 'guilherme.mortale@macfor.com.br', day_offs: 20 },
  { name: 'Gustavo Paulista', squad: 'Business Development', area: 'P&A', operacoes: false, funcao: 'SME Alliances Technical Expert I', report_to: 'Rafael Portella', email: 'gustavo.paulista@macfor.com.br', day_offs: 20 },
  { name: 'Gustavo Rocha', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative Advanced I', report_to: 'Gustavo Stancial', email: 'gustavo.rocha@macfor.com.br', day_offs: 20 },
  { name: 'Gustavo Romao', squad: 'Analytics', area: 'Analytics', operacoes: true, funcao: 'AI Tech Lead', report_to: 'Mariana Batista', email: 'gustavo.romao@macfor.com.br', day_offs: 0 },
  { name: 'Gustavo Stancial', squad: 'Enterprise', area: 'Creative', operacoes: true, funcao: 'Creative Senior Captain I', report_to: 'Hugo Oliveira', email: 'gustavo.stancial@macfor.com.br', day_offs: 20 },
  { name: 'Heloisa Franchin', squad: null, area: 'Account Partner', operacoes: true, funcao: 'Account Partner Advanced III', report_to: 'Natalia Elias', email: 'heloisa.franchin@macfor.com.br', day_offs: 20 },
  { name: 'Henrique Fernando de Almeida', squad: 'Analytics', area: 'Analytics', operacoes: true, funcao: 'Web Analytics Intermediate II', report_to: 'Guilherme Andrade', email: 'henrique.almeida@macfor.com.br', day_offs: 20 },
  { name: 'Henrique Goncalves', squad: 'Business Development', area: 'P&A', operacoes: false, funcao: 'SME Alliances Technical Expert I', report_to: 'Rafael Portella', email: 'henrique.goncalves@macfor.com.br', day_offs: 20 },
  { name: 'Hickson Silva', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative Captain', report_to: 'Hugo Oliveira', email: 'hickson.silva@macfor.com.br', day_offs: 20 },
  { name: 'Hugo Oliveira', squad: null, area: 'Creative', operacoes: true, funcao: 'Services Digital Coach', report_to: 'Diogo Luchiari', email: 'hugo.oliveira@macfor.com.br', day_offs: 30 },
  { name: 'Jady Cristina Silva', squad: 'Business Development', area: 'Corporate Marketing', operacoes: false, funcao: 'BI & Digital Team Technical Expert I', report_to: 'Fabricio Macias', email: 'jady.silva@macfor.com.br', day_offs: 20 },
  { name: 'Jessica Lopes', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative Advanced I', report_to: 'Joao Camargo', email: 'jessica.lopes@macfor.com.br', day_offs: 20 },
  { name: 'Jessica Zambeli', squad: null, area: 'Content', operacoes: true, funcao: 'Content Intermediate II', report_to: 'Victor Coleta', email: 'jessica.zambeli@macfor.com.br', day_offs: 20 },
  { name: 'Joao Camargo', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative Team Technical Expert I', report_to: 'Hugo Oliveira', email: 'joao.camargo@macfor.com.br', day_offs: 20 },
  { name: 'Joao Neto', squad: null, area: 'Planejamento', operacoes: true, funcao: 'Project Management Intermediate III', report_to: 'Mariana Batista', email: 'joao.neto@macfor.com.br', day_offs: 0 },
  { name: 'Joao Pedro Garcia Fernandes', squad: null, area: 'SEO', operacoes: true, funcao: 'Content SEO Advanced I', report_to: 'Michelle Oliveira', email: 'joao.fernandes@macfor.com.br', day_offs: 20 },
  { name: 'Johann Stancik', squad: 'Business Development', area: 'Creative', operacoes: false, funcao: 'Creative Technical Expert I', report_to: 'Thiago Pereira', email: 'johann.stancik@macfor.com.br', day_offs: 20 },
  { name: 'Jose Fortunato', squad: null, area: 'Analytics', operacoes: true, funcao: 'CO CEO & Multi Services Senior Captain', report_to: null, email: 'jose@macfor.com.br', day_offs: 0 },
  { name: 'Juliana Fagundes dos Santos', squad: 'Team development', area: 'TA&I', operacoes: false, funcao: 'Talent Attraction & Inclusion Intermediate II', report_to: 'Barbara Occhiuzzi', email: 'juliana.fagundes@macfor.com.br', day_offs: 20 },
  { name: 'Juliana Gaspar Pessoa Leal Leite', squad: 'Syngenta', area: 'Account Partner', operacoes: true, funcao: 'Account Partner Advanced I', report_to: 'Sandra Soares', email: null, day_offs: 20 },
  { name: 'Juliana Silva Bueno', squad: 'Business Development', area: 'P&A', operacoes: false, funcao: 'P&A Discovery Intermediate', report_to: 'Rafael Portella', email: null, day_offs: 20 },
  { name: 'Juliano Castro', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative Technical Expert II', report_to: 'Joao Camargo', email: 'juliano.castro@macfor.com.br', day_offs: 20 },
  { name: 'Julio Cezar', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative Technical Expert', report_to: 'Guilherme Mortale', email: 'julio.silva@macfor.com.br', day_offs: 20 },
  { name: 'Kaique Oliveira', squad: null, area: 'Account Partner', operacoes: true, funcao: 'Account Partner Captain I', report_to: 'Diogo Luchiari', email: 'kaique.oliveira@macfor.com.br', day_offs: 20 },
  { name: 'Karolyne Alves Franco', squad: null, area: 'Content', operacoes: true, funcao: 'Content Intermediate', report_to: 'Daniela Leite', email: 'karolyne.franco@macfor.com.br', day_offs: 20 },
  { name: 'Katia Pedroza e Silva', squad: null, area: 'Projetos/Operacoes', operacoes: true, funcao: 'Assistente de Operações de Marketing', report_to: 'Mariana Batista', email: 'katia.silva@macfor.com.br', day_offs: 20 },
  { name: 'Leonardo Bocchini Ruiz', squad: null, area: 'Content', operacoes: true, funcao: 'Content Intermediate', report_to: 'Daniela Leite', email: 'leonardo.ruiz@macfor.com.br', day_offs: 20 },
  { name: 'Leonardo Felippe', squad: null, area: 'Account Partner', operacoes: true, funcao: 'Account Partner Advanced I', report_to: 'Kaique Oliveira', email: 'leonardo.felippe@macfor.com.br', day_offs: 20 },
  { name: 'Leonardo Lanjoni', squad: null, area: 'SEO', operacoes: true, funcao: 'SEO Intermediate I', report_to: 'Michelle Oliveira', email: 'leonardo.lanjoni@macfor.com.br', day_offs: 0 },
  { name: 'Livia Gondim dos Santos', squad: null, area: 'Media Guild', operacoes: true, funcao: 'Media Advanced III', report_to: 'Gabriel Contartesi', email: 'livia.gondim@macfor.com.br', day_offs: 20 },
  { name: 'Lorena Martinez Laporti', squad: 'Syngenta', area: 'Creative', operacoes: true, funcao: 'Creative Advanced', report_to: 'Guilherme Mortale', email: 'lorena.martinez@macfor.com.br', day_offs: 20 },
  { name: 'Lucas Maia dos Santos Azevedo', squad: 'Business Development', area: 'Creative', operacoes: true, funcao: 'Creative Intermediate I', report_to: null, email: null, day_offs: 20 },
  { name: 'Lucas Soares', squad: null, area: 'Account Partner', operacoes: true, funcao: 'Project Management Senior Captain I', report_to: 'Jose Fortunato', email: 'lucas@macfor.com.br', day_offs: 20 },
  { name: 'Luciana Almeida da Hora', squad: 'Business Development', area: 'Corporate Marketing', operacoes: false, funcao: 'Creative Intermediate I', report_to: 'Thiago Adriano', email: 'luciana.almeida@macfor.com.br', day_offs: 20 },
  { name: 'Luisa Almeida Amorim', squad: 'Team development', area: 'TA&I', operacoes: false, funcao: 'Talent Attraction & Inclusion Beginner I', report_to: 'Barbara Occhiuzzi', email: 'luisa.amorim@macfor.com.br', day_offs: 20 },
  { name: 'Luiz Guedes', squad: null, area: 'Planejamento', operacoes: true, funcao: 'Project Management Senior Captain I', report_to: 'Hugo Oliveira', email: 'luiz.guedes@macfor.com.br', day_offs: 30 },
  { name: 'Marcelo Blanco', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative Team Technical Expert', report_to: 'Guilherme Mortale', email: 'marcelo.blanco@macfor.com.br', day_offs: 20 },
  { name: 'Marcelo Borini', squad: 'Syngenta', area: 'Creative', operacoes: true, funcao: 'Creative Advanced', report_to: 'Guilherme Mortale', email: 'marcelo.borini@macfor.com.br', day_offs: 20 },
  { name: 'Mare Almeida', squad: 'Business Development', area: 'P&A', operacoes: false, funcao: 'P&A Intermediate I', report_to: 'Rafael Portella', email: 'mare.almeida@macfor.com.br', day_offs: 20 },
  { name: 'Maria Carolina Juliani Ribas', squad: 'Business Development', area: 'Corporate Marketing', operacoes: false, funcao: 'Corporate Marketing Creative Beginner', report_to: 'Thiago Adriano', email: 'maria.ribas@macfor.com.br', day_offs: 20 },
  { name: 'Maria Clara Oliveira Pelegrini', squad: 'Health', area: 'Account Partner', operacoes: true, funcao: 'Account Partner Advanced I', report_to: 'Barbara Ragio', email: null, day_offs: 20 },
  { name: 'Maria Helena Denck Almeida', squad: null, area: 'Content', operacoes: true, funcao: 'Content Intermediate I', report_to: 'Daniela Leite', email: 'helena.denck@macfor.com.br', day_offs: 20 },
  { name: 'Mariana Batista dos Santos', squad: null, area: 'Projetos/Operacoes', operacoes: true, funcao: 'Project Management Senior Captain I', report_to: 'Victor Coleta', email: 'mariana.batista@macfor.com.br', day_offs: 20 },
  { name: 'Mariana Helena Ducate Lanconi', squad: null, area: 'Media', operacoes: true, funcao: 'Media Intermediate I', report_to: 'Gabriel Contartesi', email: 'mariana.ducate@macfor.com.br', day_offs: 20 },
  { name: 'Mariana Tita', squad: null, area: null, operacoes: false, funcao: 'Media Intermediate I', report_to: 'Willian Jacob', email: 'mariana.tita@macfor.com.br', day_offs: 20 },
  { name: 'Marina Franco Martins', squad: null, area: 'Content', operacoes: true, funcao: 'Content Advanced III', report_to: 'Allan Couto', email: 'marina.franco@macfor.com.br', day_offs: 20 },
  { name: 'Marina Giglioli', squad: 'Team development', area: 'TA&I', operacoes: false, funcao: 'Talent Attraction & Inclusion Technical Expert I', report_to: 'Barbara Occhiuzzi', email: 'marina.giglioli@macfor.com.br', day_offs: 20 },
  { name: 'Mario Marques de Brito Junior', squad: 'Business Development', area: 'P&A', operacoes: false, funcao: 'BDR', report_to: null, email: 'mario.marques@macfor.com.br', day_offs: 20 },
  { name: 'Maryna Falcao', squad: null, area: 'Quality', operacoes: true, funcao: 'Quality Intermediate I', report_to: 'Daniela Leite', email: 'maryna.falcao@macfor.com.br', day_offs: 20 },
  { name: 'Matheus Edmundo do Nascimento', squad: 'Syngenta', area: 'Projetos/Operacoes', operacoes: true, funcao: 'Project Management Intermediate', report_to: 'Mariana Batista', email: 'matheus.edmundo@macfor.com.br', day_offs: 20 },
  { name: 'Michelle Oliveira', squad: 'SEO', area: 'SEO', operacoes: true, funcao: 'SEO Captain I', report_to: 'Guilherme Castilho', email: 'michelle.oliveira@macfor.com.br', day_offs: 20 },
  { name: 'Munyke Melo Alves de Santana', squad: 'SEO', area: 'SEO', operacoes: true, funcao: 'SEO Advanced II', report_to: 'Michelle Oliveira', email: 'munyke.melo@macfor.com.br', day_offs: 20 },
  { name: 'Naiana Vianna', squad: null, area: 'Content', operacoes: true, funcao: 'Content Intermediate II', report_to: 'Allan Couto', email: 'naiana.vianna@macfor.com.br', day_offs: 20 },
  { name: 'Nata Oliveira Silva', squad: 'Business Development', area: 'Market Intelligence', operacoes: false, funcao: 'Market Intelligence Technical Expert I', report_to: 'Thales Praxedes', email: 'nata.oliveira@macfor.com.br', day_offs: 20 },
  { name: 'Natalia do Prado Campos', squad: 'Business Development', area: 'P&A', operacoes: false, funcao: 'BDR', report_to: 'Thiago Pereira', email: 'natalia.campos@macfor.com.br', day_offs: 20 },
  { name: 'Natalia Novaes Elias', squad: null, area: 'Account Partner', operacoes: true, funcao: 'Account Partner Captain I', report_to: 'Victor Coleta', email: 'natalia.elias@macfor.com.br', day_offs: 20 },
  { name: 'Nathalia Carpes Pes', squad: 'Business Development', area: null, operacoes: false, funcao: 'Public Relations Intermediate I', report_to: 'Alice Paschoal', email: null, day_offs: 20 },
  { name: 'Odara Santos', squad: null, area: 'Content', operacoes: true, funcao: 'Content Beginner', report_to: 'Allan Couto', email: 'odara.santos@macfor.com.br', day_offs: 20 },
  { name: 'Pedro Augusto Silveira de Almeida Veloso', squad: null, area: 'Content', operacoes: true, funcao: 'Content Advanced', report_to: 'Daniela Leite', email: 'pedro.veloso@macfor.com.br', day_offs: 20 },
  { name: 'Pedro Luan Ferreira da Silva', squad: 'Syngenta', area: 'Content', operacoes: true, funcao: 'Content Intermediate', report_to: 'Victor Coleta', email: 'pedro.ferreira@macfor.com.br', day_offs: 20 },
  { name: 'Rafael Menezes Goncalves', squad: 'Business Development', area: 'Market Intelligence', operacoes: false, funcao: 'IA & Tech Beginner I', report_to: 'Fabricio Macias', email: 'rafael.goncalves@macfor.com.br', day_offs: 20 },
  { name: 'Rafael Sapia', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative Advanced', report_to: 'Hugo Oliveira', email: 'rafael.sapia@macfor.com.br', day_offs: 20 },
  { name: 'Rodrigo Massarente Favacho', squad: 'Health', area: 'Creative', operacoes: true, funcao: 'Creative Advanced I', report_to: 'Barbara Ragio', email: 'rodrigo.favacho@macfor.com.br', day_offs: 20 },
  { name: 'Ryan Silva', squad: 'Business Development', area: 'Corporate Marketing', operacoes: false, funcao: 'Corporate Marketing Intermediate I', report_to: 'Thiago Pereira', email: 'ryan.silva@macfor.com.br', day_offs: 20 },
  { name: 'Samuel Jose Xavier Fernandes', squad: 'Business Development', area: 'Corporate Marketing', operacoes: false, funcao: 'Content Advanced I', report_to: 'Thiago Adriano', email: 'samuel.fernandes@macfor.com.br', day_offs: 20 },
  { name: 'Sandra Garcia Soares', squad: null, area: 'Account Partner', operacoes: true, funcao: 'Account Partner Senior Captain I', report_to: 'Diogo Luchiari', email: 'sandra.soares@macfor.com.br', day_offs: 0 },
  { name: 'Sara Rodrigues de Oliveira', squad: null, area: 'Media', operacoes: true, funcao: 'Media Intermediate I', report_to: 'Gabriel Contartesi', email: 'sara.rodrigues@macfor.com.br', day_offs: 20 },
  { name: 'Sonia Pereira', squad: 'Support', area: 'Support', operacoes: false, funcao: 'Support Financial Captain III', report_to: 'Jose Fortunato', email: 'sonia@macfor.com.br', day_offs: 0 },
  { name: 'Stephanie Jesus Victorino', squad: 'Business Development', area: 'P&A', operacoes: false, funcao: 'Partnerships & Alliances Discovery Intermediate II', report_to: 'Rafael Portella', email: 'stephanie.victorino@macfor.com.br', day_offs: 20 },
  { name: 'Thales Praxedes', squad: 'Business Development', area: 'Market Intelligence', operacoes: false, funcao: 'Market Intelligence Senior Captain I', report_to: 'Fabricio Macias', email: 'thales.praxedes@macfor.com.br', day_offs: 20 },
  { name: 'Thalita Ferreira do Nascimento Beloni', squad: null, area: 'Content', operacoes: true, funcao: 'Content Advanced', report_to: 'Allan Couto', email: 'thalita.beloni@macfor.com.br', day_offs: 20 },
  { name: 'Thalita Roder da Silva', squad: 'Syngenta', area: 'Media Guild', operacoes: true, funcao: 'Media Intermediate III', report_to: 'Gabriel Contartesi', email: 'thalita.roder@macfor.com.br', day_offs: 20 },
  { name: 'Thiago Adriano da Silva', squad: 'Business Development', area: 'Corporate Marketing', operacoes: false, funcao: 'Head de Criação', report_to: 'Thiago Pereira', email: 'thiago.adriano@macfor.com.br', day_offs: 20 },
  { name: 'Thiago Pereira', squad: 'Business Development', area: 'P&A', operacoes: false, funcao: 'Enterprise Alliances Elite VI', report_to: 'Fabricio Macias', email: 'thiago.pereira@macfor.com.br', day_offs: 0 },
  { name: 'Thiago Rita', squad: null, area: 'Media Guild', operacoes: true, funcao: 'Digital Media Advanced I', report_to: 'Willian Jacob', email: 'thiago.rita@macfor.com.br', day_offs: 20 },
  { name: 'Valentina Neu', squad: null, area: 'Account Partner', operacoes: true, funcao: 'Account Partner Intermediate I', report_to: 'Sandra Soares', email: 'valentina.neu@macfor.com.br', day_offs: 20 },
  { name: 'Valeria Sara Lopes de Oliveira Silva', squad: 'Business Development', area: 'P&A', operacoes: false, funcao: 'Closer Assistant', report_to: null, email: 'valeria.silva@macfor.com.br', day_offs: 20 },
  { name: 'Victor Augusto de Souza', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative Advanced I', report_to: 'Guilherme Mortale', email: 'victor.augusto@macfor.com.br', day_offs: 20 },
  { name: 'Victor Coleta', squad: null, area: 'Technical', operacoes: true, funcao: 'Technical Senior Captain I', report_to: 'Diogo Luchiari', email: 'victor.coleta@macfor.com.br', day_offs: 20 },
  { name: 'Victoria Leticia Santos da Cunha Acioli', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative Advanced', report_to: 'Joao Camargo', email: 'victoria.acioli@macfor.com.br', day_offs: 20 },
  { name: 'Walderson Luiz da Silva Rocha', squad: null, area: 'Creative', operacoes: true, funcao: 'Creative Technical Expert I', report_to: 'Gustavo Stancial', email: 'walderson.rocha@macfor.com.br', day_offs: 20 },
  { name: 'Willian Jacob', squad: 'Syngenta', area: 'Media Guild', operacoes: true, funcao: 'Digital Media Captain I', report_to: 'Guilherme Castilho', email: 'willian.jacob@macfor.com.br', day_offs: 0 },
  { name: 'Wolnei Menegassi', squad: 'Business Development', area: 'Market Intelligence', operacoes: false, funcao: 'Market Intelligence Creative Technical Expert I', report_to: 'Fabricio Macias', email: 'wolnei@macfor.com.br', day_offs: 20 },
  { name: 'Felipe Cidade Soares', squad: 'Business Development', area: 'Market Intelligence', operacoes: false, funcao: 'Market Intelligence Beginner I', report_to: 'Jady Silva', email: null, day_offs: 20 },
  { name: 'Joao Victor Bazoti Brito Delgado', squad: 'Enterprise', area: 'Account Partner', operacoes: true, funcao: 'Account Partner Captain I', report_to: 'Diogo Luchiari', email: null, day_offs: 20 },
  { name: 'Beatriz de Souza Varela da Costa', squad: 'Syngenta', area: 'Content', operacoes: true, funcao: 'Social Advanced I', report_to: 'Allan Couto', email: null, day_offs: 20 },
  { name: 'Evelyn Barreto de Jesus', squad: 'Health', area: 'Patient Advocacy', operacoes: true, funcao: 'Patient Advocacy Intermediate I', report_to: 'Barbara Ragio', email: null, day_offs: 20 },
  { name: 'Joao Paulo da Silva Monteiro', squad: null, area: 'Tech', operacoes: true, funcao: 'Tech Intermediate II', report_to: 'Mariana Batista', email: null, day_offs: 20 },
  { name: 'Lucas Moura Alcantara', squad: null, area: 'IA', operacoes: true, funcao: 'AI Intermediate I', report_to: 'Gustavo Romao', email: null, day_offs: 20 }
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
    };

    if (m.email) {
      const { data: existing, error: findError } = await supabase
        .from('members')
        .select('id')
        .eq('email', m.email)
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
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});